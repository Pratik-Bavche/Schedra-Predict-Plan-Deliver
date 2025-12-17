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

    return (
        <Card className="col-span-1 md:col-span-7">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle>Construction Timeline</CardTitle>
                {headerAction}
            </CardHeader>
            <CardContent className="overflow-x-auto">
                <div className="min-w-[800px]">
                    <Gantt
                        tasks={tasks}
                        viewMode={view}
                        listCellWidth="155px"
                        columnWidth={view === ViewMode.Month ? 100 : 60}
                        barBackgroundColor="hsl(var(--muted))"
                        barBackgroundSelectedColor="hsl(var(--muted-foreground))"
                        labelColor="hsl(var(--foreground))"
                        fontSize="12px"
                    />
                </div>
            </CardContent>
        </Card>
    )
}
