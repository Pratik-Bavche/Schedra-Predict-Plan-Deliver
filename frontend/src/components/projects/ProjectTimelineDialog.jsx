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
import { api } from "@/lib/api"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"

export function ProjectTimelineDialog({ open, onOpenChange, project, onUpdate }) {
  const [loading, setLoading] = useState(false)
  const [selectedPhase, setSelectedPhase] = useState("Planning")
  const [endDate, setEndDate] = useState("")

  const phases = ["Planning", "Implementation", "Testing", "Deployment"]

  // Effect to reset/set current actual end date when phase is selected
  useEffect(() => {
    if (project && open) {
      const adjustment = project.phaseAdjustments?.find(a => a.phaseName === selectedPhase)
      if (adjustment && adjustment.endDate) {
        setEndDate(new Date(adjustment.endDate).toISOString().split('T')[0])
      } else {
        setEndDate("")
      }
    }
  }, [project, selectedPhase, open])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!endDate) {
      toast.error("Please provide a valid date")
      return
    }

    try {
      setLoading(true)
      const newAdjustments = [...(project.phaseAdjustments || [])]
      const index = newAdjustments.findIndex(a => a.phaseName === selectedPhase)
      
      const newAdjustment = { phaseName: selectedPhase, endDate: new Date(endDate) }
      if (index !== -1) {
        newAdjustments[index] = newAdjustment
      } else {
        newAdjustments.push(newAdjustment)
      }

      await api.put(`/projects/${project._id}`, {
        phaseAdjustments: newAdjustments
      })

      toast.success(`${selectedPhase} timeline updated! Dependent phases adjusted.`)
      onUpdate()
      onOpenChange(false)
    } catch (error) {
      toast.error("Failed to update timeline")
    } finally {
      setLoading(false)
    }
  }

  const handleReset = async () => {
    try {
      setLoading(true)
      const newAdjustments = [...(project.phaseAdjustments || [])].filter(a => a.phaseName !== selectedPhase)
      await api.put(`/projects/${project._id}`, {
        phaseAdjustments: newAdjustments
      })
      toast.success(`${selectedPhase} timeline reset to AI prediction.`)
      onUpdate()
      onOpenChange(false)
    } catch (error) {
      toast.error("Failed to reset timeline")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Adjust Project Timeline</DialogTitle>
          <DialogDescription>
            Manually update the completion date of a phase. Dependent phases will be automatically shifted based on AI predictions.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Select Phase</Label>
            <Select value={selectedPhase} onValueChange={setSelectedPhase}>
              <SelectTrigger>
                <SelectValue placeholder="Select a phase" />
              </SelectTrigger>
              <SelectContent>
                {phases.map(phase => (
                  <SelectItem key={phase} value={phase}>{phase}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="endDate">Actual / Adjusted Completion Date</Label>
            <Input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>
          <DialogFooter className="flex items-center gap-2 sm:justify-between">
            <Button type="button" variant="ghost" onClick={handleReset} disabled={loading} className="w-full sm:w-auto">
              Reset to Predicted
            </Button>
            <Button type="submit" disabled={loading} className="w-full sm:w-auto">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save & Recalculate
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
