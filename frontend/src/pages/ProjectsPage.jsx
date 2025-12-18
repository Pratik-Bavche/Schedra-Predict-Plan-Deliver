import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MoreHorizontal, Plus, Archive, RotateCcw } from "lucide-react"
import { toast } from "sonner"
import { api } from "@/lib/api"
import { useNavigate } from "react-router-dom"

import { calculateCurrentPhase } from "@/lib/insightGenerator"

export default function ProjectsPage() {
    const navigate = useNavigate()
    const [projects, setProjects] = useState([])
    const [formData, setFormData] = useState({
        // Common
        name: "",
        projectId: "",
        type: "IT",
        description: "",
        startDate: "",
        endDate: "",
        budget: "",
        manager: "",
        client: "",
        riskLevel: "Low",

        // IT
        techStack: "", teamSize: "", modules: "", repoLink: "",
        methodology: "Agile", expectedLoad: "", integrationReq: "",

        // Infrastructure
        subType: "", region: "", capacity: "", terrain: "Plain",
        contractor: "", landStatus: "Pending", envStatus: "Not Started",
        equipment: "", permits: "",

        // Startup
        startupStage: "Idea", industrySector: "", founders: "",
        targetMarket: "", gtmPlan: "", revenueModel: "", funding: "",

        // Docs
        scheduleUrl: "", boqUrl: ""
    })
    const [open, setOpen] = useState(false)
    const [editMode, setEditMode] = useState(false)
    const [currentId, setCurrentId] = useState(null)


    const fetchProjects = async () => {
        try {
            const data = await api.get("/projects")
            const mapped = data.map(p => ({
                ...p,
                id: p.projectId,
                risk: p.riskLevel,
                _id: p._id,
                dueDate: p.dueDate,
                status: calculateCurrentPhase(p)
            }))
            setProjects(mapped)
        } catch {
            toast.error("Failed to fetch projects")
        }
    }

    useEffect(() => {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        fetchProjects()
    }, [])

    const handleOpenCreate = () => {
        setEditMode(false)
        setFormData({
            name: "", projectId: "", type: "IT", description: "",
            startDate: "", endDate: "", budget: "", manager: "", client: "", riskLevel: "Low",
            techStack: "", teamSize: "", modules: "", repoLink: "", methodology: "Agile", expectedLoad: "", integrationReq: "",
            subType: "", region: "", capacity: "", terrain: "Plain", contractor: "", landStatus: "Pending", envStatus: "Not Started", equipment: "", permits: "",
            startupStage: "Idea", industrySector: "", founders: "", targetMarket: "", gtmPlan: "", revenueModel: "", funding: "",
            scheduleUrl: "", boqUrl: ""
        })
        setOpen(true)
    }

    const handleOpenEdit = (project) => {
        setEditMode(true)
        setCurrentId(project._id)
        setFormData({
            ...project,
            startDate: project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : "",
            endDate: project.dueDate ? new Date(project.dueDate).toISOString().split('T')[0] : "",
            type: project.type || "IT", // Default to IT if undefined
        })
        setOpen(true)
    }

    const handleSubmit = async () => {
        // Validation
        if (!formData.name || !formData.type || !formData.budget || !formData.startDate || !formData.endDate) {
            toast.error("Please fill in all required fields (Name, Type, Budget, Dates)")
            return
        }

        try {
            const payload = {
                ...formData,
                dueDate: formData.endDate
            }
            if (editMode) {
                await api.put(`/projects/${currentId}`, payload)
                toast.success("Project updated successfully")
            } else {
                await api.post("/projects", {
                    ...payload,
                    status: "Planning",
                    progress: 0
                })
                toast.success("Project created successfully")
            }
            setOpen(false)
            fetchProjects()
        } catch (error) {
            toast.error(error.message || `Failed to ${editMode ? "update" : "create"} project`)
        }
    }

    const handleDelete = async (project) => {
        console.log("Attempting to delete project:", project);
        try {
            if (!project._id) {
                console.error("No project ID found");
                toast.error("Invalid project ID");
                return;
            }
            const res = await api.delete(`/projects/${project._id}`)
            console.log("Delete response:", res);
            toast.success("Project deleted successfully")
            fetchProjects()
        } catch (error) {
            console.error("Delete failed:", error);
            toast.error("Failed to delete project: " + error.message)
        }
    }



    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Projects</h2>
                    <p className="text-muted-foreground">Manage and monitor all active projects across various domains.</p>
                </div>
                <div className="flex items-center gap-2">



                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={handleOpenCreate}>
                                <Plus className="mr-2 h-4 w-4" /> New Project
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>{editMode ? "Edit Project Details" : "Create New Project"}</DialogTitle>
                                <DialogDescription>
                                    Select the project type and fill in the specific details.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-6 py-4">

                                {/* Common Header Fields */}
                                <div className="grid grid-cols-2 gap-4 border-b pb-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="name">Project Name</Label>
                                        <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Project Title" />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="type">Project Type</Label>
                                        <Select value={formData.type} onValueChange={(val) => setFormData({ ...formData, type: val })}>
                                            <SelectTrigger><SelectValue placeholder="Select Type" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="IT">IT / Software</SelectItem>
                                                <SelectItem value="Infrastructure">Infrastructure / Engineering</SelectItem>
                                                <SelectItem value="Startup">Startup / Business</SelectItem>
                                                <SelectItem value="Other">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2 col-span-2">
                                        <Label htmlFor="desc">Description</Label>
                                        <Input id="desc" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Brief overview of goals and scope" />
                                    </div>
                                    {editMode && (
                                        <div className="grid gap-2">
                                            <Label htmlFor="id">Project ID</Label>
                                            <Input id="id" value={formData.projectId} disabled placeholder="Unique Identifier" />
                                        </div>
                                    )}
                                    <div className="grid gap-2">
                                        <Label htmlFor="budget">Estimated Budget</Label>
                                        <Input id="budget" type="number" value={formData.budget} onChange={(e) => setFormData({ ...formData, budget: Number(e.target.value) })} placeholder="Total Cost" />
                                    </div>
                                </div>

                                {/* Common Details */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="start">Start Date</Label>
                                        <Input id="start" type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="end">End Date</Label>
                                        <Input id="end" type="date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="manager">Project Manager / Lead</Label>
                                        <Input id="manager" value={formData.manager} onChange={(e) => setFormData({ ...formData, manager: e.target.value })} placeholder="Person Responsible" />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="client">Client / Sponsor</Label>
                                        <Input id="client" value={formData.client} onChange={(e) => setFormData({ ...formData, client: e.target.value })} placeholder="For whom?" />
                                    </div>
                                </div>

                                {/* Dynamic Fields Section */}
                                <div className="border-t pt-4">
                                    <h3 className="text-lg font-semibold mb-4 text-primary">
                                        {formData.type === "IT" && "💻 IT / Software Specifics"}
                                        {formData.type === "Infrastructure" && "🏗 Infrastructure Specifics"}
                                        {formData.type === "Startup" && "🚀 Startup Specifics"}
                                        {formData.type === "Other" && "Additional Details"}
                                    </h3>

                                    {formData.type === "IT" && (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="grid gap-2 col-span-2">
                                                <Label>Technology Stack</Label>
                                                <Input value={formData.techStack} onChange={(e) => setFormData({ ...formData, techStack: e.target.value })} placeholder="e.g. React, Node.js, AWS" />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label>Team Size</Label>
                                                <Input type="number" value={formData.teamSize} onChange={(e) => setFormData({ ...formData, teamSize: e.target.value })} placeholder="Count" />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label>Methodology</Label>
                                                <div className="space-y-2">
                                                    <Select
                                                        value={["Agile", "Scrum", "Waterfall", "Kanban"].includes(formData.methodology) ? formData.methodology : "Other"}
                                                        onValueChange={(val) => {
                                                            if (val === "Other") {
                                                                setFormData({ ...formData, methodology: "" })
                                                            } else {
                                                                setFormData({ ...formData, methodology: val })
                                                            }
                                                        }}
                                                    >
                                                        <SelectTrigger><SelectValue /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="Agile">Agile</SelectItem>
                                                            <SelectItem value="Scrum">Scrum</SelectItem>
                                                            <SelectItem value="Waterfall">Waterfall</SelectItem>
                                                            <SelectItem value="Kanban">Kanban</SelectItem>
                                                            <SelectItem value="Other">Other</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    {(!["Agile", "Scrum", "Waterfall", "Kanban"].includes(formData.methodology)) && (
                                                        <Input
                                                            value={formData.methodology}
                                                            onChange={(e) => setFormData({ ...formData, methodology: e.target.value })}
                                                            placeholder="Enter custom methodology"
                                                        />
                                                    )}
                                                </div>
                                            </div>
                                            <div className="grid gap-2">
                                                <Label>Repo Link</Label>
                                                <Input value={formData.repoLink} onChange={(e) => setFormData({ ...formData, repoLink: e.target.value })} placeholder="GitHub/GitLab URL" />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label>Expected Users / Load</Label>
                                                <Input value={formData.expectedLoad} onChange={(e) => setFormData({ ...formData, expectedLoad: e.target.value })} placeholder="e.g. 10k users" />
                                            </div>
                                            <div className="grid gap-2 col-span-2">
                                                <Label>Modules / Features</Label>
                                                <Input value={formData.modules} onChange={(e) => setFormData({ ...formData, modules: e.target.value })} placeholder="Key deliverables" />
                                            </div>
                                            <div className="grid gap-2 col-span-2">
                                                <Label>Integration Requirements</Label>
                                                <Input value={formData.integrationReq} onChange={(e) => setFormData({ ...formData, integrationReq: e.target.value })} placeholder="APIs, 3rd party" />
                                            </div>
                                        </div>
                                    )}

                                    {formData.type === "Infrastructure" && (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="grid gap-2">
                                                <Label>Project Sub-Type</Label>
                                                <Input value={formData.subType} onChange={(e) => setFormData({ ...formData, subType: e.target.value })} placeholder="e.g. Substation, Highway" />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label>Region</Label>
                                                <Input value={formData.region} onChange={(e) => setFormData({ ...formData, region: e.target.value })} placeholder="Location" />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label>Terrain</Label>
                                                <Select value={formData.terrain} onValueChange={(val) => setFormData({ ...formData, terrain: val })}>
                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Plain">Plain</SelectItem>
                                                        <SelectItem value="Hilly">Hilly</SelectItem>
                                                        <SelectItem value="Forest">Forest</SelectItem>
                                                        <SelectItem value="Coastal">Coastal</SelectItem>
                                                        <SelectItem value="Urban">Urban</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="grid gap-2">
                                                <Label>Capacity / Length</Label>
                                                <Input value={formData.capacity} onChange={(e) => setFormData({ ...formData, capacity: e.target.value })} placeholder="e.g. 50km" />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label>Contractor</Label>
                                                <Input value={formData.contractor} onChange={(e) => setFormData({ ...formData, contractor: e.target.value })} placeholder="Main Vendor" />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label>Equipment</Label>
                                                <Input value={formData.equipment} onChange={(e) => setFormData({ ...formData, equipment: e.target.value })} placeholder="Key items" />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label>Land Status</Label>
                                                <Select value={formData.landStatus} onValueChange={(val) => setFormData({ ...formData, landStatus: val })}>
                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Completed">Completed</SelectItem>
                                                        <SelectItem value="Partial">Partial</SelectItem>
                                                        <SelectItem value="Pending">Pending</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="grid gap-2">
                                                <Label>Environmental Status</Label>
                                                <Select value={formData.envStatus} onValueChange={(val) => setFormData({ ...formData, envStatus: val })}>
                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Approved">Approved</SelectItem>
                                                        <SelectItem value="In Process">In Process</SelectItem>
                                                        <SelectItem value="Not Started">Not Started</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="grid gap-2 col-span-2">
                                                <Label>Permit Dates</Label>
                                                <Input value={formData.permits} onChange={(e) => setFormData({ ...formData, permits: e.target.value })} placeholder="Permit deadlines" />
                                            </div>
                                        </div>
                                    )}

                                    {formData.type === "Startup" && (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="grid gap-2">
                                                <Label>Stage</Label>
                                                <Select value={formData.startupStage} onValueChange={(val) => setFormData({ ...formData, startupStage: val })}>
                                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Idea">Idea</SelectItem>
                                                        <SelectItem value="Prototype">Prototype</SelectItem>
                                                        <SelectItem value="MVP">MVP</SelectItem>
                                                        <SelectItem value="Revenue">Revenue</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="grid gap-2">
                                                <Label>Industry</Label>
                                                <Input value={formData.industrySector} onChange={(e) => setFormData({ ...formData, industrySector: e.target.value })} placeholder="e.g. Fintech" />
                                            </div>
                                            <div className="grid gap-2 col-span-2">
                                                <Label>Founders / Team</Label>
                                                <Input value={formData.founders} onChange={(e) => setFormData({ ...formData, founders: e.target.value })} placeholder="Core team names" />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label>Target Market</Label>
                                                <Input value={formData.targetMarket} onChange={(e) => setFormData({ ...formData, targetMarket: e.target.value })} placeholder="Audience" />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label>Funding</Label>
                                                <Input value={formData.funding} onChange={(e) => setFormData({ ...formData, funding: e.target.value })} placeholder="Current investors" />
                                            </div>
                                            <div className="grid gap-2 col-span-2">
                                                <Label>GTM Plan</Label>
                                                <Input value={formData.gtmPlan} onChange={(e) => setFormData({ ...formData, gtmPlan: e.target.value })} placeholder="Launch strategy" />
                                            </div>
                                            <div className="grid gap-2 col-span-2">
                                                <Label>Revenue Model</Label>
                                                <Input value={formData.revenueModel} onChange={(e) => setFormData({ ...formData, revenueModel: e.target.value })} placeholder="Monetization" />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Docs */}
                                <div className="grid grid-cols-2 gap-4 border-t pt-4">
                                    <div className="grid gap-2">
                                        <Label>Schedule File/URL</Label>
                                        <Input value={formData.scheduleUrl} onChange={(e) => setFormData({ ...formData, scheduleUrl: e.target.value })} placeholder="Link to Gantt/Excel" />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>BOQ / Cost Sheet</Label>
                                        <Input value={formData.boqUrl} onChange={(e) => setFormData({ ...formData, boqUrl: e.target.value })} placeholder="Link to Documents" />
                                    </div>
                                </div>

                            </div>
                            <DialogFooter>
                                <Button onClick={handleSubmit}>{editMode ? "Update Project" : "Create Project"}</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Active Projects</CardTitle>
                    <CardDescription>
                        Overview of all ongoing projects.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[100px]">ID</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Manager</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Risk</TableHead>
                                <TableHead className="text-right">Budget</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {projects.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center h-24 text-muted-foreground">
                                        No projects found. Create one to get started.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                projects.map((project) => (
                                    <TableRow key={project.id}>
                                        <TableCell className="font-medium">{project.id}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{project.name}</span>
                                                <span className="text-xs text-muted-foreground">{new Date(project.dueDate).toLocaleDateString()}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell><Badge variant="outline">{project.type}</Badge></TableCell>
                                        <TableCell>{project.manager || "-"}</TableCell>
                                        <TableCell>
                                            <Badge variant={project.status === "Completed" ? "default" : project.status === "Delayed" ? "destructive" : "secondary"}>
                                                {project.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <span className={cn(
                                                "font-medium",
                                                project.risk === "Critical" ? "text-destructive" : project.risk === "High" ? "text-orange-600" : "text-green-600"
                                            )}>
                                                {project.risk}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">${project.budget?.toLocaleString()}</TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <span className="sr-only">Open menu</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={() => navigate(`/projects/${project._id}`)}>
                                                        View Details
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleOpenEdit(project)}>
                                                        Edit Details
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="text-destructive focus:text-destructive"
                                                        onClick={() => handleDelete(project)}
                                                    >
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div >
    )
}
