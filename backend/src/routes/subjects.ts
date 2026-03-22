import { Router, Request, Response } from "express";
import prisma from "../lib/prisma";

const router = Router();

// GET /api/subjects
router.get("/", async (req: Request, res: Response) => {
    try {
        const { semester } = req.query;
        const where: any = {};
        if (semester) where.semester = String(semester);

        const subjects = await prisma.subject.findMany({
            where,
            orderBy: { name: "asc" }
        });
        return res.json(subjects);
    } catch (error) {
        return res.status(500).json({ error: "Failed to load subjects" });
    }
});

export default router;
