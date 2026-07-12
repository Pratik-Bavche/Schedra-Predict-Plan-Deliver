import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { api } from "@/lib/api"
import { toast } from "sonner"

const ALL_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

export function ProjectTelemetryDialog({ project, open, onOpenChange, onUpdate }) {
    const [loading, setLoading] = useState(false)

    // ── Determine if the project is completed ──────────────────────────────────
    const isCompleted = useMemo(() => {
        if (!project) return false;
        if (project.status === "Completed") return true;
        if (project.dueDate) {
            const end = new Date(project.dueDate);
            end.setHours(23, 59, 59, 999);
            return new Date() > end;
        }
        return false;
    }, [project]);

    // ── Derive the allowed date ceiling ───────────────────────────────────────
    const ceiling = useMemo(() => {
        if (isCompleted && project?.dueDate) return new Date(project.dueDate);
        return new Date(); // ongoing: cap at today
    }, [isCompleted, project]);

    const ceilingMonth = ALL_MONTHS[ceiling.getMonth()]; // e.g. "Jan"
    const ceilingYear  = ceiling.getFullYear().toString();

    // ── Default to ceiling month/year ─────────────────────────────────────────
    const [formData, setFormData] = useState({
        month: ceilingMonth,
        year:  ceilingYear,
        actualSpend:      "",
        activeResources:  ""
    })

    // ── Build allowed year options (startDate.year → ceiling.year) ────────────
    const allowedYears = useMemo(() => {
        const startYear = project?.startDate ? new Date(project.startDate).getFullYear() : 2024;
        const endYear   = ceiling.getFullYear();
        const years = [];
        for (let y = startYear; y <= endYear; y++) years.push(y.toString());
        return years;
    }, [project, ceiling]);

    // ── Build allowed month options for the selected year ─────────────────────
    const allowedMonths = useMemo(() => {
        const selectedYear = parseInt(formData.year);
        const startYear    = project?.startDate ? new Date(project.startDate).getFullYear() : 2024;
        const startMonth   = project?.startDate ? new Date(project.startDate).getMonth() : 0;

        return ALL_MONTHS.filter((_, idx) => {
            // Must be >= project start month in the start year
            if (selectedYear === startYear && idx < startMonth) return false;
            // Must be <= ceiling month in the ceiling year
            if (selectedYear === ceiling.getFullYear() && idx > ceiling.getMonth()) return false;
            return true;
        });
    }, [formData.year, project, ceiling]);

    // ── Budget stats ──────────────────────────────────────────────────────────
    const calculateBudgetStats = () => {
        const estimated = Number(project.budget) || 0
        const currentActualTotal = project.telemetry?.reduce((sum, t) => sum + (t.actualSpend || 0), 0) || 0
        const remaining  = estimated - currentActualTotal
        const willExceed = (currentActualTotal + (Number(formData.actualSpend) || 0)) > estimated
        return { estimated, currentActualTotal, remaining, willExceed }
    }

    const { estimated, currentActualTotal, remaining, willExceed } = calculateBudgetStats()

    // ── Handle form changes with guardrails ───────────────────────────────────
    const handleMonthChange = (val) => {
        setFormData(prev => ({ ...prev, month: val }))
    }

    const handleYearChange = (val) => {
        // When year changes, ensure selected month is still valid
        const newYear     = parseInt(val);
        const currentIdx  = ALL_MONTHS.indexOf(formData.month);
        const startYear   = project?.startDate ? new Date(project.startDate).getFullYear() : 2024;
        const startMonth  = project?.startDate ? new Date(project.startDate).getMonth() : 0;

        let newMonthIdx = currentIdx;
        if (newYear === startYear && currentIdx < startMonth)       newMonthIdx = startMonth;
        if (newYear === ceiling.getFullYear() && currentIdx > ceiling.getMonth()) newMonthIdx = ceiling.getMonth();

        setFormData(prev => ({ ...prev, year: val, month: ALL_MONTHS[newMonthIdx] }))
    }

    // ── Submit ────────────────────────────────────────────────────────────────
    const handleSubmit = async () => {
        if (!formData.actualSpend || !formData.activeResources) {
            toast.error("Please fill in all fields")
            return
        }

        // Double-check the selected month is within allowed range
        const selectedDate  = new Date(parseInt(formData.year), ALL_MONTHS.indexOf(formData.month), 1);
        const startDate     = project?.startDate ? new Date(project.startDate) : new Date(0);
        const startFloor    = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
        const ceilingFloor  = new Date(ceiling.getFullYear(), ceiling.getMonth(), 1);

        if (selectedDate < startFloor) {
            toast.error(`Cannot log data before project start (${ALL_MONTHS[startDate.getMonth()]} ${startDate.getFullYear()})`);
            return;
        }
        if (selectedDate > ceilingFloor) {
            toast.error(isCompleted
                ? `This project is completed. Cannot log data after ${ceilingMonth} ${ceilingYear}.`
                : `Cannot log data beyond the current month.`);
            return;
        }

        if (willExceed) {
            toast.warning("Budget Warning", { description: "Logging this amount will exceed the total project budget!" })
        }

        setLoading(true)
        try {
            const monthLabel = `${formData.month} ${formData.year}`
            await api.post(`/projects/${project._id}/telemetry`, {
                month:           monthLabel,
                actualSpend:     Number(formData.actualSpend),
                activeResources: Number(formData.activeResources)
            })
            toast.success(`Data logged for ${monthLabel}`)
            onUpdate()
            onOpenChange(false)
        } catch (error) {
            toast.error("Failed to log data: " + error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[450px]">
                <DialogHeader>
                    <DialogTitle>Log Monthly Data</DialogTitle>
                    <DialogDescription>
                        {isCompleted
                            ? `Project completed. You can only log data up to ${ceilingMonth} ${ceilingYear}.`
                            : "Enter metrics for a specific month."}
                    </DialogDescription>
                </DialogHeader>

                {/* Completed restriction notice */}
                {isCompleted && (
                    <div className="p-2.5 mb-1 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-medium rounded flex items-center gap-2">
                        <span>✅</span>
                        <span>Entries restricted to <strong>{new Date(project.startDate).toLocaleString('en-US', { month: 'short', year: 'numeric' })}</strong> → <strong>{ceilingMonth} {ceilingYear}</strong></span>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4 my-2 p-3 bg-muted/50 rounded-lg text-xs">
                    <div className="space-y-1">
                        <span className="text-muted-foreground uppercase font-bold tracking-tighter">Budget</span>
                        <div className="font-bold">${estimated.toLocaleString()}</div>
                    </div>
                    <div className="space-y-1 text-right">
                        <span className="text-muted-foreground uppercase font-bold tracking-tighter">Remaining</span>
                        <div className={`font-bold ${remaining < 0 ? 'text-red-500' : 'text-green-600'}`}>
                            ${remaining.toLocaleString()}
                        </div>
                    </div>
                </div>

                {willExceed && (
                    <div className="p-2 mb-2 bg-red-50 border border-red-100 text-[10px] text-red-600 font-bold rounded flex items-center justify-between">
                        <span>⚠️ Total spend will exceed budget!</span>
                        <Button variant="destructive" size="xs" className="h-6 text-[9px]" onClick={() => window.location.href='/projects'}>
                            Edit Budget
                        </Button>
                    </div>
                )}

                <div className="grid gap-4 py-2">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Month</Label>
                            <Select value={formData.month} onValueChange={handleMonthChange}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {allowedMonths.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label>Year</Label>
                            <Select value={formData.year} onValueChange={handleYearChange}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {allowedYears.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="spend">Actual Spend ($)</Label>
                        <Input
                            id="spend"
                            type="number"
                            value={formData.actualSpend}
                            onChange={(e) => setFormData({ ...formData, actualSpend: e.target.value })}
                            placeholder="e.g. 15000"
                            className={willExceed ? 'border-red-500 bg-red-50' : ''}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="resources">Active Resources</Label>
                        <Input
                            id="resources"
                            type="number"
                            value={formData.activeResources}
                            onChange={(e) => setFormData({ ...formData, activeResources: e.target.value })}
                            placeholder="e.g. 12"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleSubmit} disabled={loading}>
                        {loading ? "Logging..." : "Save Log"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
