import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    GraduationCap,
    TrendingUp,
    BookOpen,
    RefreshCw,
    Plus,
    Loader2,
    Calendar,
    Award,
    Info,
    CheckCircle2,
    X,
    Globe,
    ExternalLink,
} from "lucide-react";
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Area,
    AreaChart,
} from "recharts";
import DashboardLayout from "@/components/DashboardLayout";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import IpuSyncDialog from "@/components/IpuSyncDialog";

const AcademicsPage = () => {
    const [student, setStudent] = useState<any>(null);
    const [records, setRecords] = useState<any[]>([]);
    const [cgpa, setCgpa] = useState<number>(0);
    const [semesterSGPAs, setSemesterSGPAs] = useState<any[]>([]);
    const [bySemester, setBySemester] = useState<Record<string, any[]>>({});
    const [loading, setLoading] = useState(true);
    const [isSyncOpen, setIsSyncOpen] = useState(false);
    const [isIpuSyncOpen, setIsIpuSyncOpen] = useState(false);
    const [syncLoading, setSyncLoading] = useState(false);

    // Sync Form State
    const [syncSemester, setSyncSemester] = useState("1st Semester");
    const [syncGrades, setSyncGrades] = useState<any[]>([]);
    const [fetchingSubjects, setFetchingSubjects] = useState(false);

    const fetchData = async () => {
        try {
            setLoading(true);
            const data = await api.getAcademics();
            setRecords(data.records);
            setCgpa(data.cgpa);
            setSemesterSGPAs(data.semesterSGPAs);
            setBySemester(data.bySemester);

            // Fetch student profile for current status
            const profile = await api.getProfile();
            setStudent(profile.student);
        } catch (error) {
            console.error("Failed to fetch academics:", error);
            toast.error("Failed to load academic records");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        const loadSubjects = async () => {
            if (!isSyncOpen) return;
            setFetchingSubjects(true);
            try {
                const subjects = await api.getSubjectsBySemester(syncSemester);
                setSyncGrades(subjects.map((s: any) => ({
                    subjectCode: s.code,
                    subjectName: s.name,
                    grade: "A",
                    marks: 0,
                    include: true
                })));
            } catch (err) {
                console.error("Failed to load subjects:", err);
            } finally {
                setFetchingSubjects(false);
            }
        };
        loadSubjects();
    }, [syncSemester, isSyncOpen]);

    const handleAddGradeRow = () => {
        setSyncGrades([...syncGrades, { subjectCode: "", subjectName: "Custom Subject", grade: "A", marks: 0, include: true }]);
    };

    const handleRemoveGradeRow = (index: number) => {
        setSyncGrades(syncGrades.filter((_, i) => i !== index));
    };

    const handleGradeChange = (index: number, field: string, value: any) => {
        const newGrades = [...syncGrades];
        (newGrades[index] as any)[field] = value;
        setSyncGrades(newGrades);
    };

    const handleToggleInclude = (index: number) => {
        const newGrades = [...syncGrades];
        newGrades[index].include = !newGrades[index].include;
        setSyncGrades(newGrades);
    };

    const handleSyncSubmit = async () => {
        const payload = syncGrades
            .filter(g => g.include)
            .map((item: any) => {
                const { include, subjectName, ...rest } = item;
                return rest;
            });

        if (payload.length === 0) {
            toast.error("Please select at least one subject");
            return;
        }

        setSyncLoading(true);
        try {
            await api.syncAcademicRecords(syncSemester, payload);
            toast.success("Academic records synced successfully!");
            setIsSyncOpen(false);
            fetchData();
        } catch (err: any) {
            toast.error(err.message || "Failed to sync records");
        } finally {
            setSyncLoading(false);
        }
    };

    if (loading) {
        return (
            <DashboardLayout title="Academics" subtitle="Loading your progress..." role="student">
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </DashboardLayout>
        );
    }

    const chartData = semesterSGPAs.map((s: any) => ({
        name: s.semester.split(" ")[0], // "1st", "2nd" etc
        sgpa: s.sgpa,
    }));

    const semesters = Object.keys(bySemester).sort();

    // Logic for "In Progress" Semester
    const currentSem = student?.semester;
    const isCurrentSemMissing = currentSem && !semesters.includes(currentSem);
    const displaySemesters = [...semesters];
    if (isCurrentSemMissing) {
        displaySemesters.push(currentSem);
    }

    return (
        <DashboardLayout title="Academics" subtitle="Official academic dashboard & performance tracking" role="student">
            <div className="flex flex-col gap-8">

                {/* Header Metrics Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="border-primary/20 bg-primary/5 shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <Award className="h-3.5 w-3.5 text-primary" />
                                Current CGPA
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-display font-black text-primary">{cgpa?.toFixed(3) || "0.000"}</div>
                            <div className="mt-1 text-[9px] font-bold text-primary/60 uppercase">Equiv %: {(cgpa * 10).toFixed(2)}%</div>
                        </CardContent>
                    </Card>

                    <Card className="border-border/50 shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <TrendingUp className="h-3.5 w-3.5 text-blue-500" />
                                Total Marks
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-display font-black text-foreground">
                                {records.reduce((acc, r) => acc + (r.marks || 0), 0)}
                            </div>
                            <div className="mt-1 text-[9px] font-bold text-muted-foreground uppercase">
                                Percentage: {records.length > 0 ? ((records.reduce((acc, r) => acc + (r.marks || 0), 0) / (records.length * 100)) * 100).toFixed(2) : "0.00"}%
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border/50 shadow-sm">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <BookOpen className="h-3.5 w-3.5 text-emerald-500" />
                                Credits Earned
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-display font-black text-foreground">
                                {records.reduce((acc, r) => acc + (r.subject?.credits || 0), 0)}
                            </div>
                            <div className="mt-1 text-[9px] font-bold text-muted-foreground uppercase">
                                Total: {records.reduce((acc, r) => acc + (r.subject?.credits || 0), 0)} Cap
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-accent/20 bg-accent/5">
                        <CardHeader className="pb-2">
                            <CardDescription className="text-[10px] uppercase font-bold text-accent">Actions</CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-2">
                            <Button size="sm" className="h-8 gap-2 font-bold" onClick={() => setIsIpuSyncOpen(true)}>
                                <Globe className="h-3.5 w-3.5" /> Portal Sync
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Performance Visualizations */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="border-border/50 shadow-sm overflow-hidden bg-card">
                        <CardHeader className="pb-2 border-b border-border/10 bg-secondary/5">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase tracking-tighter">
                                    <TrendingUp className="h-4 w-4 text-primary" />
                                    SGPA Progression
                                </CardTitle>
                                <Badge variant="outline" className="text-[10px] border-primary/20 text-primary uppercase font-bold">Standard</Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="h-[250px] p-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorSgpa" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
                                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.4} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: "bold" }} />
                                    <YAxis domain={[0, 10]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: "bold" }} />
                                    <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 20px -5px rgb(0 0 0 / 0.1)" }} />
                                    <Area type="monotone" dataKey="sgpa" stroke="hsl(var(--primary))" strokeWidth={4} fill="url(#colorSgpa)" dot={{ r: 4, fill: "white", stroke: "hsl(var(--primary))", strokeWidth: 2 }} activeDot={{ r: 6 }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card className="border-border/50 shadow-sm overflow-hidden bg-card">
                        <CardHeader className="pb-2 border-b border-border/10 bg-secondary/5">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-bold flex items-center gap-2 uppercase tracking-tighter">
                                    <Award className="h-4 w-4 text-emerald-500" />
                                    Percentage Trend
                                </CardTitle>
                                <Badge variant="outline" className="text-[10px] border-emerald-500/20 text-emerald-600 uppercase font-bold">Yield</Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="h-[250px] p-4">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData.map(d => ({ ...d, perc: d.sgpa * 10 }))}>
                                    <defs>
                                        <linearGradient id="colorPerc" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.4} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: "bold" }} />
                                    <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: "bold" }} />
                                    <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 20px -5px rgb(0 0 0 / 0.1)" }} />
                                    <Area type="monotone" dataKey="perc" stroke="#10b981" strokeWidth={4} fill="url(#colorPerc)" dot={{ r: 4, fill: "white", stroke: "#10b981", strokeWidth: 2 }} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>

                {/* Academic Performance Tabs */}
                <div className="space-y-6">
                    <h3 className="text-2xl font-display font-black tracking-tight flex items-center gap-3">
                        <Calendar className="h-6 w-6 text-primary" />
                        Semester History
                    </h3>

                    {displaySemesters.length > 0 ? (
                        <Tabs defaultValue={displaySemesters[displaySemesters.length - 1]} className="w-full">
                            <TabsList className="bg-secondary/20 p-1 mb-8 flex-wrap h-auto gap-1">
                                {displaySemesters.map((sem) => (
                                    <TabsTrigger key={sem} value={sem} className="rounded-lg px-6 py-2 font-bold data-[state=active]:bg-primary data-[state=active]:text-white uppercase text-[10px]">
                                        {sem.split(" ")[0]} {sem.split(" ")[1]?.slice(0, 1) || ""}
                                    </TabsTrigger>
                                ))}
                            </TabsList>

                            {displaySemesters.map((sem) => {
                                const isCurrent = sem === currentSem && !semesters.includes(sem);
                                const semesterRecords = bySemester[sem] || [];
                                const sgpaData = semesterSGPAs.find((s: any) => s.semester === sem);

                                return (
                                    <TabsContent key={sem} value={sem} className="space-y-6">
                                        {isCurrent ? (
                                            <Card className="border-dashed border-2 py-20 bg-secondary/10">
                                                <CardContent className="flex flex-col items-center justify-center text-center">
                                                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                                                        <Loader2 className="h-8 w-8 text-primary animate-spin" />
                                                    </div>
                                                    <h4 className="text-xl font-bold text-foreground">Semester In Progress</h4>
                                                    <p className="text-sm text-muted-foreground max-w-xs mt-2">
                                                        You are currently in your <strong>{sem}</strong>. Official results are typically announced after exams.
                                                    </p>
                                                    <Button variant="outline" className="mt-6 gap-2" onClick={() => setIsIpuSyncOpen(true)}>
                                                        <Globe className="h-4 w-4" /> Check Portal Again
                                                    </Button>
                                                </CardContent>
                                            </Card>
                                        ) : (
                                            <div className="space-y-8">
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-primary/5 p-6 rounded-2xl border border-primary/10 shadow-inner">
                                                    <div className="space-y-0.5">
                                                        <p className="text-[10px] font-black text-muted-foreground/60 uppercase">Semester SGPA</p>
                                                        <p className="text-3xl font-display font-black text-primary">{sgpaData?.sgpa?.toFixed(3) || "0.000"}</p>
                                                    </div>
                                                    <div className="space-y-0.5">
                                                        <p className="text-[10px] font-black text-muted-foreground/60 uppercase">Marks Range</p>
                                                        <p className="text-xl font-bold">{semesterRecords.reduce((acc, r) => acc + (r.marks || 0), 0)} / {semesterRecords.length * 100}</p>
                                                    </div>
                                                    <div className="space-y-0.5">
                                                        <p className="text-[10px] font-black text-muted-foreground/60 uppercase">Credits</p>
                                                        <p className="text-xl font-bold">{semesterRecords.reduce((acc, r) => acc + (r.subject?.credits || 0), 0)} pts</p>
                                                    </div>
                                                    <div className="flex items-center">
                                                        <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-black uppercase text-[10px] py-1 px-3">Official Result</Badge>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                                    {semesterRecords.map((record: any, idx: number) => {
                                                        const isLab = record.subject?.name?.toLowerCase().includes("lab");
                                                        const isExtras = record.subject?.code?.startsWith("HS");

                                                        return (
                                                            <motion.div
                                                                key={record.id}
                                                                initial={{ opacity: 0, y: 15 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                transition={{ delay: idx * 0.04 }}
                                                                className="bg-card border border-border/60 rounded-3xl p-5 shadow-sm hover:shadow-xl hover:shadow-primary/5 hover:border-primary/30 transition-all flex flex-col h-full ring-primary/5 hover:ring-4"
                                                            >
                                                                <div className="flex justify-between items-start mb-4">
                                                                    <div className="max-w-[80%]">
                                                                        <h5 className="text-[11px] font-black text-primary uppercase tracking-tighter mb-1">{record.subject?.code}</h5>
                                                                        <h4 className="font-bold text-sm leading-tight h-10 line-clamp-2 uppercase">{record.subject?.name}</h4>
                                                                    </div>
                                                                    <Badge variant="secondary" className="text-[8px] px-1 py-0 h-4 font-black bg-secondary/50">
                                                                        {isLab ? "LAB" : isExtras ? "EXTRAS" : "THEORY"}
                                                                    </Badge>
                                                                </div>

                                                                <div className="space-y-3 mt-auto">
                                                                    <div className="grid grid-cols-2 gap-2 text-center bg-secondary/20 p-2 rounded-2xl">
                                                                        <div className="border-r border-border/50">
                                                                            <p className="text-[9px] font-bold text-muted-foreground uppercase mb-0.5">Int</p>
                                                                            <p className="text-xs font-black">{record.internalMarks || "--"}</p>
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-[9px] font-bold text-muted-foreground uppercase mb-0.5">Ext</p>
                                                                            <p className="text-xs font-black">{record.externalMarks || "--"}</p>
                                                                        </div>
                                                                    </div>

                                                                    <div className="space-y-1">
                                                                        <div className="flex justify-between text-[10px] font-black">
                                                                            <span className="text-muted-foreground uppercase opacity-60 font-bold">Total Score</span>
                                                                            <span className="text-foreground">{record.marks}/100</span>
                                                                        </div>
                                                                        <div className="h-2 w-full bg-secondary/50 rounded-full overflow-hidden p-[1px]">
                                                                            <div
                                                                                className="h-full bg-primary rounded-full shadow-[0_0_8px_rgba(var(--primary),0.4)] transition-all duration-1000"
                                                                                style={{ width: `${record.marks}%` }}
                                                                            />
                                                                        </div>
                                                                    </div>

                                                                    <div className="pt-2">
                                                                        <div className="w-full py-2 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl text-center text-emerald-600 font-display font-black text-2xl tracking-[0.2em] shadow-inner">
                                                                            {record.grade}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </motion.div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </TabsContent>
                                );
                            })}
                        </Tabs>
                    ) : (
                        <Card className="border-dashed border-2 py-20">
                            <CardContent className="flex flex-col items-center text-center">
                                <Info className="h-12 w-12 text-muted-foreground mb-4" />
                                <h4 className="text-xl font-bold">Welcome to Academics!</h4>
                                <p className="text-sm text-muted-foreground max-w-sm mt-2">
                                    Your academic journey starts here. Sync with the IPU Portal to import your results automatically.
                                </p>
                                <Button className="mt-8 gap-2 px-8 py-6 rounded-2xl font-black text-lg shadow-xl shadow-primary/20" onClick={() => setIsIpuSyncOpen(true)}>
                                    <Globe className="h-5 w-5" /> Start Portal Sync
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

            {/* Sync Dialogs */}
            <IpuSyncDialog
                open={isIpuSyncOpen}
                onOpenChange={setIsIpuSyncOpen}
                onSuccess={fetchData}
            />

            <Dialog open={isSyncOpen} onOpenChange={setIsSyncOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Manual Grade Entry</DialogTitle>
                        <DialogDescription>Add your results manually if the portal sync is unavailable.</DialogDescription>
                    </DialogHeader>
                    {/* ... (Manual Form omitted for brevity but preserved in logic) */}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsSyncOpen(false)}>Cancel</Button>
                        <Button onClick={handleSyncSubmit}>Save Records</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
};

export default AcademicsPage;
