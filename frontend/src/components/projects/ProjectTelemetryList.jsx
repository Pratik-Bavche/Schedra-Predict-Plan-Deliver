import { useState, useEffect } from "react"
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { api } from "@/lib/api"
import { toast } from "sonner"
import { Loader2, Save } from "lucide-react"

export function ProjectTelemetryList({ project, open, onOpenChange, onUpdate }) {
    const [loading, setLoading] = useState(false)
    const [rows, setRows] = useState([])

    useEffect(() => {
        if (open && project) {
            generateMonthlyRows()
        }
    }, [open, project])

    const isCompleted = project.status === "Completed" ||
        (project.dueDate && new Date() > new Date(project.dueDate));

    const generateMonthlyRows = () => {
        const start = new Date(project.startDate);

        // For completed projects, cap at dueDate; for ongoing, cap at today
        const rawEnd = isCompleted && project.dueDate
            ? new Date(project.dueDate)
            : new Date();

        const end = new Date(rawEnd.getFullYear(), rawEnd.getMonth(), 1);
        const generated = []

        let current = new Date(start.getFullYear(), start.getMonth(), 1)
        
        while (current <= end) {
            const monthLabel = current.toLocaleString('en-US', { month: 'short', year: 'numeric' })
            
            // Locale-agnostic lookup: compare by year+month index
            const existing = project.telemetry?.find(t => {
                try {
                    const d = new Date(t.month.replace(/^(\w+)\s(\d{4})$/, '$1 1, $2'));
                    if (!isNaN(d.getTime())) {
                        return d.getFullYear() === current.getFullYear() &&
                               d.getMonth()    === current.getMonth();
                    }
                    // numeric format "M/YYYY"
                    const parts = t.month.match(/^(\d{1,2})\/(\d{4})$/);
                    if (parts) {
                        return parseInt(parts[2]) === current.getFullYear() &&
                               parseInt(parts[1]) - 1 === current.getMonth();
                    }
                    return false;
                } catch { return false; }
            })
            
            generated.push({
                month: monthLabel,
                actualSpend: existing ? existing.actualSpend : "",
                activeResources: existing ? existing.activeResources : ""
            })

            current.setMonth(current.getMonth() + 1)
        }

        setRows(generated.reverse()) // Show latest first
    }


    const handleInputChange = (index, field, value) => {
        const newRows = [...rows]
        newRows[index][field] = value
        setRows(newRows)
    }

    const calculateBudgetStats = () => {
        const estimated = Number(project.budget) || 0
        const actualTotal = rows.reduce((sum, row) => sum + (Number(row.actualSpend) || 0), 0)
        const remaining = estimated - actualTotal
        const isOverBudget = actualTotal > estimated

        return { estimated, actualTotal, remaining, isOverBudget }
    }

    const { estimated, actualTotal, remaining, isOverBudget } = calculateBudgetStats()

    const handleSubmit = async () => {
        if (isOverBudget) {
            toast.error("Cannot save: Total actual spend exceeds project budget!")
            return
        }

        setLoading(true)
        try {
            const payload = rows
                .filter(r => r.actualSpend !== "" || r.activeResources !== "")
                .map(r => ({
                    month: r.month,
                    actualSpend: Number(r.actualSpend),
                    activeResources: Number(r.activeResources)
                }))

            await api.post(`/projects/${project._id}/telemetry/bulk`, {
                telemetry: payload
            })
            
            toast.success(`Project metrics updated successfully`)
            onUpdate()
            onOpenChange(false)
        } catch (error) {
            toast.error("Failed to update: " + error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Project Metrics: Monthly List View</DialogTitle>
                    <DialogDescription>
                        {isCompleted
                            ? `Showing months from ${new Date(project.startDate).toLocaleDateString()} to ${new Date(project.dueDate).toLocaleDateString()} (project completed).`
                            : `Enter actual data for each month starting from ${new Date(project.startDate).toLocaleDateString()}.`
                        }
                    </DialogDescription>
                </DialogHeader>

                {/* Completed project restriction notice */}
                {isCompleted && (
                    <div className="mb-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-sm font-medium rounded flex items-center gap-2">
                        <span>✅</span>
                        <span>
                            This project is <strong>completed</strong>. Log data is restricted to months within the project duration
                            ({new Date(project.startDate).toLocaleString('en-US', { month: 'short', year: 'numeric' })} → {new Date(project.dueDate).toLocaleString('en-US', { month: 'short', year: 'numeric' })}).
                        </span>
                    </div>
                )}
                
                {/* Budget Dashboard */}
                <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-muted/30 rounded-lg border border-border/50">
                    <div className="space-y-1">
                        <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Estimated Budget</Label>
                        <div className="text-xl font-black">${estimated.toLocaleString()}</div>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Total Actual Spend</Label>
                        <div className={`text-xl font-black ${isOverBudget ? 'text-red-500' : 'text-primary'}`}>
                            ${actualTotal.toLocaleString()}
                        </div>
                    </div>
                    <div className="space-y-1 text-right">
                        <Label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Remaining Budget</Label>
                        <div className={`text-xl font-black ${remaining < 0 ? 'text-red-500' : 'text-green-600'}`}>
                            ${remaining.toLocaleString()}
                        </div>
                    </div>
                </div>

                {isOverBudget && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm font-bold flex items-center justify-between gap-2 rounded animate-pulse">
                        <span className="flex items-center gap-2">⚠️ WARNING: Cumulative actual spend is greater than the estimated budget!</span>
                        <Button variant="destructive" size="sm" className="h-7 text-[10px]" onClick={() => window.location.href='/projects'}>
                            Edit Budget Settings
                        </Button>
                    </div>
                )}

                <div className="py-2">
                    {rows.length === 0 ? (
                        <div className="text-center p-8 text-muted-foreground">
                            No months generated. Check project start date.
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Month</TableHead>
                                    <TableHead>Actual Spend ($)</TableHead>
                                    <TableHead>Active Resources</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {rows.map((row, index) => (
                                    <TableRow key={row.month}>
                                        <TableCell className="font-medium">{row.month}</TableCell>
                                        <TableCell>
                                            <Input 
                                                type="number" 
                                                value={row.actualSpend} 
                                                onChange={(e) => handleInputChange(index, 'actualSpend', e.target.value)}
                                                placeholder="0"
                                                className={`w-full ${Number(row.actualSpend) > estimated ? 'border-red-500 bg-red-50' : ''}`}
                                            />
                                            {Number(row.actualSpend) > estimated && <span className="text-[10px] text-red-500 font-bold">Exceeds total budget</span>}
                                        </TableCell>
                                        <TableCell>
                                            <Input 
                                                type="number" 
                                                value={row.activeResources} 
                                                onChange={(e) => handleInputChange(index, 'activeResources', e.target.value)}
                                                placeholder="0"
                                                className="w-full"
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </div>

                <DialogFooter className="sticky bottom-0 bg-background pt-4 border-t mt-4">
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={loading || isOverBudget}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save All Metrics
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
