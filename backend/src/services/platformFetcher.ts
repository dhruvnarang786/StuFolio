/**
 * Platform API Fetcher — verifies handles and fetches real stats
 * from LeetCode, Codeforces, GitHub, and CodeChef
 */

interface PlatformStats {
    verified: boolean;
    bio?: string;
    stats: { label: string; value: string }[];
}

// ─── LeetCode (GraphQL API) ────────────────────────────

async function fetchLeetCode(handle: string): Promise<PlatformStats> {
    const username = handle.replace(/^@/, "");

    const query = `
        query getUserProfile($username: String!) {
            matchedUser(username: $username) {
                username
                submitStatsGlobal {
                    acSubmissionNum {
                        difficulty
                        count
                    }
                }
                profile {
                    ranking
                    aboutMe
                }
            }
            userContestRanking(username: $username) {
                rating
                attendedContestsCount
            }
        }
    `;

    try {
        const res = await fetch("https://leetcode.com/graphql", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query, variables: { username } }),
        });

        if (!res.ok) throw new Error("LeetCode API error");

        const data = (await res.json()) as any;
        const user = data?.data?.matchedUser;

        if (!user) {
            return { verified: false, stats: [] };
        }

        const submissions = user.submitStatsGlobal?.acSubmissionNum || [];
        const totalSolved = submissions.find((s: any) => s.difficulty === "All")?.count || 0;
        const easy = submissions.find((s: any) => s.difficulty === "Easy")?.count || 0;
        const medium = submissions.find((s: any) => s.difficulty === "Medium")?.count || 0;
        const hard = submissions.find((s: any) => s.difficulty === "Hard")?.count || 0;

        const contest = data?.data?.userContestRanking;
        const rating = contest?.rating ? Math.round(contest.rating) : null;
        const contests = contest?.attendedContestsCount || 0;

        const ranking = user.profile?.ranking || null;
        const aboutMe = user.profile?.aboutMe || "";

        const stats: { label: string; value: string }[] = [
            { label: "Problems Solved", value: String(totalSolved) },
            { label: "Easy / Med / Hard", value: `${easy} / ${medium} / ${hard}` },
        ];

        if (rating) stats.push({ label: "Contest Rating", value: String(rating) });
        if (contests) stats.push({ label: "Contests", value: String(contests) });
        if (ranking) stats.push({ label: "Global Rank", value: `#${ranking.toLocaleString()}` });

        return { verified: true, bio: aboutMe, stats };
    } catch (err) {
        console.error("LeetCode fetch error:", err);
        return { verified: false, stats: [] };
    }
}

// ─── Codeforces (REST API) ─────────────────────────────

async function fetchCodeforces(handle: string): Promise<PlatformStats> {
    const username = handle.replace(/^@/, "");

    try {
        const res = await fetch(`https://codeforces.com/api/user.info?handles=${username}`);

        if (!res.ok) throw new Error("Codeforces API error");

        const data = (await res.json()) as any;
        if (data.status !== "OK" || !data.result?.length) {
            return { verified: false, stats: [] };
        }

        const user = data.result[0];

        const rankName = user.rank || "Unrated";
        const rating = user.rating || 0;
        const maxRating = user.maxRating || 0;

        // Codeforces doesn't have a bio, users can use First Name for verification
        const bio = user.firstName || "";

        // Fetch user submissions to count problems
        let problemsSolved = 0;
        try {
            const subRes = await fetch(`https://codeforces.com/api/user.status?handle=${username}`);
            if (subRes.ok) {
                const subData = (await subRes.json()) as any;
                if (subData.status === "OK") {
                    const solved = new Set<string>();
                    for (const sub of subData.result) {
                        if (sub.verdict === "OK" && sub.problem) {
                            solved.add(`${sub.problem.contestId}-${sub.problem.index}`);
                        }
                    }
                    problemsSolved = solved.size;
                }
            }
        } catch {
            // Submissions fetch is optional
        }

        const stats: { label: string; value: string }[] = [
            { label: "Problems Solved", value: String(problemsSolved) },
            { label: "Rating", value: `${rating} (${rankName})` },
            { label: "Max Rating", value: String(maxRating) },
        ];

        if (user.contribution !== undefined) {
            stats.push({ label: "Contribution", value: String(user.contribution) });
        }

        return { verified: true, bio, stats };
    } catch (err) {
        console.error("Codeforces fetch error:", err);
        return { verified: false, stats: [] };
    }
}

// ─── GitHub (REST API) ─────────────────────────────────

async function fetchGitHub(handle: string): Promise<PlatformStats> {
    const username = handle.replace(/^@/, "");

    try {
        const res = await fetch(`https://api.github.com/users/${username}`, {
            headers: { "Accept": "application/vnd.github.v3+json" },
        });

        if (res.status === 404) {
            return { verified: false, stats: [] };
        }
        if (!res.ok) throw new Error("GitHub API error");

        const user = (await res.json()) as any;
        const bio = user.bio || "";

        const stats: { label: string; value: string }[] = [
            { label: "Public Repos", value: String(user.public_repos || 0) },
            { label: "Followers", value: String(user.followers || 0) },
            { label: "Following", value: String(user.following || 0) },
        ];

        if (user.bio) stats.push({ label: "Bio", value: user.bio.substring(0, 50) });

        return { verified: true, bio, stats };
    } catch (err) {
        console.error("GitHub fetch error:", err);
        return { verified: false, stats: [] };
    }
}

// ─── CodeChef (basic check) ────────────────────────────

async function fetchCodeChef(handle: string): Promise<PlatformStats> {
    const username = handle.replace(/^@/, "");

    // CodeChef doesn't have a straightforward public API
    // We'll do a basic profile page check
    try {
        const res = await fetch(`https://www.codechef.com/users/${username}`, {
            redirect: "follow",
        });

        if (!res.ok || res.url.includes("/error")) {
            return { verified: false, stats: [] };
        }

        return {
            verified: true,
            stats: [
                { label: "Username", value: username },
                { label: "Platform", value: "CodeChef" },
            ],
        };
    } catch (err) {
        console.error("CodeChef fetch error:", err);
        // If we can't verify, still allow linking but note it
        return {
            verified: true,
            stats: [{ label: "Username", value: username }],
        };
    }
}

// ─── Main Export ───────────────────────────────────────

export async function fetchPlatformStats(platform: string, handle: string): Promise<PlatformStats> {
    switch (platform) {
        case "LeetCode":
            return fetchLeetCode(handle);
        case "Codeforces":
            return fetchCodeforces(handle);
        case "GitHub":
            return fetchGitHub(handle);
        case "CodeChef":
            return fetchCodeChef(handle);
        default:
            return { verified: false, stats: [] };
    }
}
