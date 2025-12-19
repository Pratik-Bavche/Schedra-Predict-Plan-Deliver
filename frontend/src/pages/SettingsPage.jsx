import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Users, Settings, Briefcase, Bell, Link, Monitor, Shield, FilePlus } from "lucide-react"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "sonner"

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState("user-management")
    const [isAddUserOpen, setIsAddUserOpen] = useState(false)
    const [users, setUsers] = useState([
        { id: 1, name: "Admin User", email: "admin@schedra.com", role: "admin" },
        { id: 2, name: "Project Manager", email: "pm@schedra.com", role: "manager" },
    ])
    const [newUser, setNewUser] = useState({ name: "", email: "", role: "viewer" })

    const handleAddUser = () => {
        if (!newUser.name || !newUser.email) {
            toast.error("Please fill in all fields")
            return
        }
        setUsers([...users, { id: Date.now(), ...newUser }])
        setNewUser({ name: "", email: "", role: "viewer" })
        setIsAddUserOpen(false)
        toast.success("User added successfully")
    }

    const menuItems = [
        { id: "user-management", label: "User Management", icon: Users },
        { id: "project-defaults", label: "Project Defaults", icon: Briefcase },
        { id: "forecast-settings", label: "Forecast Settings", icon: Settings },
        { id: "alerts", label: "Alerts & Notifications", icon: Bell },
        { id: "integrations", label: "Integration Settings", icon: Link },
        { id: "system", label: "System Preferences", icon: Monitor },
        { id: "security", label: "Security Settings", icon: Shield },
        { id: "custom-fields", label: "Custom Field Builder", icon: FilePlus },
    ]

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
                    <p className="text-muted-foreground">Manage your organization and system preferences.</p>
                </div>
            </div>

            <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
                <aside className="-mx-4 lg:w-1/5">
                    <nav className="flex flex-col space-y-1">
                        {menuItems.map((item) => (
                            <Button
                                key={item.id}
                                variant={activeTab === item.id ? "secondary" : "ghost"}
                                className="justify-start"
                                onClick={() => setActiveTab(item.id)}
                            >
                                <item.icon className="mr-2 h-4 w-4" />
                                {item.label}
                            </Button>
                        ))}
                    </nav>
                </aside>
                <div className="flex-1 lg:max-w-3xl">
                    {/* User Management */}
                    {activeTab === "user-management" && (
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle>User Management</CardTitle>
                                            <CardDescription>Manage access and roles for your team members.</CardDescription>
                                        </div>
                                        <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
                                            <DialogTrigger asChild>
                                                <Button>Add New User</Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>Add New User</DialogTitle>
                                                    <DialogDescription>
                                                        Create a new user account. They will receive an email to set their password.
                                                    </DialogDescription>
                                                </DialogHeader>
                                                <div className="grid gap-4 py-4">
                                                    <div className="grid gap-2">
                                                        <Label htmlFor="name">Name</Label>
                                                        <Input
                                                            id="name"
                                                            value={newUser.name}
                                                            onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                                                            placeholder="John Doe"
                                                        />
                                                    </div>
                                                    <div className="grid gap-2">
                                                        <Label htmlFor="email">Email</Label>
                                                        <Input
                                                            id="email"
                                                            value={newUser.email}
                                                            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                                            placeholder="john@example.com"
                                                        />
                                                    </div>
                                                    <div className="grid gap-2">
                                                        <Label htmlFor="role">Role</Label>
                                                        <Select
                                                            value={newUser.role}
                                                            onValueChange={(value) => setNewUser({ ...newUser, role: value })}
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="admin">Admin</SelectItem>
                                                                <SelectItem value="manager">Manager</SelectItem>
                                                                <SelectItem value="analyst">Analyst</SelectItem>
                                                                <SelectItem value="viewer">Viewer</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>
                                                <DialogFooter>
                                                    <Button onClick={handleAddUser}>Create User</Button>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 gap-4">
                                        {users.map((user) => (
                                            <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                                                <div>
                                                    <p className="font-medium">{user.name}</p>
                                                    <p className="text-sm text-muted-foreground">{user.email}</p>
                                                </div>
                                                <Select defaultValue={user.role}>
                                                    <SelectTrigger className="w-[120px]">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="admin">Admin</SelectItem>
                                                        <SelectItem value="manager">Manager</SelectItem>
                                                        <SelectItem value="analyst">Analyst</SelectItem>
                                                        <SelectItem value="viewer">Viewer</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Project Defaults */}
                    {activeTab === "project-defaults" && (
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Project Defaults</CardTitle>
                                    <CardDescription>Set default values for new projects.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid gap-2">
                                        <Label>Default Category</Label>
                                        <Select defaultValue="it">
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="it">IT Project</SelectItem>
                                                <SelectItem value="construction">Construction</SelectItem>
                                                <SelectItem value="infra">Infrastructure</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Currency</Label>
                                        <Select defaultValue="usd">
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="usd">USD ($)</SelectItem>
                                                <SelectItem value="inr">INR (₹)</SelectItem>
                                                <SelectItem value="eur">EUR (€)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Default Contingency Buffer (%)</Label>
                                        <Input type="number" defaultValue="10" />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Forecast Settings */}
                    {activeTab === "forecast-settings" && (
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>AI Forecast Behavior</CardTitle>
                                    <CardDescription>Configure how the AI generates predictions.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid gap-2">
                                        <Label>AI Model Mode</Label>
                                        <Select defaultValue="balanced">
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="conservative">Conservative (Higher Risk Buffers)</SelectItem>
                                                <SelectItem value="balanced">Balanced</SelectItem>
                                                <SelectItem value="aggressive">Aggressive (Optimistic)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex items-center justify-between space-x-2">
                                        <Label className="flex flex-col space-y-1">
                                            <span>Hotspot Detection</span>
                                            <span className="font-normal text-xs text-muted-foreground">Auto-detect potential risk areas.</span>
                                        </Label>
                                        <Switch defaultChecked />
                                    </div>
                                    <div className="flex items-center justify-between space-x-2">
                                        <Label className="flex flex-col space-y-1">
                                            <span>Explainability</span>
                                            <span className="font-normal text-xs text-muted-foreground">Show factors influencing predictions (SHAP values).</span>
                                        </Label>
                                        <Switch defaultChecked />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Alerts */}
                    {activeTab === "alerts" && (
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Alert Thresholds</CardTitle>
                                    <CardDescription>When should we notify you?</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid gap-2">
                                        <Label>Cost Overrun Warning (%)</Label>
                                        <Input type="number" defaultValue="10" />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Time Delay Warning (%)</Label>
                                        <Input type="number" defaultValue="5" />
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Notification Channels</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-between space-x-2">
                                        <Label>Email Notifications</Label>
                                        <Switch defaultChecked />
                                    </div>
                                    <div className="flex items-center justify-between space-x-2">
                                        <Label>In-App Alerts</Label>
                                        <Switch defaultChecked />
                                    </div>
                                    <div className="flex items-center justify-between space-x-2">
                                        <Label>SMS Alerts</Label>
                                        <Switch />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Integrations */}
                    {activeTab === "integrations" && (
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>External Tools</CardTitle>
                                    <CardDescription>Connect Schedra with your existing stack.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-between p-4 border rounded-lg">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 bg-black rounded-md flex items-center justify-center text-white font-bold">G</div>
                                            <div>
                                                <p className="font-medium">GitHub</p>
                                                <p className="text-sm text-muted-foreground">Sync issues and PRs</p>
                                            </div>
                                        </div>
                                        <Button variant="outline">Connect</Button>
                                    </div>
                                    <div className="flex items-center justify-between p-4 border rounded-lg">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 bg-blue-600 rounded-md flex items-center justify-center text-white font-bold">J</div>
                                            <div>
                                                <p className="font-medium">Jira</p>
                                                <p className="text-sm text-muted-foreground">Import tasks and sprints</p>
                                            </div>
                                        </div>
                                        <Button variant="outline">Connect</Button>
                                    </div>
                                    <div className="flex items-center justify-between p-4 border rounded-lg">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 bg-orange-600 rounded-md flex items-center justify-center text-white font-bold">O</div>
                                            <div>
                                                <p className="font-medium">Oracle ERP</p>
                                                <p className="text-sm text-muted-foreground">Sync financial data</p>
                                            </div>
                                        </div>
                                        <Button variant="outline">Connect</Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* System Prefs */}
                    {activeTab === "system" && (
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>System Preferences</CardTitle>
                                    <CardDescription>Global application settings.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid gap-2">
                                        <Label>Language</Label>
                                        <Select defaultValue="en">
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="en">English</SelectItem>
                                                <SelectItem value="hi">Hindi</SelectItem>
                                                <SelectItem value="es">Spanish</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Timezone</Label>
                                        <Select defaultValue="utc">
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="utc">UTC</SelectItem>
                                                <SelectItem value="est">EST</SelectItem>
                                                <SelectItem value="ist">IST</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid gap-2">
                                        <Label>Date Format</Label>
                                        <Select defaultValue="ddmmyyyy">
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="ddmmyyyy">DD/MM/YYYY</SelectItem>
                                                <SelectItem value="mmddyyyy">MM/DD/YYYY</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Security */}
                    {activeTab === "security" && (
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Security</CardTitle>
                                    <CardDescription>Protect your account and data.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-between space-x-2">
                                        <Label className="flex flex-col space-y-1">
                                            <span>Two-Factor Authentication</span>
                                            <span className="font-normal text-xs text-muted-foreground">Add an extra layer of security.</span>
                                        </Label>
                                        <Switch />
                                    </div>
                                    <Separator />
                                    <Button variant="outline" className="w-full">Change Password</Button>
                                    <Button variant="outline" className="w-full">Manage API Keys</Button>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Custom Fields */}
                    {activeTab === "custom-fields" && (
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Custom Field Builder</CardTitle>
                                    <CardDescription>Define custom data fields for your projects.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="p-8 text-center border-2 border-dashed rounded-lg">
                                        <FilePlus className="mx-auto h-8 w-8 text-muted-foreground mb-4" />
                                        <h3 className="text-lg font-medium">No Custom Fields</h3>
                                        <p className="text-sm text-muted-foreground mb-4">Create fields to track specific metrics.</p>
                                        <Button>Create New Field</Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
