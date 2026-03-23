import prisma from "../src/lib/prisma";
import { AcademicSyncService } from "../src/services/academicSyncService";

async function testSyncLogic() {
    console.log("🧪 Testing Academic Sync Logic...");

    // 1. Find or create a test student
    let student = await prisma.student.findFirst({
        include: { user: true }
    });

    if (!student) {
        console.log("❌ No student found in DB. Please run seed first.");
        return;
    }

    console.log(`👤 Using student: ${student.user.name} (${student.enrollment})`);

    // 2. Mock scraped data
    const mockData = [
        { code: "BS202", name: "Probability Statistics And Linear Programming", marks: 85, grade: "A+", semester: "4th Semester" },
        { code: "HS204", name: "Technical Writing", marks: 90, grade: "O", semester: "4th Semester" },
        { code: "CS206", name: "Theory Of Computation", marks: 78, grade: "A", semester: "4th Semester" },
    ];

    console.log("📥 Simulating database update with mock marks...");
    
    // We access the private method for testing purposes (using any casting)
    await (AcademicSyncService as any).updateDatabaseWithScrapedData(student.id, mockData);

    // 3. Verify updates
    const updatedStudent = await prisma.student.findUnique({
        where: { id: student.id },
        include: { 
            academicRecords: { include: { subject: true } },
            semesterCGPAs: true
        }
    });

    console.log("\n📊 Verification Results:");
    console.log(`- New CGPA: ${updatedStudent?.cgpa}`);
    console.log(`- Total Records: ${updatedStudent?.academicRecords.length}`);
    
    updatedStudent?.semesterCGPAs.forEach(s => {
        console.log(`- ${s.semester} CGPA: ${s.cgpa}`);
    });

    updatedStudent?.academicRecords.slice(0, 3).forEach(r => {
        console.log(`  [${r.subject.code}] ${r.subject.name}: ${r.marks} (${r.grade})`);
    });

    if (updatedStudent && updatedStudent.cgpa > 0) {
        console.log("\n✅ Sync Logic Test Passed!");
    } else {
        console.log("\n❌ Sync Logic Test Failed (CGPA not calculated).");
    }
}

testSyncLogic()
    .catch(err => console.error("❌ Test errored:", err))
    .finally(() => prisma.$disconnect());
