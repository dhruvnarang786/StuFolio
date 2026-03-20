import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink, Clock, Calendar, Timer, MapPin } from "lucide-react";
import PlatformIcon from "./PlatformIcon";
import { cn } from "@/lib/utils";

interface ContestModalProps {
    isOpen: boolean;
    onClose: () => void;
    contest: {
        title: string;
        date: string | Date;
        platform?: string;
        link?: string;
        duration?: string;
        description?: string;
        type?: string;
    } | null;
}

const CountdownBanner = ({ targetDate }: { targetDate: string | Date }) => {
    const [timeLeft, setTimeLeft] = useState<string>("");

    useEffect(() => {
        const calculate = () => {
            const diff = new Date(targetDate).getTime() - new Date().getTime();
            if (diff <= 0) return "Live Now / Passed";
            
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const secs = Math.floor((diff % (1000 * 60)) / 1000);
            
            if (days > 0) return `${days}d ${hours}h ${mins}m`;
            return `${hours}h ${mins}m ${secs}s`;
        };

        const timer = setInterval(() => setTimeLeft(calculate()), 1000);
        setTimeLeft(calculate());
        return () => clearInterval(timer);
    }, [targetDate]);

    return (
        <div className="bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                    <Timer className="h-5 w-5 text-amber-600 dark:text-amber-400 animate-pulse" />
                </div>
                <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-500">Starts in</p>
                    <p className="font-mono font-bold text-lg text-amber-900 dark:text-amber-200 tabular-nums">{timeLeft}</p>
                </div>
            </div>
        </div>
    );
};

const ContestModal: React.FC<ContestModalProps> = ({ isOpen, onClose, contest }) => {
    if (!contest) return null;

    const dateObj = new Date(contest.date);
    const endDate = contest.duration ? new Date(dateObj.getTime() + 2 * 60 * 60 * 1000) : null; // Estimate if not provided

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
                    >
                        {/* Header */}
                        <div className="p-6 pb-0 flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                    <PlatformIcon platform={contest.platform} className="h-5 w-5" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{contest.platform || contest.type}</span>
                                </div>
                                <h2 className="text-xl font-display font-bold text-foreground leading-tight">
                                    {contest.title}
                                </h2>
                            </div>
                            <button onClick={onClose} className="h-8 w-8 rounded-full hover:bg-secondary flex items-center justify-center transition-colors">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6">
                            <CountdownBanner targetDate={contest.date} />

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="p-3 rounded-xl bg-secondary/50 border border-border">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Start</p>
                                    <p className="text-sm font-semibold">{dateObj.toLocaleDateString()} {dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                                <div className="p-3 rounded-xl bg-secondary/50 border border-border">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Duration</p>
                                    <p className="text-sm font-semibold">{contest.duration || "N/A"}</p>
                                </div>
                                <div className="p-3 rounded-xl bg-secondary/50 border border-border">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Status</p>
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-primary/20 text-primary">UPCOMING</span>
                                </div>
                                <div className="p-3 rounded-xl bg-secondary/50 border border-border">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Type</p>
                                    <p className="text-sm font-semibold capitalize">{contest.type}</p>
                                </div>
                            </div>

                            {contest.link && (
                                <a 
                                    href={contest.link} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                                >
                                    Register on {contest.platform} <ExternalLink className="h-4 w-4" />
                                </a>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ContestModal;
