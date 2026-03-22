import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, Loader2, Users, ShieldCheck, ChevronRight, GraduationCap } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Input } from "@/components/ui/input";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

const AdminDashboard = () => {
    const { user } = useAuth();
    const [search, setSearch] = useState("");
    const [semesterFilter, setSemesterFilter] = useState("");
    const [branchFilter, setBranchFilter] = useState("");
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchStudents = async () => {
        setLoading(true);
        try {
            const data = await api.getAdminStudents({
                search: search || undefined,
                semester: semesterFilter || undefined,
                branch: branchFilter || undefined,
            });
            setStudents(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const debounce = setTimeout(() => {
            fetchStudents();
        }, 300);
        return () => clearTimeout(debounce);
    }, [search, semesterFilter, branchFilter]);

    return (
        <DashboardLayout title="Admin Dashboard" subtitle={`${user?.role === "PRINCIPAL" ? "Principal" : "HOD"} Access View`} role="admin">

            {/* Header Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-primary/10 border border-primary/20 rounded-xl p-5 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                        <ShieldCheck className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h3 className="font-display font-bold text-lg text-foreground">Global Directory</h3>
                        <p className="text-sm text-muted-foreground">Search and manage any student across campus</p>
                    </div>
                </div>
                <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center">
                        <Users className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                        <h3 className="font-display font-bold text-lg text-foreground">{students.length}</h3>
                        <p className="text-sm text-muted-foreground">Students matching criteria</p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-card border border-border rounded-xl p-4 mb-6 flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name or enrollment..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 h-11 bg-secondary/50 border-border rounded-xl"
                    />
                </div>
                <div className="flex gap-4">
                    <select
                        value={branchFilter}
                        onChange={(e) => setBranchFilter(e.target.value)}
                        className="h-11 rounded-xl bg-secondary/50 border border-border px-3 text-sm focus:outline-none"
                    >
                        <option value="">All Branches</option>
                        <option value="Computer Science & Engineering">CSE</option>
                        <option value="Information Technology">IT</option>
                        <option value="Electronics & Communication">ECE</option>
                    </select>
                    <select
                        value={semesterFilter}
                        onChange={(e) => setSemesterFilter(e.target.value)}
                        className="h-11 rounded-xl bg-secondary/50 border border-border px-3 text-sm focus:outline-none"
                    >
                        <option value="">All Semesters</option>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(s =>
                            <option key={s} value={`${s}${s === 1 ? 'st' : s === 2 ? 'nd' : s === 3 ? 'rd' : 'th'} Semester`}>{s} Sem</option>
                        )}
                    </select>
                </div>
            </div>

            {/* List */}
            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                <div className="p-4 border-b border-border/50 bg-secondary/20">
                    <h3 className="font-display font-semibold text-foreground">Student Results</h3>
                </div>

                {loading ? (
                    <div className="py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                ) : students.length === 0 ? (
                    <div className="py-12 text-center text-muted-foreground text-sm">No students found matching your criteria.</div>
                ) : (
                    <div className="divide-y divide-border/50">
                        {students.map((student, i) => (
                            <Link
                                key={student.id}
                                to={`/mentor/student-detail?id=${student.id}`}
                                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-secondary/30 transition-colors gap-4"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-xl bg-gradient-primary flex items-center justify-center text-sm font-bold text-white shrink-0">
                                        {student.name.split(" ").map((n: string) => n[0]).join("")}
                                    </div>
                                    <div>
                                        <div className="font-semibold text-foreground">{student.name}</div>
                                        <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                                            <span className="font-mono">{student.enrollment || "N/A"}</span>
                                            <span>•</span>
                                            <span>{student.branch || "Branch"}</span>
                                            <span>•</span>
                                            <span>{student.semester || "Semester"}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6 pl-14 sm:pl-0">
                                    <div className="text-right">
                                        <div className="text-xs text-muted-foreground">CGPA</div>
                                        <div className="font-bold text-foreground">{student.cgpa || "N/A"}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-xs text-muted-foreground">Attendance</div>
                                        <div className={`font-bold ${student.attendance < 75 ? "text-destructive" : "text-accent"}`}>{student.attendance}%</div>
                                    </div>
                                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default AdminDashboard;
