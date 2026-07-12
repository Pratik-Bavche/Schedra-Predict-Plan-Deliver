import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Calendar, DollarSign, Activity, Loader2, ListOrdered } from "lucide-react"
import { toast } from "sonner"
import { CostOverviewChart } from "@/components/dashboard/CostOverviewChart"
import { RiskHeatmap } from "@/components/dashboard/RiskHeatmap"
import { ProjectGantt } from "@/components/dashboard/ProjectGantt"
import { ProjectTelemetryDialog } from "@/components/projects/ProjectTelemetryDialog"
import { ProjectTelemetryList } from "@/components/projects/ProjectTelemetryList"
import { ProjectTimelineDialog } from "@/components/projects/ProjectTimelineDialog"

import { generateProjectForecast, generateProjectTimeline, calculateOverallProgress, calculateCurrentPhase } from "@/lib/insightGenerator"

export default function ProjectDetailsPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [project, setProject] = useState(null)
    const [loading, setLoading] = useState(true)
    const [aiLoading, setAiLoading] = useState(false)
    const [telemetryOpen, setTelemetryOpen] = useState(false)
    const [listOpen, setListOpen] = useState(false)
    const [timelineOpen, setTimelineOpen] = useState(false)
    const [aiStats, setAiStats] = useState({
        forecast: [],
        risks: []
    })

    const fetchProject = async () => {
        try {
            // Fetch using internal ID
            const data = await api.get(`/projects/${id}`)
            setProject(data)

            // Fetch AI Stats
            if (data) {
                fetchProjectAI(data)
            }
        } catch {
            toast.error("Failed to load project details")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchProject()
    }, [id])

    const fetchProjectAI = async (projectData) => {
        setAiLoading(true)
        try {
            const [forecastRes, riskRes] = await Promise.all([
                api.post("/predict/ai", { type: "project_cost_forecast", projectData }),
                api.post("/predict/ai", { type: "project_risk_assessment", projectData })
            ]);

            const rawForecast = forecastRes.forecastData || [];
            setAiStats({
                forecast: postProcessForecast(rawForecast, projectData),
                risks: riskRes.riskData || []
            });
        } catch (error) {
            console.error("AI Project Analysis Failed", error)
            setAiStats({ forecast: [], risks: [] })
        } finally {
            setAiLoading(false)
        }
    }

    /**
     * Post-processes forecast data for a single project:
     *  - Clips months after the project's dueDate (for completed projects)
     *  - Marks the current month with isCurrentMonth:true (only for ongoing projects)
     */
    const postProcessForecast = (forecastData, proj) => {
        if (!forecastData || forecastData.length === 0) return forecastData;

        const currentMonthLabel = new Date().toLocaleString('en-US', { month: 'short', year: 'numeric' });
        const dueDate = proj?.dueDate ? new Date(proj.dueDate) : null;
        const isCompleted = proj?.status === 'Completed' ||
            (dueDate && new Date() > dueDate);

        return forecastData
            .filter(d => {
                if (!isCompleted || !dueDate) return true;
                // Parse "Jun 2026" → Date
                try {
                    const parts = d.name.split(' ');
                    const entryDate = new Date(`${parts[0]} 1, ${parts[1]}`);
                    return (
                        entryDate.getFullYear() < dueDate.getFullYear() ||
                        (entryDate.getFullYear() === dueDate.getFullYear() &&
                         entryDate.getMonth() <= dueDate.getMonth())
                    );
                } catch { return true; }
            })
            .map(d => ({
                ...d,
                isCurrentMonth: !isCompleted && d.name === currentMonthLabel
            }));
    };

    if (loading || (aiLoading && !project)) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-muted-foreground animate-pulse font-medium">Gathering project insights...</p>
        </div>
    )
    if (!loading && !project) return <div className="p-8 text-center text-muted-foreground font-medium">Project not found. Please verify the URL.</div>

    const forecastData = postProcessForecast(generateProjectForecast(project), project);
    const chartForecast = aiStats.forecast.length > 0 ? aiStats.forecast : forecastData;
    const timelineTasks = generateProjectTimeline(project);

    // Dynamic values based on time
    const dynamicProgress = calculateOverallProgress(project);
    const dynamicPhase = calculateCurrentPhase(project);

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <Button variant="ghost" onClick={() => navigate(-1)} className="w-fit">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Projects
                </Button>
                <div className="flex flex-wrap gap-2">
                    <Button onClick={() => setListOpen(true)} variant="outline" className="flex-1 sm:flex-none">
                        <ListOrdered className="mr-2 h-4 w-4" /> Monthly List View
                    </Button>
                    <Button onClick={() => setTelemetryOpen(true)} variant="outline" className="flex-1 sm:flex-none">
                        <Activity className="mr-2 h-4 w-4" /> Log Data
                    </Button>
                </div>
            </div>

            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
                    <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline">{project.projectId}</Badge>
                        <Badge variant={dynamicPhase === "Completed" ? "default" : "secondary"}>
                            {dynamicPhase}
                        </Badge>
                        <Badge variant={project.riskLevel === "High" ? "destructive" : "secondary"}>
                            {project.riskLevel} Risk
                        </Badge>
                    </div>
                </div>
            </div>

            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Budget</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${project.budget.toLocaleString()}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Due Date</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{new Date(project.dueDate).toLocaleDateString()}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Progress (Time Elapsed)</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{dynamicProgress}%</div>
                        <Progress value={dynamicProgress} className="mt-2" />
                        <p className="text-xs text-muted-foreground mt-1">
                            Phase: {dynamicPhase}
                        </p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Description</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">
                        {project.description || "No description provided."}
                    </p>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="min-h-[400px]">
                    <CostOverviewChart data={chartForecast} loading={aiLoading} />
                </div>
                <div className="min-h-[400px]">
                    <RiskHeatmap data={aiStats.risks} loading={aiLoading} />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-7 gap-6">
                <ProjectGantt 
                    tasks={timelineTasks} 
                    headerAction={
                        <Button variant="outline" size="sm" onClick={() => setTimelineOpen(true)}>
                            Adjust Timeline
                        </Button>
                    }
                />
            </div>

            <ProjectTelemetryDialog
                open={telemetryOpen}
                onOpenChange={setTelemetryOpen}
                project={project}
                onUpdate={fetchProject}
            />

            <ProjectTelemetryList
                open={listOpen}
                onOpenChange={setListOpen}
                project={project}
                onUpdate={fetchProject}
            />

            <ProjectTimelineDialog
                open={timelineOpen}
                onOpenChange={setTimelineOpen}
                project={project}
                onUpdate={fetchProject}
            />
        </div>
    )
}
