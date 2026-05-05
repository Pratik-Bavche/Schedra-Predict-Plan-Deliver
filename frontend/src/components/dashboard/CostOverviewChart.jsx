import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

const defaultData = [
    { name: "Jan", Actual: 18500, Predicted: 17200 },
    { name: "Feb", Actual: 21000, Predicted: 22500 },
    { name: "Mar", Actual: 15600, Predicted: 15000 },
    { name: "Apr", Actual: 27800, Predicted: 26900 },
    { name: "May", Actual: 14900, Predicted: 16100 },
    { name: "Jun", Actual: 23900, Predicted: 24500 },
]

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        const actual = payload.find(p => p.dataKey === "Actual")?.value || 0;
        const predicted = payload.find(p => p.dataKey === "Predicted")?.value || 0;
        const isSimulated = payload[0]?.payload?.isSimulated;
        const difference = actual - predicted;
        const isLoss = actual > predicted;
        const amount = Math.abs(difference);

        return (
            <div className="bg-background p-4 border rounded-lg shadow-xl ring-1 ring-border min-w-[200px]">
                <div className="flex justify-between items-center mb-2 border-b pb-1">
                    <p className="font-bold text-base">{label}</p>
                    {isSimulated && (
                        <span className="text-[10px] bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded font-bold uppercase tracking-tighter">Simulated</span>
                    )}
                </div>
                <div className="space-y-1.5">
                    <p className="text-sm flex justify-between gap-4">
                        <span className="text-foreground font-bold">Actual Spend:</span>
                        <span className="font-bold text-primary">${actual.toLocaleString()}</span>
                    </p>
                    <p className="text-sm flex justify-between gap-4">
                        <span className="text-foreground font-bold">AI Forecast:</span>
                        <span className="font-bold text-destructive">${predicted.toLocaleString()}</span>
                    </p>
                </div>
                <div className={`mt-3 pt-2 border-t flex justify-between items-center gap-4 ${isLoss ? 'text-red-500' : 'text-green-600'}`}>
                    <span className="text-[10px] font-black uppercase tracking-wider leading-none">
                        {isLoss ? 'Over Budget' : 'Under Budget'}
                    </span>
                    <span className="text-lg font-black leading-none">${amount.toLocaleString()}</span>
                </div>
            </div>
        );
    }
    return null;
};

export function CostOverviewChart({ data, loading }) {
    const chartData = (data && data.length > 0) ? data : defaultData;
    return (
        <Card className="w-full h-full">
            <CardHeader>
                <CardTitle>Cost vs Forecast</CardTitle>
                <CardDescription>
                    Comparing actual spend against AI-predicted budget over the last 6 months.
                </CardDescription>
            </CardHeader>
            <CardContent className="pl-0 pb-2">
                <div className="h-[350px] w-full flex items-center justify-center min-h-[350px]">
                    {loading ? (
                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-sm">Generating AI Forecast...</p>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                            <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.5} />
                                <XAxis
                                    dataKey="name"
                                    stroke="#888888"
                                    fontSize={11}
                                    tickLine={false}
                                    axisLine={false}
                                    dy={10}
                                />
                                <YAxis
                                    stroke="#888888"
                                    fontSize={11}
                                    tickLine={false}
                                    axisLine={false}
                                    domain={[0, 'auto']}
                                    tickFormatter={(value) => value >= 1000 ? `$${value / 1000}k` : `$${value}`}
                                />
                                <Tooltip
                                    cursor={{ fill: 'hsl(var(--muted))', opacity: 0.1 }}
                                    content={<CustomTooltip />}
                                />
                                <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '20px' }} />
                                <Bar dataKey="Actual" name="Actual Spend" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={32} />
                                <Line type="monotone" dataKey="Predicted" name="AI Forecast" stroke="hsl(var(--destructive))" strokeWidth={3} dot={{ r: 4, fill: 'white', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
