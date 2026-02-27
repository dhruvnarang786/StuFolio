/**
 * Institutional Data Mapping & Parsing Utility
 */

const branchMap: Record<string, string> = {
    "208": "Computer Science & Engineering",
    // Additional branch codes can be added here
};

const sectionMap: Record<string, string> = {
    "csea": "CSE-A",
    "cseb": "CSE-B",
    // Additional section codes can be added here
};

export interface ParsedStudentData {
    rollNumber: string;
    branch: string;
    section: string;
    admissionYear: string;
    semester: string;
    year: string;
    enrollmentString: string;
}

/**
 * Calculates semester and academic year based on admission year.
 */
export function calculateSemester(admissionYear: number): { semester: string; year: string } {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed, 0 = Jan, 6 = July

    let yearDiff = currentYear - admissionYear;
    let semester = yearDiff * 2;

    // If current month >= July (6), we've entered the second half (Odd semesters: 1, 3, 5, 7)
    // Enrollment usually starts in July/August.
    if (currentMonth >= 6) {
        semester += 1;
    }

    // Constraints
    semester = Math.max(1, Math.min(8, semester));

    const suffix = (s: number) => {
        if (s === 1) return "st";
        if (s === 2) return "nd";
        if (s === 3) return "rd";
        return "th";
    };

    const academicYear = Math.ceil(semester / 2);
    const yearSuffix = (y: number) => {
        if (y === 1) return "1st Year";
        if (y === 2) return "2nd Year";
        if (y === 3) return "3rd Year";
        return "4th Year";
    };

    return {
        semester: `${semester}${suffix(semester)} Semester`,
        year: yearSuffix(academicYear),
    };
}

/**
 * Parses college-specific data from enrollment number and email.
 * Fallback to email if enrollment number is missing from token.
 */
export function parseStudentData(enrollment: string, email: string): ParsedStudentData {
    let rollNumber = "0";
    let branch = "Computer Science & Engineering"; // default
    let section = "CSE-B"; // default
    let startYear = new Date().getFullYear();

    const emailUsername = email.split("@")[0].toLowerCase();

    // 1. Try parsing email first as a fallback/baseline
    // e.g. nakul95cseb24 -> name=nakul, roll=95, section=cseb, year=24
    const emailMatch = emailUsername.match(/^(.+?)(\d{2})([a-z]{2,4})(\d{2})$/);
    if (emailMatch) {
        const [, , rollDigits, sectionStr, yearDigits] = emailMatch;
        rollNumber = parseInt(rollDigits, 10).toString();
        startYear = parseInt(`20${yearDigits}`, 10);

        for (const [code, label] of Object.entries(sectionMap)) {
            if (sectionStr.includes(code) || code.includes(sectionStr)) {
                section = label;
                break;
            }
        }
    }

    // 2. If enrollment looks valid (e.g. 11 digits) and isn't the fallback, parse from it instead
    if (enrollment && enrollment.length >= 11 && enrollment !== "00000000000") {
        const rollRaw = enrollment.substring(0, 3);
        rollNumber = parseInt(rollRaw, 10).toString();

        const branchCode = enrollment.substring(3, 6);
        branch = branchMap[branchCode] || branch;

        const yearDigits = enrollment.substring(enrollment.length - 2);
        startYear = parseInt(`20${yearDigits}`, 10);
    }

    // 3. Semester Calculation
    const { semester, year } = calculateSemester(startYear);

    // 4. Generate a synthetic enrollment string if we didn't have a valid one
    const finalEnrollment = (enrollment && enrollment.length >= 11 && enrollment !== "00000000000")
        ? enrollment
        : `0${rollNumber.padStart(2, '0')}208027${startYear.toString().slice(-2)}`;

    return {
        rollNumber,
        branch,
        section,
        admissionYear: startYear.toString(),
        semester,
        year,
        enrollmentString: finalEnrollment
    };
}
