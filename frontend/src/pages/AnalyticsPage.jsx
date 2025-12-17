import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, Users, Zap, Calendar, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { ResourceUtilizationChart } from "@/components/dashboard/ResourceUtilizationChart"
import { CostBreakdownChart } from "@/components/dashboard/CostBreakdownChart"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { api } from "@/lib/api"
import { generateResourceData, generateCostBreakdown } from "@/lib/insightGenerator"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"

export default function AnalyticsPage() {
    const [projects, setProjects] = useState([])
    const [selectedProjectId, setSelectedProjectId] = useState("all")
    const [timeRange, setTimeRange] = useState("all") // 'all' or 'last30'
    const [resourceData, setResourceData] = useState(null)
    const [costData, setCostData] = useState(null)

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const data = await api.get("/projects")
                setProjects(data)
            } catch (error) {
                console.error("Failed to fetch projects:", error)
            }
        }
        fetchProjects()
    }, [])

    useEffect(() => {
        if (selectedProjectId === "all") {
            // eslint-disable-next-line
            setResourceData(null) // Reset to default
            setCostData(null)    // Reset to default
            // If filtering by date on aggregate view, we need logic for that or keep defaults
            // For now, let's allow insightGenerator to handle "mock" aggregate updates too?
            // Actually, existing components have defaults. Let's create mock aggregate if filtered.
            if (timeRange === 'last30') {
                // Mock aggregate data for last 30 days
                setResourceData([
                    { site: "Site A", manpower: 100 },
                    { site: "Site B", manpower: 70 },
                    { site: "Site C", manpower: 120 },
                    { site: "Site D", manpower: 50 },
                    { site: "HQ", manpower: 20 },
                ])
                setCostData([
                    { name: "Labor", value: 6000, color: "hsl(var(--primary))" },
                    { name: "Materials", value: 4500, color: "#22d3ee" },
                    { name: "Equipment", value: 2000, color: "#f472b6" },
                    { name: "Overhead", value: 1200, color: "#a3a3a3" },
                ])
            }
        } else {
            const project = projects.find(p => p._id === selectedProjectId)
            if (project) {
                setResourceData(generateResourceData(project, timeRange))
                setCostData(generateCostBreakdown(project, timeRange))
                toast.success(`Showing analytics for ${project.name}`)
            }
        }
    }, [selectedProjectId, projects, timeRange])

    const handleDateFilter = () => {
        const newRange = timeRange === 'all' ? 'last30' : 'all'
        setTimeRange(newRange)
        toast.success(newRange === 'last30' ? "Showing last 30 days" : "Showing all time")
    }

    const handleExport = async () => {
        const element = document.getElementById('analytics-report')
        if (!element) return

        toast.promise(
            (async () => {
                const canvas = await html2canvas(element)
                const imgData = canvas.toDataURL('image/png')
                const pdf = new jsPDF()
                const imgProps = pdf.getImageProperties(imgData)
                const pdfWidth = pdf.internal.pageSize.getWidth()
                const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width

                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
                pdf.save('schedra-analytics-report.pdf')
            })(),
            {
                loading: 'Generating report...',
                success: 'Report downloaded successfully!',
                error: 'Failed to generate report'
            }
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
                    <p className="text-muted-foreground">Deep dive into project performance and resource utilization.</p>
                </div>
                <div className="flex gap-2">
                    <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Filter by Project" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Projects (Aggregate)</SelectItem>
                            {projects.map((project) => (
                                <SelectItem key={project._id} value={project._id}>
                                    {project.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button
                        variant={timeRange === 'last30' ? "default" : "outline"}
                        onClick={handleDateFilter}
                    >
                        <Calendar className="mr-2 h-4 w-4" />
                        {timeRange === 'last30' ? "Last 30 Days" : "All Time"}
                    </Button>
                    <Button onClick={handleExport}>
                        <Download className="mr-2 h-4 w-4" /> Export Report
                    </Button>
                </div>
            </div>

            <div id="analytics-report" className="space-y-6 p-1 bg-background">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {/* Resource Util Chart */}
                    <ResourceUtilizationChart className="col-span-2" data={resourceData} />

                    {/* Cost Breakdown */}
                    <CostBreakdownChart className="col-span-1" data={costData} />
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Efficiency Score</CardTitle>
                            <Zap className="h-4 w-4 text-yellow-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">92.4%</div>
                            <p className="text-xs text-muted-foreground">+4% from last month</p>
                            <div className="mt-4 h-2 w-full bg-secondary rounded-full overflow-hidden">
                                <div className="h-full bg-yellow-500 w-[92%]"></div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Forecast Accuracy</CardTitle>
                            <TrendingUp className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">98.1%</div>
                            <p className="text-xs text-muted-foreground">Model performing optimally</p>
                            <div className="mt-4 h-2 w-full bg-secondary rounded-full overflow-hidden">
                                <div className="h-full bg-green-500 w-[98%]"></div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Team Availability</CardTitle>
                            <Users className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">85%</div>
                            <p className="text-xs text-muted-foreground">15% currently on leave/training</p>
                            <div className="mt-4 h-2 w-full bg-secondary rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 w-[85%]"></div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
