import { useState } from "react"
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

export function ProjectTelemetryDialog({ project, open, onOpenChange, onUpdate }) {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        month: new Date().toLocaleString('default', { month: 'short' }),
        year: new Date().getFullYear().toString(),
        actualSpend: "",
        activeResources: ""
    })

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const years = ["2024", "2025", "2026"]
    const calculateBudgetStats = () => {
        const estimated = Number(project.budget) || 0
        const currentActualTotal = project.telemetry?.reduce((sum, t) => sum + (t.actualSpend || 0), 0) || 0
        
        // If editing a month, we should subtract the old value before adding the new one
        // But for simplicity in this dialog, we just show the remaining based on data *already* in DB
        const remaining = estimated - currentActualTotal
        const willExceed = (currentActualTotal + (Number(formData.actualSpend) || 0)) > estimated

        return { estimated, currentActualTotal, remaining, willExceed }
    }

    const { estimated, currentActualTotal, remaining, willExceed } = calculateBudgetStats()

    const handleSubmit = async () => {
        if (!formData.actualSpend || !formData.activeResources) {
            toast.error("Please fill in all fields")
            return
        }

        if (willExceed) {
            toast.warning("Budget Warning", { description: "Logging this amount will exceed the total project budget!" })
        }

        setLoading(true)
        try {
            const monthLabel = `${formData.month} ${formData.year}`
            await api.post(`/projects/${project._id}/telemetry`, {
                month: monthLabel,
                actualSpend: Number(formData.actualSpend),
                activeResources: Number(formData.activeResources)
            })
            toast.success(`Data logged for ${monthLabel}`)
            onUpdate() // Refresh project data
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
                        Enter metrics for a specific month.
                    </DialogDescription>
                </DialogHeader>

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
                            <Select value={formData.month} onValueChange={(val) => setFormData({ ...formData, month: val })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {months.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label>Year</Label>
                            <Select value={formData.year} onValueChange={(val) => setFormData({ ...formData, year: val })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
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
