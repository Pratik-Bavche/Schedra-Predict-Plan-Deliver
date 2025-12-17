import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"



export function ResourceUtilizationChart({ data, className }) {
    const chartData = data || [
        { site: "Site A", manpower: 120 },
        { site: "Site B", manpower: 85 },
        { site: "Site C", manpower: 150 },
        { site: "Site D", manpower: 60 },
        { site: "HQ", manpower: 45 },
    ]

    return (
        <Card className={`col-span-1 ${className}`}>
            <CardHeader>
                <CardTitle>Resource Utilization</CardTitle>
                <CardDescription>
                    Manpower allocation across active sites.
                </CardDescription>
            </CardHeader>
            <CardContent className="pl-0">
                <div className="h-[350px] w-full min-w-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis
                                dataKey="site"
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                            />
                            <Tooltip
                                cursor={{ fill: 'transparent' }}
                                contentStyle={{ borderRadius: '6px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Bar dataKey="manpower" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={50} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}
