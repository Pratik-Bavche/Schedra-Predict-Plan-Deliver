import { Gantt, ViewMode } from "gantt-task-react";
import "gantt-task-react/dist/index.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";

export function ProjectGantt({ tasks = [], headerAction }) {
    const [view] = useState(ViewMode.Month);

    if (tasks.length === 0) {
        return (
            <Card className="col-span-1 md:col-span-7">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle>Construction Timeline</CardTitle>
                    {headerAction}
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center h-40 text-muted-foreground">
                        No active project timelines to display.
                    </div>
                </CardContent>
            </Card>
        )
    }

    const projectStart = tasks.length > 0 ? tasks[0].start : new Date();
    const projectEnd = tasks.length > 0 ? tasks[tasks.length - 1].end : new Date();
    
    // Set viewDate to precisely the start of the first task
    const viewDate = projectStart;

    // Calculate months range including Year for custom headers if needed
    // But for now, ensuring columnWidth and locale are optimal
    return (
        <Card className="col-span-1 md:col-span-7 overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle>Construction Timeline</CardTitle>
                {headerAction}
            </CardHeader>
            <CardContent className="overflow-x-auto p-0 border-t">
                <div className="min-w-[800px] gantt-container">
                    <style>
                        {`
                        .gantt-container ._3v_9W { display: none !important; } /* Hide the separate Year row if present */
                        .gantt-container ._3_76E { font-weight: bold !important; color: black !important; }
                        `}
                    </style>
                    <Gantt
                        tasks={tasks}
                        viewMode={view}
                        viewDate={viewDate}
                        projectStartDate={projectStart}
                        projectEndDate={projectEnd}
                        locale="en-GB" 
                        listCellWidth="155px"
                        columnWidth={view === ViewMode.Month ? 160 : 60}
                        barBackgroundColor="hsl(var(--muted))"
                        barBackgroundSelectedColor="hsl(var(--muted-foreground))"
                        labelColor="hsl(var(--foreground))"
                        fontSize="12px"
                        todayColor="transparent"
                        headerHeight={50}
                    />
                </div>
            </CardContent>
        </Card>
    )
}
