import { Router, Request, Response } from "express";
import prisma from "../lib/prisma";
import { AuthRequest, authenticateToken, requireRole } from "../middleware/auth";

const router = Router();

// GET /api/events — get events (optional month/year filter)
router.get("/", authenticateToken, async (req: AuthRequest, res: Response) => {
    try {
        const { month, year } = req.query;

        let where: any = {};

        if (month && year) {
            const startDate = new Date(Number(year), Number(month) - 1, 1);
            const endDate = new Date(Number(year), Number(month), 0, 23, 59, 59);
            where.date = { gte: startDate, lte: endDate };
        }

        const events = await prisma.event.findMany({
            where,
            orderBy: { date: "asc" },
        });

        return res.json(events);
    } catch (error: any) {
        console.error("Events error:", error);
        return res.status(500).json({ error: "Failed to load events" });
    }
});

// POST /api/events — create event (mentor only)
router.post("/", authenticateToken, requireRole("MENTOR"), async (req: Request, res: Response) => {
    try {
        const { title, description, date, type, platform, link } = req.body;

        if (!title || !date || !type) {
            return res.status(400).json({ error: "title, date, and type are required" });
        }

        const event = await prisma.event.create({
            data: {
                title,
                description,
                date: new Date(date),
                type,
                platform,
                link,
            },
        });

        return res.status(201).json(event);
    } catch (error: any) {
        console.error("Create event error:", error);
        return res.status(500).json({ error: "Failed to create event" });
    }
});

export default router;
