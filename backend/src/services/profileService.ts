
import prisma from "../lib/prisma";
import { fetchPlatformStats } from "./platformFetcher";

export async function refreshStudentProfiles(studentId: string) {
    try {
        const student = await prisma.student.findUnique({
            where: { id: studentId },
            include: { codingProfiles: true }
        });

        if (!student) return;

        console.log(`[ProfileService] Auto-refreshing ${student.codingProfiles.length} profiles for student ${studentId}`);

        for (const cp of student.codingProfiles) {
            // Rate limit check: only refresh once per hour per platform
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
            if (cp.lastSynced && cp.lastSynced > oneHourAgo) {
                console.log(`[ProfileService] Skipping ${cp.platform} for ${studentId} (synced ${cp.lastSynced})`);
                continue;
            }

            try {
                const result = await fetchPlatformStats(cp.platform, cp.handle);
                if (result.verified) {
                    await prisma.codingProfile.update({
                        where: { id: cp.id },
                        data: {
                            stats: JSON.stringify(result.stats),
                            activityData: result.activity || (cp.activityData as any) || {},
                            lastSynced: new Date(),
                        },
                    });
                    console.log(`[ProfileService] Updated ${cp.platform} for ${studentId}`);
                }
            } catch (err) {
                console.error(`[ProfileService] Error refreshing ${cp.platform} for ${studentId}:`, err);
            }
        }
    } catch (error) {
        console.error(`[ProfileService] Fatal error in refreshStudentProfiles:`, error);
    }
}
