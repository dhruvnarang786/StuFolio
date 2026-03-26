import prisma from "../lib/prisma";

// IPU Grade Point mapping
const GRADE_POINT_MAP: Record<string, number> = {
    "O": 10, "O+": 10,
    "A+": 9,
    "A": 8,
    "B+": 7,
    "B": 6,
    "C": 5,
    "P": 4,
    "F": 0,
    "Ab": 0, "ABSENT": 0,
};

/**
 * Convert a grade string to grade point using IPU formula
 */
export function gradeToPoint(grade: string): number {
    const normalized = grade.trim().toUpperCase();
    // Try exact match first
    if (GRADE_POINT_MAP[normalized] !== undefined) return GRADE_POINT_MAP[normalized];
    // Try original case
    if (GRADE_POINT_MAP[grade.trim()] !== undefined) return GRADE_POINT_MAP[grade.trim()];
    return 0;
}

/**
 * Calculate SGPA for a specific student and semester
 * SGPA = Σ(credit × gradePoint) / Σ(credits)
 */
export async function calculateSGPA(studentId: string, semester: string): Promise<number | null> {
    const records = await prisma.academicRecord.findMany({
        where: { studentId, semester },
        include: { subject: true },
    });

    if (records.length === 0) return null;

    let totalCredits = 0;
    let totalWeighted = 0;

    for (const record of records) {
        const credits = record.subject.credits;
        const gp = record.gradePoint ?? (record.grade ? gradeToPoint(record.grade) : 0);
        totalCredits += credits;
        totalWeighted += credits * gp;
    }

    if (totalCredits === 0) return null;
    return parseFloat((totalWeighted / totalCredits).toFixed(2));
}

/**
 * Calculate CGPA for a student across all semesters
 * CGPA = Σ(semester_credits × SGPA) / Σ(semester_credits)
 * Uses credit-weighted average across all semesters
 */
export async function calculateCGPA(studentId: string): Promise<number | null> {
    const semesterCGPAs = await prisma.semesterCGPA.findMany({
        where: { studentId },
    });

    if (semesterCGPAs.length === 0) return null;

    const total = semesterCGPAs.reduce((sum, s) => sum + s.cgpa, 0);
    return parseFloat((total / semesterCGPAs.length).toFixed(2));
}

/**
 * Recalculate all SGPAs + CGPA for a student and persist them
 */
export async function recalculateAndStore(studentId: string): Promise<{
    semesterSGPAs: { semester: string; sgpa: number }[];
    cgpa: number;
}> {
    // Get all distinct semesters the student has records for
    const records = await prisma.academicRecord.findMany({
        where: { studentId },
        select: { semester: true },
        distinct: ["semester"],
    });

    const semesters = records.map(r => r.semester);
    const semesterSGPAs: { semester: string; sgpa: number }[] = [];

    for (const semester of semesters) {
        const sgpa = await calculateSGPA(studentId, semester);
        if (sgpa !== null) {
            // Upsert to SemesterCGPA (this table stores SGPA per semester despite the name)
            await prisma.semesterCGPA.upsert({
                where: {
                    studentId_semester: { studentId, semester },
                },
                update: { cgpa: sgpa },
                create: { studentId, semester, cgpa: sgpa },
            });
            semesterSGPAs.push({ semester, sgpa });
        }
    }

    // Calculate overall CGPA
    const cgpa = semesterSGPAs.length > 0
        ? parseFloat((semesterSGPAs.reduce((sum, s) => sum + s.sgpa, 0) / semesterSGPAs.length).toFixed(2))
        : 0;

    // Update student's overall CGPA
    await prisma.student.update({
        where: { id: studentId },
        data: { cgpa },
    });

    return { semesterSGPAs, cgpa };
}

/**
 * Calculate SGPA from a list of raw result objects (used for preview)
 */
export async function calculateSgpaFromResults(results: { subject: string; code: string; credits: number; marks: number; grade: string }[]): Promise<number> {
    if (results.length === 0) return 0;

    let totalCredits = 0;
    let totalWeighted = 0;

    for (const r of results) {
        const gp = gradeToPoint(r.grade);
        totalCredits += r.credits;
        totalWeighted += r.credits * gp;
    }

    if (totalCredits === 0) return 0;
    return parseFloat((totalWeighted / totalCredits).toFixed(2));
}

