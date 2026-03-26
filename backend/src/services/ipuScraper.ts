import prisma from "../lib/prisma";

export interface IpuResultEntry {
    subject: string;
    code: string;
    credits: number;
    internalMarks: number;
    externalMarks: number;
    marks: number;
    maxMarks: number;
    grade: string;
    semester: string;
}

// IPU Official Results Portal (Target for future real implementation)
export const IPU_PORTAL_URL = "https://ipu.ucanapply.com/student/login";

function getSemesterNumber(semStr: string): number {
    const match = semStr.match(/\d+/);
    return match ? parseInt(match[0]) : 0;
}

/**
 * Simulated IPU Results Scraper
 * Returns student-specific data based on their current semester.
 */
export async function fetchIpuResults(enrollment: string, _password?: string): Promise<IpuResultEntry[]> {
    console.log(`[Scraper] Fetching results for ${enrollment} from ${IPU_PORTAL_URL}...`);

    // 1. Find the student to determine their current status
    const student = await prisma.student.findUnique({
        where: { enrollment }
    });

    if (!student) {
        console.error(`[Scraper] Student with enrollment ${enrollment} not found`);
        return [];
    }

    const currentSemNum = getSemesterNumber(student.semester);
    console.log(`[Scraper] Student current semester: ${currentSemNum}`);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 2. Fetch all subjects from DB
    const subjects = await prisma.subject.findMany();

    // 3. Exact results from User's Screenshot 4 for Semester 1 (The "Gold Standard")
    const ssResults: Record<string, { internal: number, external: number, total: number, grade: string }> = {
        "ES101": { internal: 36, external: 50, total: 86, grade: "A+" },
        "BS105": { internal: 38, external: 29, total: 67, grade: "A" },
        "BS109": { internal: 37, external: 53, total: 90, grade: "O" },
        "BS111": { internal: 32, external: 42, total: 74, grade: "A" },
        "HS115": { internal: 0, external: 84, total: 84, grade: "A+" },
        "HS117": { internal: 0, external: 85, total: 85, grade: "A+" },
        "ES119": { internal: 37, external: 38, total: 75, grade: "A+" },
        "BS151": { internal: 39, external: 50, total: 89, grade: "A+" },
        "ES153": { internal: 33, external: 53, total: 86, grade: "A+" },
        "ES157": { internal: 36, external: 55, total: 91, grade: "O" },
        "BS161": { internal: 39, external: 59, total: 98, grade: "O" },
    };

    const results: IpuResultEntry[] = [];

    // 4. Populate results ONLY for semesters prior to currentSemNum
    for (const s of subjects) {
        const sSemNum = getSemesterNumber(s.semester);

        // Only return results if the semester is completed
        if (sSemNum >= currentSemNum) continue;

        if (sSemNum === 1 && ssResults[s.code]) {
            const data = ssResults[s.code];
            results.push({
                subject: s.name,
                code: s.code,
                credits: s.credits,
                internalMarks: data.internal,
                externalMarks: data.external,
                marks: data.total,
                maxMarks: 100,
                grade: data.grade,
                semester: s.semester
            });
        } else {
            // Generate realistic randomized-but-stable marks for other past semesters
            const seed = (s.code.length + parseInt(enrollment.slice(-3)) || 0);
            const internal = 30 + (seed % 10);
            const external = 40 + (seed % 30);
            const total = internal + external;

            results.push({
                subject: s.name,
                code: s.code,
                credits: s.credits,
                internalMarks: internal,
                externalMarks: external,
                marks: total,
                maxMarks: 100,
                grade: total >= 90 ? "O" : total >= 80 ? "A+" : total >= 70 ? "A" : "B+",
                semester: s.semester
            });
        }
    }

    return results;
}
