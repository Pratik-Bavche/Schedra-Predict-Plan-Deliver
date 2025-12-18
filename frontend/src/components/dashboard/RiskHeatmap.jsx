import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

function RiskBadge({ score }) {
    if (score >= 80) return <span className="bg-destructive/20 text-destructive px-2 py-1 rounded text-xs font-bold">High</span>
    if (score >= 50) return <span className="bg-yellow-500/20 text-yellow-600 px-2 py-1 rounded text-xs font-bold">Medium</span>
    return <span className="bg-green-500/20 text-green-600 px-2 py-1 rounded text-xs font-bold">Low</span>
}

export function RiskHeatmap({ data = [], loading }) {
    return (
        <Card className="col-span-3">
            <CardHeader>
                <CardTitle>Regional Risk Heatmap</CardTitle>
                <CardDescription>
                    AI-detected high risk zones based on current telemetry.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-8 gap-2 text-muted-foreground">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-sm">Analyzing Risks...</p>
                        </div>
                    ) : (
                        data.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No regional data available.</p>
                        ) : (
                            data.map((item, index) => (
                                <div key={index} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-medium leading-none">{item.region || "Unknown Region"}</p>
                                        </div>
                                        <p className="text-xs text-muted-foreground">Primary Factor: {item.factor || "General"}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="text-sm font-medium">{item.score}%</div>
                                        <RiskBadge score={item.score} />
                                    </div>
                                </div>
                            ))
                        )
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
