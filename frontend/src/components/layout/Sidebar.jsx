import { Home, LineChart, PieChart, Settings, Menu, Package2, Sun, Moon, Zap, User } from "lucide-react"
import { ModeToggle } from "@/components/ModeToggle"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { Link, useLocation } from "react-router-dom"
import { useState } from "react"
import { motion } from "framer-motion"
import { useAuth } from "@/context/AuthContext"

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

export function Sidebar({ className }) {
    const location = useLocation()
    const { user } = useAuth()
    const [open, setOpen] = useState(false)

    const displayName = user?.name || "Guest User"
    const userRole = user?.isGuest ? "Temporary Access" : (user?.role || "Team Member")
    const initials = displayName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)

    return (
        <TooltipProvider>
            <div className={cn("h-screen border-r bg-card/50 backdrop-blur-xl hidden md:flex flex-col w-64", className)}>
                <div className="space-y-4 py-8 flex flex-col flex-1 overflow-hidden">
                    <div className="px-6 py-2">
                        <Link to="/dashboard" className="flex items-center gap-3 mb-10 group">
                            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
                                <Zap className="h-6 w-6 text-primary-foreground" />
                            </div>
                            <h2 className="text-2xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/70">
                                Schedra
                            </h2>
                        </Link>
                        
                        <div className="space-y-2">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4 px-2">Main Navigation</p>
                            {sidebarNavItems.map((item) => {
                                const isActive = location.pathname === item.href
                                return (
                                    <Button
                                        key={item.href}
                                        asChild
                                        variant="ghost"
                                        className={cn(
                                            "w-full justify-start h-11 px-4 rounded-xl transition-all duration-200 relative group",
                                            isActive ? "bg-primary/10 text-primary hover:bg-primary/15" : "hover:bg-muted"
                                        )}
                                    >
                                        <Link to={item.href} className="flex items-center">
                                            <item.icon className={cn(
                                                "mr-3 h-5 w-5 transition-colors",
                                                isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                                            )} />
                                            <span className="font-semibold tracking-tight">{item.title}</span>
                                            {isActive && (
                                                <motion.div 
                                                    layoutId="active-indicator"
                                                    className="absolute left-0 w-1 h-6 bg-primary rounded-r-full"
                                                />
                                            )}
                                        </Link>
                                    </Button>
                                )
                            })}
                        </div>
                    </div>
                </div>

                <div className="mt-auto px-6 py-4 border-t border-border/40 space-y-3 bg-muted/20">
                    <div className="flex items-center gap-3 px-1">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 text-primary font-bold shadow-sm shrink-0">
                             {initials}
                        </div>
                        <div className="flex flex-col min-w-0">
                            <span className="text-sm font-bold leading-none truncate">{displayName}</span>
                            <span className="text-[10px] text-muted-foreground font-medium truncate mt-1 uppercase tracking-wider">{userRole}</span>
                        </div>
                    </div>
                    <ModeToggle showLabel={true} className="mt-2" />
                </div>
            </div>

            {/* Mobile Sidebar */}
            <div className="md:hidden p-4 border-b flex items-center bg-card/80 backdrop-blur-md sticky top-0 z-50">
                <Sheet open={open} onOpenChange={setOpen}>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="mr-2">
                            <Menu className="h-6 w-6" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-72 p-0 bg-background border-r">
                        <div className="px-6 py-8 flex flex-col h-full">
                            <div className="flex items-center gap-3 mb-10">
                                <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                                    <Zap className="h-6 w-6 text-primary-foreground" />
                                </div>
                                <h2 className="text-2xl font-black tracking-tighter">Schedra</h2>
                            </div>
                            
                            <div className="flex flex-col space-y-2 flex-1">
                                {sidebarNavItems.map((item) => {
                                    const isActive = location.pathname === item.href
                                    return (
                                        <Link
                                            key={item.href}
                                            to={item.href}
                                            onClick={() => setOpen(false)}
                                        >
                                            <Button
                                                variant="ghost"
                                                className={cn(
                                                    "w-full justify-start h-12 px-4 rounded-xl",
                                                    isActive ? "bg-primary/10 text-primary" : "hover:bg-muted"
                                                )}
                                            >
                                                <item.icon className={cn("mr-3 h-5 w-5", isActive ? "text-primary" : "text-muted-foreground")} />
                                                <span className="font-semibold">{item.title}</span>
                                            </Button>
                                        </Link>
                                    )
                                })}
                            </div>

                            <div className="mt-auto pt-6 border-t space-y-4">
                                <div className="flex items-center gap-3 px-1">
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 text-primary font-bold">
                                        {initials}
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold leading-none">{displayName}</span>
                                        <span className="text-xs text-muted-foreground mt-1 uppercase tracking-wider">{userRole}</span>
                                    </div>
                                </div>
                                <ModeToggle showLabel={true} />
                            </div>
                        </div>
                    </SheetContent>
                </Sheet>
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                        <Zap className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <span className="font-black text-xl tracking-tighter">Schedra</span>
                </div>
                <div className="ml-auto">
                    <ModeToggle />
                </div>
            </div>
        </TooltipProvider>
    )
}
