import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"



export function CostBreakdownChart({ data, className }) {
    const chartData = data || [
        { name: "Labor", value: 45000, color: "hsl(var(--primary))" },
        { name: "Materials", value: 32000, color: "#22d3ee" },
        { name: "Equipment", value: 18000, color: "#f472b6" },
        { name: "Overhead", value: 9000, color: "#a3a3a3" },
    ]

    return (
        <Card className={`col-span-1 ${className}`}>
            <CardHeader>
                <CardTitle>Cost Breakdown</CardTitle>
                <CardDescription>
                    Expense distribution by category.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[350px] w-full min-w-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip
                                formatter={(value) => `$${value.toLocaleString()}`}
                                contentStyle={{ borderRadius: '6px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                            <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    )
}
