
import prisma from "../lib/prisma";

/**
 * Recalculates and updates the coding streak for a student based on consolidated activity data
 * cross all linked platforms.
 */
export async function updateStudentStreak(studentId: string) {
    try {
        const student = await prisma.student.findUnique({
            where: { id: studentId },
            include: { codingProfiles: true }
        });

        if (!student) return 0;

        // Consolidate all activity dates
        const activityDates = new Set<string>();
        for (const profile of student.codingProfiles) {
            const data = profile.activityData as Record<string, number> | null;
            if (data) {
                Object.keys(data).forEach(date => activityDates.add(date));
            }
        }

        if (activityDates.size === 0) {
            if (student.streak !== 0) {
                await prisma.student.update({ where: { id: studentId }, data: { streak: 0 } });
            }
            return 0;
        }

        // Sort unique activity dates descending
        const sortedDates = Array.from(activityDates).sort((a, b) => b.localeCompare(a));
        
        let currentStreak = 0;
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

        // The streak is active if there is activity today OR yesterday
        let checkDate = sortedDates[0];
        if (checkDate !== today && checkDate !== yesterday) {
            // Streak broken
            if (student.streak !== 0) {
                await prisma.student.update({ where: { id: studentId }, data: { streak: 0 } });
            }
            return 0;
        }

        // Count backwards
        let lastDate: string | null = null;
        for (const dateStr of sortedDates) {
            if (lastDate === null) {
                currentStreak = 1;
                lastDate = dateStr;
                continue;
            }

            const current = new Date(dateStr);
            const prev = new Date(lastDate);
            const diffInDays = Math.round((prev.getTime() - current.getTime()) / (1000 * 60 * 60 * 24));

            if (diffInDays === 1) {
                currentStreak++;
                lastDate = dateStr;
            } else {
                // Streak broken
                break;
            }
        }

        // Update database if changed
        if (student.streak !== currentStreak) {
            await prisma.student.update({
                where: { id: studentId },
                data: { streak: currentStreak }
            });
        }

        return currentStreak;
    } catch (error) {
        console.error(`[StreakService] Error updating streak for student ${studentId}:`, error);
        return 0;
    }
}
