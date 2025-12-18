import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { api } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft, Calendar, DollarSign, Activity } from "lucide-react"
import { toast } from "sonner"
import { CostOverviewChart } from "@/components/dashboard/CostOverviewChart"
import { RiskHeatmap } from "@/components/dashboard/RiskHeatmap"
import { ProjectGantt } from "@/components/dashboard/ProjectGantt"

import { generateProjectForecast, generateProjectTimeline, calculateOverallProgress, calculateCurrentPhase } from "@/lib/insightGenerator"

export default function ProjectDetailsPage() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [project, setProject] = useState(null)
    const [loading, setLoading] = useState(true)
    const [aiLoading, setAiLoading] = useState(false)
    const [aiStats, setAiStats] = useState({
        forecast: [],
        risks: []
    })

    useEffect(() => {
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
        fetchProject()
    }, [id])

    const fetchProjectAI = async (projectData) => {
        setAiLoading(true)
        try {
            // Parallel fetch for speed
            const [forecastRes, riskRes] = await Promise.all([
                api.post("/predict/ai", { type: "project_cost_forecast", projectData }),
                api.post("/predict/ai", { type: "project_risk_assessment", projectData })
            ]);

            setAiStats({
                forecast: forecastRes.forecastData || [],
                risks: riskRes.riskData || []
            });

            if (forecastRes.insight) toast.info("AI Insight", { description: forecastRes.insight });

        } catch (error) {
            console.error("AI Project Analysis Failed", error)
            // Fallback handled by backend usually, but if API fails entirely:
            setAiStats({ forecast: [], risks: [] })
        } finally {
            setAiLoading(false)
        }
    }

    if (loading) return <div className="p-8">Loading...</div>
    if (!project) return <div className="p-8">Project not found</div>

    const forecastData = generateProjectForecast(project);
    const timelineTasks = generateProjectTimeline(project);

    // Dynamic values based on time
    const dynamicProgress = calculateOverallProgress(project);
    const dynamicPhase = calculateCurrentPhase(project);

    return (
        <div className="space-y-6">
            <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Projects
            </Button>

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

            <div className="grid gap-6 md:grid-cols-3">
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

            <div className="grid grid-cols-1 md:grid-cols-7 gap-6">
                <CostOverviewChart data={aiStats.forecast.length > 0 ? aiStats.forecast : forecastData} loading={aiLoading} />
                <RiskHeatmap data={aiStats.risks} loading={aiLoading} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-7 gap-6">
                <ProjectGantt tasks={timelineTasks} />
            </div>
        </div>
    )
}
