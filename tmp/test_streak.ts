
import prisma from "../backend/src/lib/prisma";
import { updateStudentStreak } from "../backend/src/services/streakService";

async function test() {
    console.log("--- Streak Test ---");
    
    // Find a student
    const student = await prisma.student.findFirst({
        include: { codingProfiles: true }
    });

    if (!student) {
        console.error("No student found for testing");
        return;
    }

    console.log(`Testing with student: ${student.id} (Current streak: ${student.streak})`);

    // Mock some activity data for the last 3 days
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const dayBefore = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const mockActivity = {
        [today]: 5,
        [yesterday]: 3,
        [dayBefore]: 10
    };

    // Update one of the coding profiles with mock data
    if (student.codingProfiles.length > 0) {
        await prisma.codingProfile.update({
            where: { id: student.codingProfiles[0].id },
            data: { activityData: mockActivity }
        });
        console.log("Updated coding profile with 3-day streak mock data");
    } else {
        // Create one if none exists
        await prisma.codingProfile.create({
            data: {
                studentId: student.id,
                platform: "TestPlatform",
                handle: "test",
                stats: "[]",
                activityData: mockActivity
            }
        });
        console.log("Created test coding profile with 3-day streak mock data");
    }

    const newStreak = await updateStudentStreak(student.id);
    console.log(`New calculated streak: ${newStreak}`);

    if (newStreak === 3) {
        console.log("SUCCESS: Streak calculated correctly!");
    } else {
        console.error(`FAILURE: Expected 3, got ${newStreak}`);
    }
}

test().catch(console.error).finally(() => prisma.$disconnect());
