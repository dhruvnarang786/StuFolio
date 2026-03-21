import { Router, Response } from "express";
import prisma from "../lib/prisma";
import { AuthRequest, authenticateToken, requireRole } from "../middleware/auth";

const router = Router();

// GET /api/analysis/me — Get AI-driven performance analysis
router.get("/me", authenticateToken, requireRole("STUDENT"), async (req: AuthRequest, res: Response) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user!.userId },
            include: {
                student: {
                    include: {
                        academicRecords: { include: { subject: true } },
                        attendances: { include: { subject: true } },
                        semesterCGPAs: true,
                        codingProfiles: true,
                    }
                }
            }
        });

        if (!user?.student) return res.status(404).json({ error: "Student not found" });

        const student = user.student;

        // 1. Strength & Weakness Map (Radar Chart Data)
        // Group by subject and calculate avg score
        const strengthData = student.academicRecords.map(r => ({
            subject: r.subject.code,
            score: (r.marks / r.maxMarks) * 100,
            fullMark: 100
        }));

        // 2. GPA Prediction (Weighted Moving Average)
        const sortedSemesters = student.semesterCGPAs.sort((a, b) => a.semester.localeCompare(b.semester));
        const actualData = sortedSemesters.map(s => ({
            sem: `Sem ${s.semester}`,
            actual: s.cgpa,
            predicted: null as number | null
        }));

        let predictedNext: number | null = null;
        if (actualData.length >= 2) {
            let weightedSum = 0;
            let weightTotal = 0;
            for (let i = 0; i < actualData.length; i++) {
                const weight = i + 1;
                weightedSum += actualData[i].actual * weight;
                weightTotal += weight;
            }
            predictedNext = weightedSum / weightTotal;
            predictedNext = Math.min(10, Math.max(0, predictedNext));
        } else if (actualData.length === 1) {
            predictedNext = actualData[0].actual;
        }

        const predictionData = [
            ...actualData,
            { sem: `Sem ${actualData.length + 1}`, actual: null, predicted: predictedNext || student.cgpa }
        ];

        // 3. Complex Rule Engine for Suggestions and Explainable AI
        const suggestions: any[] = [];
        const insights: any[] = [];
        
        const lowScores = strengthData.filter(s => s.score < 70);
        const lowAttendance = student.attendances.filter(a => (a.attended / a.total) < 0.75);
        
        let codingSolved = 0;
        try {
            codingSolved = student.codingProfiles.reduce((acc, cp) => {
                const stats = JSON.parse(cp.stats || "[]");
                const solved = stats.find((s: any) => s.label.includes("Solved"))?.value || 0;
                return acc + parseInt(solved || 0);
            }, 0);
        } catch(e) {}

        const correlatedSubjects = lowAttendance.filter(a => 
            lowScores.some(s => s.subject === a.subject.code)
        );

        if (correlatedSubjects.length > 0) {
            const subjName = correlatedSubjects[0].subject.name;
            suggestions.push({
                icon: "AlertTriangle",
                title: `Critical Focus on ${subjName}`,
                description: `Your score drop is highly correlated with your <75% attendance. Attending classes will stabilize your score.`,
                priority: "high",
                color: "text-destructive bg-destructive/10 border-destructive/20",
            });
            insights.push({
                question: `Why is performance at risk in ${subjName}?`,
                answer: `Extraction shows a strong correlation: low attendance (<75%) resulted in scores dropping below 70%. Improve attendance to recover.`,
                icon: "📉"
            });
        } else if (lowScores.length > 0) {
            suggestions.push({
                icon: "BookOpen",
                title: `Focus on ${lowScores[0].subject}`,
                description: `Your score in ${lowScores[0].subject} is below the 70% threshold. Dedicate more practice to this subject.`,
                priority: "medium",
                color: "text-warning bg-warning/10 border-warning/20",
            });
        }

        if (codingSolved > 50 && lowScores.length > 0) {
            suggestions.push({
                icon: "Zap",
                title: "Balance Academics with Coding",
                description: `You are performing well in competitive programming, but ${lowScores.length} subject(s) need attention. Maintain a healthy balance.`,
                priority: "medium",
                color: "text-warning bg-warning/10 border-warning/20",
            });
        } else if (lowAttendance.length > 0) {
            suggestions.push({
                icon: "Zap",
                title: `Improve Attendance in ${lowAttendance[0].subject.name}`,
                description: `Current attendance is low. Try to maintain above 75% for exam eligibility.`,
                priority: "high",
                color: "text-destructive bg-destructive/10 border-destructive/20",
            });
        }

        if (student.streak < 3) {
            suggestions.push({
                icon: "TrendingUp",
                title: "Rebuild your Coding Consistency",
                description: "You lost your steady coding streak! Consistency is key for technical interviews.",
                priority: "low",
                color: "text-primary bg-primary/10 border-primary/20",
            });
        }

        if (suggestions.length === 0) {
            suggestions.push({
                icon: "CheckCircle",
                title: "Exceptional Trajectory",
                description: "You are consistently hitting academic and attendance targets. Keep it up!",
                priority: "low",
                color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
            });
        }

        const currentCgpa = student.cgpa;

        if (insights.length === 0) {
            if (predictedNext && predictedNext > currentCgpa) {
                insights.push({
                    question: "Why is your trajectory improving?",
                    answer: "Your recent semesters show an upward trend. The Weighted Moving Average model strongly weights your recent improvements.",
                    icon: "📈"
                });
            } else {
                insights.push({
                    question: "What is stabilizing your score?",
                    answer: "Your attendance and academic scores are consistent. Maintaining this will keep your CGPA steady.",
                    icon: "⚖️"
                });
            }
        }

        // 4. Dynamic Goal Roadmap Math
        const currentSem = actualData.length;
        const totalSems = 8;
        const remainingSems = totalSems - currentSem;
        const goalRoadmap: any[] = [];

        [8.5, 9.0].forEach(target => {
            if (currentSem === 0 || currentSem >= totalSems) {
                goalRoadmap.push({
                    target: `${target.toFixed(1)} CGPA`,
                    needed: "Need more semester data.",
                    feasibility: "Unknown",
                    color: "text-muted-foreground bg-secondary/20 border-border"
                });
                return;
            }

            const requiredSgpaAvg = (target * totalSems - currentCgpa * currentSem) / remainingSems;

            let feasibility = "Very Likely";
            let color = "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
            let needed = "";

            if (requiredSgpaAvg > 10) {
                feasibility = "Mathematically Impossible";
                color = "text-destructive bg-destructive/10 border-destructive/20";
                needed = `Requires >10 SGPA on average the rest of the way.`;
            } else if (requiredSgpaAvg > 9.0) {
                feasibility = "Challenging";
                color = "text-warning bg-warning/10 border-warning/20";
                needed = `Require average SGPA of ${requiredSgpaAvg.toFixed(2)} in remaining ${remainingSems} sems.`;
            } else if (requiredSgpaAvg <= currentCgpa) {
                feasibility = "Very Likely";
                color = "text-accent bg-accent/10 border-accent/20";
                needed = `Just maintain your current trajectory (need ~${requiredSgpaAvg.toFixed(2)} SGPA).`;
            } else {
                feasibility = "Possible";
                color = "text-primary bg-primary/10 border-primary/20";
                needed = `Require average SGPA of ${requiredSgpaAvg.toFixed(2)} in remaining ${remainingSems} sems.`;
            }

            goalRoadmap.push({
                target: `${target.toFixed(1)} CGPA`,
                needed,
                feasibility,
                color
            });
        });

        return res.json({
            strengthData,
            predictionData,
            suggestions: suggestions.slice(0, 4),
            insights: insights.slice(0, 3),
            goalRoadmap,
            overallTrend: predictedNext && predictedNext >= currentCgpa ? "Upward ↑" : "Steady",
            predictedGPA: predictedNext || currentCgpa,
            weakAreas: lowScores.map(s => s.subject).join(", ") || "None identified"
        });
    } catch (error: any) {
        console.error("Analysis error:", error);
        return res.status(500).json({ error: "Failed to generate analysis" });
    }
});

export default router;
