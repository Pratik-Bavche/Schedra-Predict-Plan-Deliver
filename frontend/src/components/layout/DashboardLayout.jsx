import { Sidebar } from "./Sidebar"
import { Outlet } from "react-router-dom"
import { AIChatbot } from "@/components/chat/AIChatbot"

export default function DashboardLayout() {
    return (
        <div className="flex flex-col md:flex-row h-[100dvh] overflow-hidden bg-background">
            <Sidebar />
            <main className="flex-1 overflow-y-auto p-4 md:p-8">
                <div className="mx-auto max-w-7xl">
                    <Outlet />
                </div>
                <AIChatbot />
            </main>
        </div>
    )
}
