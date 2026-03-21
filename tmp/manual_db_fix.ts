
import prisma from "../backend/src/lib/prisma";

async function run() {
    console.log("--- Manual DB Fix ---");

    // 1. Remove all records of student named DemoA
    const demoUser = await prisma.user.findFirst({
        where: { name: "DemoA" },
        include: { student: true }
    });

    if (demoUser) {
        console.log(`Deleting DemoA (User ID: ${demoUser.id})...`);
        
        // Due to foreign key constraints, we might need to delete related records first 
        // if they aren't set to cascade.
        // Prisma schema shows many relations. Let's try deleting the student first.
        if (demoUser.student) {
            const studentId = demoUser.student.id;
            
            // Delete related tables manually if needed, but let's try the cascading delete if Prisma handles it or just use many deletes.
            await prisma.dailyAttendance.deleteMany({ where: { studentId } });
            await prisma.attendance.deleteMany({ where: { studentId } });
            await prisma.codingProfile.deleteMany({ where: { studentId } });
            await prisma.academicRecord.deleteMany({ where: { studentId } });
            await prisma.semesterCGPA.deleteMany({ where: { studentId } });
            await prisma.badge.deleteMany({ where: { studentId } });
            await prisma.studentSkill.deleteMany({ where: { studentId } });
            
            await prisma.student.delete({ where: { id: studentId } });
        }
        
        await prisma.notification.deleteMany({ where: { userId: demoUser.id } });
        await prisma.user.delete({ where: { id: demoUser.id } });
        
        console.log("SUCCESS: DemoA records removed.");
    } else {
        console.log("NOT FOUND: User 'DemoA' not found.");
    }

    // 2. Update Prerika Garg's CGPA
    const prerika = await prisma.user.findFirst({
        where: { name: { contains: "Prerika Garg", mode: "insensitive" } },
        include: { student: true }
    });

    if (prerika && prerika.student) {
        await prisma.student.update({
            where: { id: prerika.student.id },
            data: { cgpa: 8.32 }
        });
        console.log(`SUCCESS: Updated Prerika Garg's CGPA to 8.32.`);
    } else {
        console.log("NOT FOUND: User 'Prerika Garg' not found.");
    }
}

run().catch(console.error).finally(() => prisma.$disconnect());
