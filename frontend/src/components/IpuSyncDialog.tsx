import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, Loader2, Globe, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface IpuSyncDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

const IpuSyncDialog = ({ open, onOpenChange, onSuccess }: IpuSyncDialogProps) => {
    const [enrollment, setEnrollment] = useState("");
    const [password, setPassword] = useState("");
    const [semester, setSemester] = useState("1st Semester");
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<"form" | "syncing" | "preview" | "success">("form");
    const [previewData, setPreviewData] = useState<any>(null);

    const handlePreview = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setStep("syncing");

        try {
            const data = await api.ipuFetchPreview({ enrollment, password, semester });
            setPreviewData(data);
            setStep("preview");
        } catch (err: any) {
            setStep("form");
            toast.error(err.response?.data?.error || "Failed to fetch results from IPU portal");
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmSync = async () => {
        if (!previewData) return;
        setLoading(true);
        try {
            // Prepare grades for the standard sync endpoint
            const grades = previewData.records.map((r: any) => ({
                subjectCode: r.code,
                grade: r.grade,
                marks: r.marks,
                internalMarks: r.internalMarks,
                externalMarks: r.externalMarks
            }));

            await api.syncAcademicRecords(semester, grades);

            setStep("success");
            toast.success("Academic records verified and saved!");
            setTimeout(() => {
                onOpenChange(false);
                onSuccess();
                setStep("form");
                setPreviewData(null);
            }, 2000);
        } catch (err: any) {
            toast.error("Failed to save records: " + (err.response?.data?.error || "Unknown error"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-width-[425px]">
                <DialogHeader>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                            <Globe className="h-5 w-5" />
                        </div>
                        <DialogTitle className="text-xl font-display font-bold">IPU Portal Sync</DialogTitle>
                    </div>
                    <DialogDescription>
                        Enter your GGSIPU student portal credentials to automatically fetch your marks, subjects, and credits.
                    </DialogDescription>
                </DialogHeader>

                {step === "form" && (
                    <form onSubmit={handlePreview} className="space-y-4 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="enrollment">Enrollment Number</Label>
                                <Input
                                    id="enrollment"
                                    placeholder="e.g. 00112803121"
                                    value={enrollment}
                                    onChange={(e) => setEnrollment(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Semester to Sync</Label>
                                <Select value={semester} onValueChange={setSemester}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {["1st Semester", "2nd Semester", "3rd Semester", "4th Semester", "5th Semester", "6th Semester", "7th Semester", "8th Semester"].map(s => (
                                            <SelectItem key={s} value={s}>{s}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Portal Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <div className="bg-secondary/50 p-3 rounded-xl flex items-start gap-3 mt-4">
                            <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                                Your credentials are used once to fetch results and are <strong>not stored</strong> on our servers.
                                We only save the academic data retrieved from the official portal.
                            </p>
                        </div>
                        <DialogFooter className="pt-4">
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Fetch & Preview Results
                            </Button>
                        </DialogFooter>
                    </form>
                )}

                {step === "preview" && previewData && (
                    <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto pr-2">
                        <div className="flex items-center justify-between bg-primary/5 p-4 rounded-xl border border-primary/10">
                            <div>
                                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Calculated SGPA</p>
                                <p className="text-3xl font-display font-bold text-primary">{previewData.previewSgpa.toFixed(2)}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Credits to Earn</p>
                                <p className="text-2xl font-display font-bold text-foreground">
                                    {previewData.records.reduce((acc: number, r: any) => acc + r.credits, 0)}
                                </p>
                            </div>
                        </div>

                        <div className="rounded-lg border overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50 border-b">
                                    <tr>
                                        <th className="text-left p-3 font-medium">Subject</th>
                                        <th className="text-center p-3 font-medium">Int</th>
                                        <th className="text-center p-3 font-medium">Ext</th>
                                        <th className="text-center p-3 font-medium">Total</th>
                                        <th className="text-center p-3 font-medium">Grade</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {previewData.records.map((record: any, idx: number) => (
                                        <tr key={idx} className="hover:bg-muted/30 transition-colors">
                                            <td className="p-3">
                                                <div className="font-medium truncate max-w-[150px]" title={record.subject}>
                                                    {record.subject}
                                                </div>
                                                <div className="text-[10px] text-muted-foreground uppercase">{record.code} • {record.credits} Cr</div>
                                            </td>
                                            <td className="p-3 text-center text-muted-foreground">{record.internalMarks}</td>
                                            <td className="p-3 text-center text-muted-foreground">{record.externalMarks}</td>
                                            <td className="p-3 text-center font-bold">{record.marks}</td>
                                            <td className="p-3 text-center">
                                                <Badge variant="outline" className="font-bold bg-primary/5 text-primary">
                                                    {record.grade}
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <Button variant="outline" className="flex-1" onClick={() => setStep("form")}>
                                Back
                            </Button>
                            <Button className="flex-2 bg-primary hover:bg-primary/90" onClick={handleConfirmSync} disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save to Dashboard
                            </Button>
                        </div>
                    </div>
                )}

                {step === "syncing" && (
                    <div className="py-12 flex flex-col items-center justify-center space-y-4 text-center">
                        <div className="relative h-16 w-16">
                            <Loader2 className="h-16 w-16 animate-spin text-primary" />
                            <Globe className="h-8 w-8 text-primary/50 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                        </div>
                        <div>
                            <p className="font-semibold text-foreground">Connecting to IPU Portal...</p>
                            <p className="text-xs text-muted-foreground mt-1">Downloading results, mapping credits, and calculating SGPA.</p>
                        </div>
                        <div className="w-full max-w-[200px] bg-secondary h-1.5 rounded-full overflow-hidden">
                            <div className="bg-primary h-full animate-pulse w-3/4 rounded-full" />
                        </div>
                    </div>
                )}

                {step === "success" && (
                    <div className="py-12 flex flex-col items-center justify-center space-y-4 text-center">
                        <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                            <CheckCircle2 className="h-10 w-10" />
                        </div>
                        <div>
                            <p className="font-bold text-lg text-foreground">Sync Complete!</p>
                            <p className="text-sm text-muted-foreground mt-1">Your academic dashboard has been updated.</p>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default IpuSyncDialog;
