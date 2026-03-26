import { Router, Response } from "express";
import prisma from "../lib/prisma";
import { AuthRequest, authenticateToken, requireRole } from "../middleware/auth";
import { generateWithRetry } from "../lib/ai";

const router = Router();

// Industry benchmarks (now used as prompt context & fallback)
const roleBenchmarks: Record<string, any> = {
    "Full Stack Developer": {
        skills: ["React", "Node.js", "PostgreSQL", "TypeScript", "Docker", "AWS"],
        certs: [{ title: "Meta Full Stack Engineer", platform: "Coursera", icon: "💻" }]
    },
    "Data Scientist": {
        skills: ["Python", "TensorFlow", "Pandas", "SQL", "Statistics"],
        certs: [{ title: "Google Data Analytics", platform: "Coursera", icon: "📊" }]
    },
    "Backend Developer": {
        skills: ["Java", "Spring Boot", "MySQL", "System Design", "Redis"],
        certs: [{ title: "Spring Certified Professional", platform: "Pivotal", icon: "☕" }]
    }
};

// GET /api/career/analysis — Get AI-driven career readiness
router.get("/analysis", authenticateToken, requireRole("STUDENT", "student"), async (req: AuthRequest, res: Response) => {
    try {
        const studentId = req.user!.userId;
        const targetGoal = (req.query.goal as string) || "Full Stack Developer";

        const user = await prisma.user.findUnique({
            where: { id: studentId },
            include: {
                student: {
                    include: {
                        skills: { include: { skill: true } },
                        academicRecords: { include: { subject: true } },
                        codingProfiles: true,
                        _count: { select: { badges: true } }
                    }
                }
            }
        });

        if (!user?.student) throw new Error("Student not found");

        const student = user.student;
        const studentSkillNames = student.skills.map(s => s.skill.name);
        
        const systemPrompt = `You are a world-class Career Strategist and Professional Advisory AI.
Your task is to provide a comprehensive career readiness analysis for the student aiming for the role of "${targetGoal}".

STRICT PERSONA & CONTENT INSTRUCTIONS:
- Always address the student directly as "you" (Second Person). 
- DO NOT use the student's name (e.g., "Nakul is...") or say "the student".
- DO NOT mention "CGPA", "grades", or academic performance in the summary. 
- Focus EXCLUSIVELY on technical prowess, code quality, GitHub projects, and problem-solving skills.
- Speak like a professional technical coach giving direct, actionable advice.

STUDENT CONTEXT:
- Name: ${user.name}
- Technical Skills: ${studentSkillNames.join(", ")}
- Verified Badges: ${student._count.badges}
- Coding Profiles: ${JSON.stringify(student.codingProfiles)}
- Academy Context (For Internal Weightage Only): ${student.cgpa} CGPA, Subjects: ${JSON.stringify(student.academicRecords.map(r => ({ subject: r.subject.name, grade: r.grade })))}

INDUSTRY BENCHMARKS for "${targetGoal}":
${JSON.stringify(roleBenchmarks[targetGoal] || roleBenchmarks["Full Stack Developer"])}

INSTRUCTIONS FOR PLACEMENT SCORE (0-100):
Calculate the "placementScore" using this NEW INDUSTRY-STANDARD weightage:
1. 70% WEIGHT - Technical Prowess: Analyze GitHub repositories (if available), project diversity, and global coding platform performance (LeetCode, HackerRank, etc.). PRIORITIZE real-world project impact and problem-solving consistency.
2. 30% WEIGHT - Academic Foundation: Consider core CS academic performance. A high CGPA is a bonus, but technical demonstration through code is the primary driver.

ADDITIONAL INSTRUCTIONS:
1. Generate a "skillGap" array with EXACTLY 6 technical skills. 
   - Each entry must have "skill" (name), "student" (0-100 proficiency), and "industry" (target 90).
   - Proficiency: 65-95 if in Repository, 15-45 if not.
2. Provide "recommendations":
   - "certifications": 3 high-value certifications (e.g. from AWS, Meta, or Google).
   - "projects": 2 high-impact system architecture projects.
   - "competitions": 2 "Elite Gatherings" (e.g. SIH, GSoC, ICPC) with official URLs.
3. Write a professional, data-driven "summary" that highlights technical strengths and gives specific advice on project building.

OUTPUT FORMAT (STRICT JSON ONLY):
{
  "placementScore": number,
  "skillGap": [
    { "skill": "string", "student": number, "industry": 90 }
  ],
  "recommendations": {
    "certifications": [{ "title": "string", "platform": "string", "relevance": "Critical" | "High", "time": "string", "icon": "string" }],
    "projects": [{ "title": "string", "description": "string", "skills": ["string"], "impact": "High" }],
    "competitions": [{ "title": "string", "type": "Global" | "National" | "Elite", "date": "string", "difficulty": "Hard" | "Medium", "url": "string" }]
  },
  "summary": "string"
}

Ensure all links are the direct official websites. No hallucinations.
Be precise and professional.`;

        console.log(`[Career] Requesting Groq AI Analysis for ${user.name} -> ${targetGoal}`);
        
        try {
            const result = await generateWithRetry(systemPrompt);
            const responseText = result.choices[0]?.message?.content || "{}";
            const aiData = JSON.parse(responseText);
            
            console.log(`[Career] Successfully generated AI response for ${studentId}`);
            return res.json(aiData);
        } catch (aiError) {
            console.error("[Career] AI failed, falling back to deterministic logic:", aiError);
            const academicScore = Math.min((student.cgpa / 10) * 100, 100);
            const codingScore = Math.min(student.codingProfiles.length * 25, 100); 
            const placementScore = Math.round((codingScore * 0.70) + (academicScore * 0.30));
            
            return res.json({
                placementScore: Math.min(placementScore, 95),
                skillGap: (roleBenchmarks[targetGoal]?.skills || []).map((s: string) => ({ skill: s, student: 40, industry: 90 })),
                recommendations: { certifications: [], projects: [], competitions: [] },
                summary: "AI Coach is currently offline. This estimate prioritizes your coding activity (70%) over academics (30%)."
            });
        }

    } catch (error: any) {
        console.error("[Career] Route error:", error.message);
        return res.status(500).json({ error: "Failed to generate career analysis" });
    }
});

export default router;
