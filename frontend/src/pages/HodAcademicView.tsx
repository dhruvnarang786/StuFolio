import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
    GraduationCap,
    Users,
    TrendingUp,
    Search,
    Filter,
    Download,
    ChevronRight,
    Loader2,
    ArrowUpRight,
    ArrowDownRight,
    BarChart3,
} from "lucide-react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from "recharts";
import DashboardLayout from "@/components/DashboardLayout";
import api from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const HodAcademicView = () => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    const [search, setSearch] = useState("");
    const [semester, setSemester] = useState("all");
    const [section, setSection] = useState("all");

    const fetchData = async () => {
        setLoading(true);
        try {
            const params: any = {};
            if (semester !== "all") params.semester = semester;
            if (section !== "all") params.section = section;

            const result = await api.getFacultyAcademicsAll(params);
            setData(result);
        } catch (err) {
            console.error("Failed to fetch branch academics:", err);
            toast.error("Failed to load branch academic data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [semester, section]);

    if (loading && !data) {
        return (
            <DashboardLayout title="Branch Academics" subtitle="Loading analytics..." role="faculty">
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </DashboardLayout>
        );
    }

    const students = data?.students || [];
    const stats = data?.stats || { averageCgpa: 0, totalStudents: 0, passPercentage: 0, topPerformers: [] };

    const filteredStudents = students.filter((s: any) =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.enrollment.includes(search)
    );

    // Distribution data for bar chart
    const distribution = [
        { name: "9-10", count: students.filter((s: any) => s.cgpa >= 9).length },
        { name: "8-9", count: students.filter((s: any) => s.cgpa >= 8 && s.cgpa < 9).length },
        { name: "7-8", count: students.filter((s: any) => s.cgpa >= 7 && s.cgpa < 8).length },
        { name: "6-7", count: students.filter((s: any) => s.cgpa >= 6 && s.cgpa < 7).length },
        { name: "Below 6", count: students.filter((s: any) => s.cgpa < 6).length },
    ];

    return (
        <DashboardLayout title="Branch Academics" subtitle="Comprehensive performance analytics for your branch" role="faculty">
            <div className="space-y-8">
                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[
                        { label: "Branch Average", value: stats.averageCgpa.toFixed(2), icon: TrendingUp, color: "text-primary bg-primary/10" },
                        { label: "Total Students", value: stats.totalStudents, icon: Users, color: "text-accent bg-accent/10" },
                        { label: "Pass Percentage", value: `${stats.passPercentage}%`, icon: GraduationCap, color: "text-green-500 bg-green-500/10" },
                        { label: "Top CGPA", value: Math.max(...students.map((s: any) => s.cgpa), 0).toFixed(2), icon: BarChart3, color: "text-warning bg-warning/10" },
                    ].map((stat, i) => (
                        <Card key={i}>
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-medium text-muted-foreground">{stat.label}</span>
                                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${stat.color}`}>
                                        <stat.icon className="h-4 w-4" />
                                    </div>
                                </div>
                                <div className="text-2xl font-display font-bold text-foreground">{stat.value}</div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Performance Distribution */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="text-lg font-display font-bold">CGPA Distribution</CardTitle>
                            <CardDescription>Number of students per grade bracket</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={distribution}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                                    <Tooltip
                                        cursor={{ fill: "hsl(var(--secondary))" }}
                                        contentStyle={{ backgroundColor: "hsl(var(--card))", borderRadius: "12px", border: "1px solid hsl(var(--border))" }}
                                    />
                                    <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={40}>
                                        {distribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={index === 0 ? "hsl(var(--primary))" : "hsl(var(--primary) / 0.6)"} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Quick Filters */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg font-display font-bold">Filters</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-muted-foreground px-1">Semester</label>
                                <Select value={semester} onValueChange={setSemester}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Semesters" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Semesters</SelectItem>
                                        {["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"].map(s => (
                                            <SelectItem key={s} value={`${s} Semester`}>{s} Semester</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-muted-foreground px-1">Section</label>
                                <Select value={section} onValueChange={setSection}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Sections" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Sections</SelectItem>
                                        {["CSE-1", "CSE-2", "CSE-3", "IT-1", "IT-2"].map(s => (
                                            <SelectItem key={s} value={s}>{s}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button className="w-full mt-2" variant="outline" onClick={() => { setSemester("all"); setSection("all"); }}>
                                Reset Filters
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Students Table */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                        <div>
                            <CardTitle className="text-lg font-display font-bold">Student Performance Registry</CardTitle>
                            <CardDescription>Browse individual student academic status</CardDescription>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search student..."
                                    className="pl-9 w-64"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                            <Button variant="outline" size="icon">
                                <Download className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-xl border border-border overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-secondary/50 text-muted-foreground font-medium border-b border-border">
                                    <tr>
                                        <th className="px-6 py-4">Student</th>
                                        <th className="px-6 py-4">Enrollment</th>
                                        <th className="px-6 py-4">Section</th>
                                        <th className="px-6 py-4 text-center">CGPA</th>
                                        <th className="px-6 py-4 text-center">Trend</th>
                                        <th className="px-6 py-4 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {filteredStudents.length > 0 ? (
                                        filteredStudents.map((student: any, i: number) => (
                                            <motion.tr
                                                key={student.id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: i * 0.02 }}
                                                className="hover:bg-secondary/20 transition-colors"
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="font-semibold text-foreground">{student.name}</div>
                                                    <div className="text-[10px] text-muted-foreground">{student.email}</div>
                                                </td>
                                                <td className="px-6 py-4 font-mono text-xs">{student.enrollment}</td>
                                                <td className="px-6 py-4">
                                                    <Badge variant="outline" className="bg-secondary/50">{student.section}</Badge>
                                                </td>
                                                <td className="px-6 py-4 text-center font-display font-bold text-primary">
                                                    {student.cgpa.toFixed(2)}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-center">
                                                        {student.cgpa >= 8 ? (
                                                            <ArrowUpRight className="h-4 w-4 text-green-500" />
                                                        ) : student.cgpa <= 6 ? (
                                                            <ArrowDownRight className="h-4 w-4 text-destructive" />
                                                        ) : (
                                                            <TrendingUp className="h-4 w-4 text-blue-500" />
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <Button variant="ghost" size="sm" onClick={() => window.location.href = `/mentor/student-detail?id=${student.id}`}>
                                                        Details <ChevronRight className="h-3 w-3 ml-1" />
                                                    </Button>
                                                </td>
                                            </motion.tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground italic">
                                                No students found matching your search
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default HodAcademicView;
