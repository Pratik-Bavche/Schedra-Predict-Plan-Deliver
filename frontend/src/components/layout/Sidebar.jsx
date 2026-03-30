import { Home, LineChart, PieChart, Settings, Menu, Package2, Sun, Moon } from "lucide-react"
import { ModeToggle } from "@/components/ModeToggle"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { Link, useLocation } from "react-router-dom"

const sidebarNavItems = [
    {
        title: "Dashboard",
        href: "/dashboard",
        icon: Home,
    },
    {
        title: "Projects",
        href: "/projects",
        icon: Package2,
    },
    {
        title: "Analytics",
        href: "/analytics",
        icon: LineChart,
    },
    {
        title: "Forecasts",
        href: "/forecasts",
        icon: PieChart,
    },
    {
        title: "Settings",
        href: "/settings",
        icon: Settings,
    },
]

import { useState } from "react"

export function Sidebar({ className }) {
    const location = useLocation()
    const [open, setOpen] = useState(false)

    return (
        <TooltipProvider>
            <div className={cn("pb-12 h-screen border-r bg-background hidden md:block w-64", className)}>
                <div className="space-y-4 py-4">
                    <div className="px-3 py-2">
                        <div className="mb-2 px-4 flex items-center gap-2">
                            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                                <LineChart className="h-5 w-5 text-primary-foreground" />
                            </div>
                            <h2 className="text-xl font-bold tracking-tight">Schedra</h2>
                        </div>
                        <div className="space-y-1 mt-6">
                            {sidebarNavItems.map((item) => (
                                <Button
                                    key={item.href}
                                    asChild
                                    variant={location.pathname === item.href ? "secondary" : "ghost"}
                                    className="w-full justify-start"
                                >
                                    <Link to={item.href}>
                                        <item.icon className="mr-2 h-4 w-4" />
                                        {item.title}
                                    </Link>
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="mt-auto px-4 py-4 border-t">
                    <ModeToggle showLabel={true} />
                </div>
            </div>

            {/* Mobile Sidebar */}
            <div className="md:hidden p-4 border-b flex items-center gap-4">
                <Sheet open={open} onOpenChange={setOpen}>
                    <SheetTrigger asChild>
                        <Button variant="outline" size="icon">
                            <Menu className="h-4 w-4" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-64 p-0">
                        <div className="px-3 py-6">
                            <div className="mb-6 px-4 flex items-center gap-2">
                                <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                                    <LineChart className="h-5 w-5 text-primary-foreground" />
                                </div>
                                <h2 className="text-xl font-bold tracking-tight">Schedra</h2>
                            </div>
                            <div className="flex flex-col space-y-1">
                                {sidebarNavItems.map((item) => (
                                    <Link
                                        key={item.href}
                                        to={item.href}
                                        onClick={() => setOpen(false)}
                                    >
                                        <Button
                                            variant={location.pathname === item.href ? "secondary" : "ghost"}
                                            className="w-full justify-start"
                                        >
                                            <item.icon className="mr-2 h-4 w-4" />
                                            {item.title}
                                        </Button>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </SheetContent>
                </Sheet>
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                        <LineChart className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <span className="font-bold text-lg">Schedra</span>
                </div>
                <div className="ml-auto">
                    <ModeToggle />
                </div>
            </div>
        </TooltipProvider>
    )
}
