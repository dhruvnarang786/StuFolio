
import prisma from "../backend/src/lib/prisma";
import { updateStudentStreak } from "../backend/src/services/streakService";

async function bulkUpdate() {
    console.log("--- Bulk Streak Update ---");
    const students = await prisma.student.findMany();
    console.log(`Updating streaks for ${students.length} students...`);
    
    let updated = 0;
    for (const student of students) {
        const streak = await updateStudentStreak(student.id);
        if (streak > 0) {
            console.log(`Student ${student.id} (${student.enrollment}): Streak ${streak}`);
            updated++;
        }
    }
    
    console.log(`Bulk update complete. ${updated} students have active streaks.`);
}

bulkUpdate().catch(console.error).finally(() => prisma.$disconnect());
