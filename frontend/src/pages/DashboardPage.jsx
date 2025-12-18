import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CostOverviewChart } from "@/components/dashboard/CostOverviewChart"
import { RiskHeatmap } from "@/components/dashboard/RiskHeatmap"
import { ProjectGantt } from "@/components/dashboard/ProjectGantt"
import { DollarSign, Activity, Users, AlertTriangle, Bell, Trash2 } from "lucide-react"
import { api } from "@/lib/api"
import { toast } from "sonner"
import { generateProjectForecast, generateProjectTimeline, calculateCurrentPhase } from "@/lib/insightGenerator"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function DashboardPage() {
    const [stats, setStats] = useState({
        totalBudget: 0,
        totalProjects: 0,
        delayDays: 0,
        totalResources: 0,
        highRiskCount: 0,
        forecastData: [],
        riskData: [],
        ganttTasks: [],
        allProjects: [],
        notifications: []
    })
    const [loading, setLoading] = useState(true)
    const [loadingForecast, setLoadingForecast] = useState(false)
    const [selectedMetric, setSelectedMetric] = useState(null)
    const [ganttFilter, setGanttFilter] = useState("all")

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await api.get("/projects")
                const projects = Array.isArray(response) ? response : [];

                // 1. Basic Stats & Local Aggregations
                let budget = 0;
                let resources = 0;
                let riskCount = 0;
                let delay = 0;
                const now = new Date();
                const regionMap = {};

                projects.forEach(p => {
                    try {
                        budget += (Number(p.budget) || 0);
                        resources += (parseInt(p.teamSize) || 0);
                        if (p.riskLevel === 'High' || p.riskLevel === 'Critical') riskCount++;

                        if (p.dueDate) {
                            const due = new Date(p.dueDate);
                            if (!isNaN(due.getTime()) && p.status !== 'Completed' && now > due) {
                                const diffDays = Math.ceil(Math.abs(now - due) / (1000 * 60 * 60 * 24));
                                delay += diffDays;
                            }
                        }

                        // Regional Risk Aggregation
                        const region = p.region || p.type || "General";
                        if (!regionMap[region]) regionMap[region] = { count: 0, scoreSum: 0 };
                        let score = p.riskLevel === 'Critical' ? 95 : p.riskLevel === 'High' ? 85 : p.riskLevel === 'Medium' ? 55 : 20;
                        regionMap[region].count++;
                        regionMap[region].scoreSum += score;
                    } catch (err) { console.warn("Skipping malformed project data", p); }
                });

                const finalRisk = Object.keys(regionMap).map(r => ({
                    region: r,
                    factor: "Composite",
                    score: Math.round(regionMap[r].scoreSum / regionMap[r].count)
                }));

                // Notifications Logic
                const recencyLimitDays = 7;
                const lastCleared = localStorage.getItem('notificationLastCleared');
                const lastClearedDate = lastCleared ? new Date(parseInt(lastCleared)) : new Date(0);
                const activeNotifications = [];

                projects.forEach(p => {
                    const timeline = generateProjectTimeline(p);
                    const status = calculateCurrentPhase(p);
                    if (status === 'Completed' && p.dueDate) {
                        const end = new Date(p.dueDate);
                        const diff = (now - end) / (1000 * 60 * 60 * 24);
                        if (diff >= 0 && diff <= recencyLimitDays && end > lastClearedDate) {
                            activeNotifications.push({ ...p, status: 'Completed', phaseName: 'Completed', eventDate: end });
                        }
                    } else {
                        const currentPhaseObj = timeline.find(t => now >= new Date(t.start) && now <= new Date(t.end));
                        if (currentPhaseObj) {
                            const startDate = new Date(currentPhaseObj.start);
                            const diff = (now - startDate) / (1000 * 60 * 60 * 24);
                            if (diff >= 0 && diff <= recencyLimitDays && startDate > lastClearedDate) {
                                activeNotifications.push({ ...p, status: currentPhaseObj.name, phaseName: currentPhaseObj.name, eventDate: startDate });
                            }
                        }
                    }
                });

                setStats({
                    totalBudget: budget,
                    totalProjects: projects.length,
                    delayDays: delay,
                    totalResources: resources,
                    highRiskCount: riskCount,
                    forecastData: [], // Will be filled by AI
                    riskData: finalRisk,
                    ganttTasks: [],
                    allProjects: projects,
                    notifications: activeNotifications
                });

                setLoading(false);

                // 2. Fetch Aggregated AI Forecast
                if (projects.length > 0) {
                    fetchAIForecast(projects);
                }

            } catch (error) {
                toast.error("Failed to load dashboard data");
                console.error(error);
                setLoading(false);
            }
        }
        fetchData()
    }, [])

    const fetchAIForecast = async (projects) => {
        setLoadingForecast(true);
        try {
            // Send request to AI
            const res = await api.post("/predict/ai", {
                type: "dashboard_cost_forecast",
                projects: projects.map(p => ({ name: p.name, budget: p.budget }))
            });

            if (res && res.forecastData) {
                setStats(prev => ({ ...prev, forecastData: res.forecastData }));
            }
        } catch (error) {
            console.error("AI Forecast Failed", error);
            // Fallback: Local Aggregation if API completely fails (though backend handles fallback usually)
            fallbackLocalForecast(projects);
        } finally {
            setLoadingForecast(false);
        }
    }

    const fallbackLocalForecast = (projects) => {
        const aggregatedForecast = {};
        projects.forEach(p => {
            const pForecast = generateProjectForecast(p);
            if (Array.isArray(pForecast)) {
                pForecast.forEach(entry => {
                    if (!aggregatedForecast[entry.month]) aggregatedForecast[entry.month] = { actual: 0, forecast: 0 };
                    aggregatedForecast[entry.month].actual += (entry.actual || 0);
                    aggregatedForecast[entry.month].forecast += (entry.forecast || 0);
                });
            }
        });
        const finalForecast = Object.keys(aggregatedForecast).map(month => ({
            month,
            actual: aggregatedForecast[month].actual,
            forecast: aggregatedForecast[month].forecast
        }));
        setStats(prev => ({ ...prev, forecastData: finalForecast }));
    }

    const getFilteredProjects = () => {
        if (!selectedMetric) return [];
        const { allProjects } = stats;
        const now = new Date();

        switch (selectedMetric) {
            case 'budget':
                return allProjects.map(p => ({
                    name: p.name,
                    value: `$${(p.budget || 0).toLocaleString()}`,
                    sub: "Total Budget"
                }));
            case 'delay':
                return allProjects.filter(p => {
                    if (!p.dueDate || p.status === 'Completed') return false;
                    const due = new Date(p.dueDate);
                    return !isNaN(due.getTime()) && now > due;
                }).map(p => {
                    const diffTime = Math.abs(now - new Date(p.dueDate));
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    return {
                        name: p.name,
                        value: `+${diffDays} Days`,
                        sub: "Overdue"
                    };
                });
            case 'resources':
                return allProjects.map(p => ({
                    name: p.name,
                    value: p.teamSize || 0,
                    sub: "Staff Members"
                }));
            case 'risk':
                return allProjects.filter(p => p.riskLevel === 'High' || p.riskLevel === 'Critical')
                    .map(p => ({
                        name: p.name,
                        value: p.riskLevel,
                        sub: "Risk Level"
                    }));
            default:
                return [];
        }
    }

    const getDialogTitle = () => {
        switch (selectedMetric) {
            case 'budget': return "Project Budgets";
            case 'delay': return "Schedule Delays";
            case 'resources': return "Resource Allocation";
            case 'risk': return "High Risk Projects";
            default: return "Details";
        }
    }

    // Dynamic Gantt Task Generation
    const getFilteredGanttTasks = () => {
        const { allProjects } = stats;
        let filteredProjects = [];

        if (ganttFilter === 'all') {
            filteredProjects = allProjects;
        } else {
            // Specific Project ID
            filteredProjects = allProjects.filter(p => p._id === ganttFilter || p.id === ganttFilter);
        }

        let tasks = [];
        filteredProjects.forEach(p => {
            const pTasks = generateProjectTimeline(p);
            if (Array.isArray(pTasks)) {
                const validTasks = pTasks.filter(t => t && t.start && !isNaN(new Date(t.start).getTime()) && t.end && !isNaN(new Date(t.end).getTime()));
                tasks = [...tasks, ...validTasks];
            }
        });
        return tasks;
    }

    const clearNotifications = () => {
        localStorage.setItem('notificationLastCleared', Date.now().toString());
        setStats(prev => ({ ...prev, notifications: [] }));
        toast.success("Notifications cleared");
    }

    if (loading) return <div className="p-8">Loading dashboard...</div>

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                <div className="flex items-center space-x-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon" className="relative">
                                <Bell className="h-4 w-4" />
                                {stats.notifications.length > 0 && (
                                    <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-600" />
                                )}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[300px]">
                            <div className="flex items-center justify-between px-2 py-1.5">
                                <DropdownMenuLabel className="p-0">Project Updates</DropdownMenuLabel>
                                {stats.notifications.length > 0 && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-auto p-1 text-xs text-muted-foreground hover:text-destructive"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            clearNotifications();
                                        }}
                                    >
                                        Clear All
                                    </Button>
                                )}
                            </div>
                            <DropdownMenuSeparator />
                            <div className="max-h-[300px] overflow-auto">
                                {stats.notifications.length === 0 ? (
                                    <div className="p-4 text-center text-sm text-muted-foreground">
                                        No recent updates
                                    </div>
                                ) : (
                                    stats.notifications.map((project) => (
                                        <DropdownMenuItem key={project._id || project.id} className="flex flex-col items-start gap-1 p-3 cursor-pointer">
                                            <div className="flex w-full justify-between items-center">
                                                <span className={`font-medium ${project.status === "Completed" ? "text-green-600" : ""}`}>
                                                    {project.name}
                                                </span>
                                                <span className="text-xs text-muted-foreground">{new Date(project.eventDate || project.endDate).toLocaleDateString()}</span>
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {project.status === "Completed" ? (
                                                    <span className="text-green-600 font-semibold">Project Completed</span>
                                                ) : (
                                                    <span>Moved to <span className="font-semibold text-primary">{project.status}</span></span>
                                                )}
                                            </div>
                                        </DropdownMenuItem>
                                    ))
                                )}
                            </div>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Top Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card
                    className="cursor-pointer hover:bg-accent/5 transition-colors"
                    onClick={() => setSelectedMetric('budget')}
                >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Budget Spend</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${stats.totalBudget.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Across {stats.totalProjects} active projects</p>
                    </CardContent>
                </Card>
                <Card
                    className="cursor-pointer hover:bg-accent/5 transition-colors"
                    onClick={() => setSelectedMetric('delay')}
                >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Schedule Delay</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {stats.delayDays > 0 ? `+${stats.delayDays} Days` : "On Track"}
                        </div>
                        <p className="text-xs text-muted-foreground">Cumulative impact</p>
                    </CardContent>
                </Card>
                <Card
                    className="cursor-pointer hover:bg-accent/5 transition-colors"
                    onClick={() => setSelectedMetric('resources')}
                >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Resources</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalResources}</div>
                        <p className="text-xs text-muted-foreground">Total assigned staff</p>
                    </CardContent>
                </Card>
                <Card
                    className="cursor-pointer hover:bg-accent/5 transition-colors"
                    onClick={() => setSelectedMetric('risk')}
                >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">High Risk Items</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.highRiskCount}</div>
                        <p className="text-xs text-muted-foreground">Requires immediate attention</p>
                    </CardContent>
                </Card>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-7 gap-6">
                <CostOverviewChart data={stats.forecastData} loading={loadingForecast} />
                <RiskHeatmap data={stats.riskData} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-7 gap-6">
                <ProjectGantt
                    tasks={getFilteredGanttTasks()}
                    headerAction={
                        <Select value={ganttFilter} onValueChange={setGanttFilter}>
                            <SelectTrigger className="w-[200px] h-8">
                                <SelectValue placeholder="Filter Timeline" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Projects</SelectItem>
                                {stats.allProjects.map(p => (
                                    <SelectItem key={p._id || p.id} value={p._id || p.id}>
                                        {p.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    }
                />
            </div>

            <Dialog open={!!selectedMetric} onOpenChange={(open) => !open && setSelectedMetric(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{getDialogTitle()}</DialogTitle>
                        <DialogDescription>
                            Breaking down metrics by project.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="max-h-[300px] overflow-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Project Name</TableHead>
                                    <TableHead className="text-right">Value</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {getFilteredProjects().length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={2} className="text-center text-muted-foreground">
                                            No data available for this metric.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    getFilteredProjects().map((p, i) => (
                                        <TableRow key={i}>
                                            <TableCell className="font-medium">{p.name}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="font-bold">{p.value}</div>
                                                <div className="text-xs text-muted-foreground">{p.sub}</div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
