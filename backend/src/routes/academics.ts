import { Router, Request, Response } from "express";
import prisma from "../lib/prisma";
import { authenticateToken } from "../middleware/auth";

const router = Router();

/**
 * GET /api/academics/subjects
 * Get subjects for a specific semester
 */
router.get("/subjects", authenticateToken, async (req: Request, res: Response) => {
    try {
        const { semester } = req.query;

        if (!semester) {
            return res.status(400).json({ error: "Semester is required" });
        }

        const subjects = await prisma.subject.findMany({
            where: {
                semester: semester as string,
            },
            orderBy: {
                name: "asc",
            },
        });

        return res.json(subjects);
    } catch (error: any) {
        console.error("Failed to fetch subjects:", error);
        return res.status(500).json({ error: "Failed to fetch subjects" });
    }
});

export default router;
