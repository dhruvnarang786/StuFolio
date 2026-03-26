import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    const hashedPassword = await bcrypt.hash("password123", 10);

    // ─── Create Subjects (Official IPU B.Tech CSE Screenshot-Match) ──────────────────────────────
    console.log("Seeding/Updating official IPU B.Tech CSE (Screenshot Match) syllabus...");

    const syllabus = [
        // Semester 1 (Exact from Screenshot 4)
        { code: "ES101", name: "Programming in 'C'", credits: 4, semester: "1st Semester" },
        { code: "BS105", name: "Applied Physics - I", credits: 3, semester: "1st Semester" },
        { code: "BS109", name: "Environmental Studies", credits: 3, semester: "1st Semester" },
        { code: "BS111", name: "Applied Mathematics - I", credits: 4, semester: "1st Semester" },
        { code: "HS115", name: "Indian Constitution", credits: 1, semester: "1st Semester" },
        { code: "HS117", name: "Human Values and Ethics", credits: 1, semester: "1st Semester" },
        { code: "ES119", name: "Manufacturing Process", credits: 3, semester: "1st Semester" },
        { code: "BS151", name: "Physics - I Lab", credits: 1, semester: "1st Semester" },
        { code: "ES153", name: "Programming in 'C' Lab", credits: 1, semester: "1st Semester" },
        { code: "ES157", name: "Engineering Graphics - I", credits: 2, semester: "1st Semester" },
        { code: "BS161", name: "Environmental Studies Lab", credits: 2, semester: "1st Semester" },

        // Semester 2 (Inferred based on common IPU patterns matching the SS detail level)
        { code: "BS102", name: "Applied Mathematics-II", credits: 4, semester: "2nd Semester" },
        { code: "BS104", name: "Applied Physics-II", credits: 3, semester: "2nd Semester" },
        { code: "BS106", name: "Applied Chemistry", credits: 3, semester: "2nd Semester" },
        { code: "ES108", name: "Programming in C++", credits: 3, semester: "2nd Semester" },
        { code: "ES110", name: "Engineering Mechanics", credits: 3, semester: "2nd Semester" },
        { code: "HS112", name: "Communication Skills", credits: 2, semester: "2nd Semester" },
        { code: "ES160", name: "Workshop Practice", credits: 2, semester: "2nd Semester" },
        { code: "BS152", name: "Applied Physics Lab-II", credits: 1, semester: "2nd Semester" },
        { code: "BS154", name: "Applied Chemistry Lab", credits: 1, semester: "2nd Semester" },
        { code: "ES156", name: "Programming in C++ Lab", credits: 1, semester: "2nd Semester" },
        { code: "ES158", name: "Engineering Mechanics Lab", credits: 1, semester: "2nd Semester" },

        // Semester 3 (Inferred for CSE)
        { code: "CIC201", name: "Data Structures", credits: 4, semester: "3rd Semester" },
        { code: "CIC203", name: "Digital Electronics", credits: 4, semester: "3rd Semester" },
        { code: "CIC205", name: "Object Oriented Programming (Java)", credits: 4, semester: "3rd Semester" },
        { code: "CIC207", name: "Foundations of Computer Science", credits: 4, semester: "3rd Semester" },
        { code: "BS209", name: "Applied Mathematics-III", credits: 4, semester: "3rd Semester" },
        { code: "HS211", name: "Human Values & Ethics-II", credits: 1, semester: "3rd Semester" },
        { code: "CIC251", name: "Data Structures Lab", credits: 1, semester: "3rd Semester" },
        { code: "CIC253", name: "Digital Electronics Lab", credits: 1, semester: "3rd Semester" },
        { code: "CIC255", name: "Java Programming Lab", credits: 1, semester: "3rd Semester" },

        // Semester 4 (Current Semester - No results expected in Sync)
        { code: "CS202", name: "Database Management Systems", credits: 4, semester: "4th Semester" },
        { code: "CS204", name: "Software Engineering", credits: 4, semester: "4th Semester" },
        { code: "CS206", name: "Design & Analysis of Algorithms", credits: 4, semester: "4th Semester" },
        { code: "CS208", name: "Operating Systems", credits: 4, semester: "4th Semester" },
        { code: "CS210", name: "Computer Organization & Architecture", credits: 4, semester: "4th Semester" },
        { code: "BS212", name: "Numerical Methods", credits: 4, semester: "4th Semester" },
    ];

    for (const sub of syllabus) {
        await prisma.subject.upsert({
            where: { code: sub.code },
            update: sub,
            create: sub
        });
    }

    console.log(`Synced ${syllabus.length} subjects successfully.`);



    // ─── Create Skills ────────────────────────────────
    const skillNames = ["C++", "Python", "JavaScript", "React", "Node.js", "SQL", "Data Structures", "Algorithms", "Machine Learning", "Git"];
    for (const name of skillNames) {
        await prisma.skill.upsert({
            where: { name },
            update: {},
            create: { name }
        });
    }
    console.log(`✅ Upserted ${skillNames.length} skills`);

    // ─── Create Main Mentor ───────────────────────────
    const mentorUser = await prisma.user.upsert({
        where: { email: "mentor@campus.edu" },
        update: {
            password: hashedPassword,
            name: "Main Mentor",
            role: "FACULTY",
            mentor: {
                update: {
                    section: "CSE-B",
                    facultyType: "mentor",
                }
            }
        },
        create: {
            email: "mentor@campus.edu",
            password: hashedPassword,
            name: "Main Mentor",
            role: "FACULTY",
            mentor: {
                create: {
                    department: "Computer Science & Engineering",
                    designation: "Professor",
                    section: "CSE-B",
                    facultyType: "mentor",
                },
            },
        },
    });
    console.log(`✅ Upserted mentor: ${mentorUser.name}`);

    // ─── Create HOD Account ───────────────────────────
    const hodUser = await prisma.user.upsert({
        where: { email: "hod@campus.edu" },
        update: {
            password: hashedPassword,
            name: "Dr. Sharma (HOD)",
            role: "FACULTY",
            mentor: {
                update: {
                    facultyType: "hod_principal",
                    section: "ALL",
                }
            }
        },
        create: {
            email: "hod@campus.edu",
            password: hashedPassword,
            name: "Dr. Sharma (HOD)",
            role: "FACULTY",
            mentor: {
                create: {
                    department: "Computer Science & Engineering",
                    designation: "HOD",
                    section: "ALL",
                    facultyType: "hod_principal",
                    branch: "Computer Science & Engineering",
                },
            },
        },
    });
    console.log(`✅ Upserted HOD: ${hodUser.name}`);

    // ─── Create Student Account ─────────────────────────
    const studentUser = await prisma.user.upsert({
        where: { email: "dhruv@campus.edu" },
        update: {
            password: hashedPassword,
            name: "Dhruv",
            role: "STUDENT",
            student: {
                update: {
                    enrollment: "00112803121",
                    branch: "Computer Science & Engineering",
                    section: "CSE-B",
                    semester: "4th Semester",
                    year: "2",
                }
            }
        },
        create: {
            email: "dhruv@campus.edu",
            password: hashedPassword,
            name: "Dhruv",
            role: "STUDENT",
            student: {
                create: {
                    enrollment: "00112803121",
                    branch: "Computer Science & Engineering",
                    section: "CSE-B",
                    semester: "4th Semester",
                    year: "2",
                }
            }
        }
    });

    console.log(`✅ Upserted Student: ${studentUser.name}`);

    console.log("\n🎉 Database is now ready!\n");
    console.log("Credentials:");
    console.log("  Student: dhruv@campus.edu / password123");
    console.log("  Mentor:  mentor@campus.edu / password123");
    console.log("  HOD:     hod@campus.edu / password123\n");
}

main()
    .catch((e) => {
        console.error("❌ Seed error:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
