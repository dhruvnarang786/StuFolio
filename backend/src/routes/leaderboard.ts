import { Router, Response } from "express";
import prisma from "../lib/prisma";
import { AuthRequest, authenticateToken } from "../middleware/auth";

const router = Router();

// GET /api/leaderboard — ranked students (privacy-safe)
router.get("/", authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const { tab = "overall", filter = "all" } = req.query;

        let whereClause: any = {};

        if (filter === "my_students") {
            let section = null;
            if (req.user?.role === "MENTOR") {
                const mentor = await prisma.mentor.findUnique({
                    where: { userId: req.user.userId },
                    select: { section: true }
                });
                section = mentor?.section;
            } else if (req.user?.role === "STUDENT") {
                const student = await prisma.student.findUnique({
                    where: { userId: req.user.userId },
                    select: { section: true }
                });
                section = student?.section;
            }

            if (section) {
                whereClause.section = section;
            }
        }

        const students = await prisma.student.findMany({
            where: whereClause,
            include: {
                user: { select: { name: true } },
                codingProfiles: true,
                attendances: true,
            },
            orderBy: { cgpa: "desc" },
        });

        const leaderboard = students.map((s, index) => {
            // Calculate coding score from profiles
            const totalProblems = s.codingProfiles.reduce((sum, cp) => {
                const stats = JSON.parse(cp.stats) as { label: string; value: string }[];
                const solved = stats.find((st) => st.label.toLowerCase().includes("solved"));
                return sum + (solved ? parseInt(solved.value.replace(/,/g, "")) || 0 : 0);
            }, 0);

            // Overall attendance
            const totalAtt = s.attendances.reduce((sum, a) => sum + a.attended, 0);
            const totalClasses = s.attendances.reduce((sum, a) => sum + a.total, 0);
            const attPct = totalClasses > 0 ? (totalAtt / totalClasses) * 100 : 0;

            // Composite score (weighted)
            const compositeScore = Number(
                (s.cgpa * 10 * 0.4 + Math.min(totalProblems / 5, 100) * 0.35 + attPct * 0.25).toFixed(1)
            );

            return {
                rank: index + 1,
                name: s.user.name,
                section: s.section,
                compositeScore,
                cgpa: s.cgpa,
                problemsSolved: totalProblems,
                streak: s.streak,
                attendance: Math.round(attPct),
            };
        });

        // Sort based on tab
        if (tab === "coding") {
            leaderboard.sort((a, b) => b.problemsSolved - a.problemsSolved);
        } else if (tab === "academic") {
            leaderboard.sort((a, b) => b.cgpa - a.cgpa);
        } else {
            leaderboard.sort((a, b) => b.compositeScore - a.compositeScore);
        }

        // Re-rank after sort
        leaderboard.forEach((entry, i) => (entry.rank = i + 1));

        return res.json(leaderboard);
    } catch (error: any) {
        console.error("Leaderboard error:", error);
        return res.status(500).json({ error: "Failed to load leaderboard" });
    }
});

export default router;
