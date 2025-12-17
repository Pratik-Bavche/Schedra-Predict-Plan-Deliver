import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { AlertTriangle, ArrowRight, Sun, TrendingDown } from "lucide-react"
import { useState } from "react"
import { api } from "@/lib/api"
import { toast } from "sonner"

export default function ForecastsPage() {
    const [labor, setLabor] = useState(80)
    const [material, setMaterial] = useState(0)
    const [weather, setWeather] = useState(20)
    const [loading, setLoading] = useState(false)
    const [prediction, setPrediction] = useState(null)

    const handleSimulation = async () => {
        setLoading(true)
        try {
            // Mapping UI sliders to ML model inputs
            // Weather -> Complexity
            // Material -> Inflation
            // Labor -> Base Cost multiplier
            const baseCost = 1000000 * (labor / 100)

            const result = await api.post("/predict", {
                complexity: weather,
                inflation: material,
                base_cost: baseCost
            })

            setPrediction(result)
            toast.success("Simulation complete", { description: "AI Forecast updated." })
        } catch {
            toast.error("Simulation failed")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Forecasts & Simulation</h2>
                    <p className="text-muted-foreground">Run "What-If" scenarios to predict project outcomes.</p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Simulator Controls */}
                <Card>
                    <CardHeader>
                        <CardTitle>Scenario Inputs</CardTitle>
                        <CardDescription>Adjust variables to simulate impact on cost and schedule.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label>Labor Availability ({labor}%)</Label>
                                <span className="text-xs text-muted-foreground">Normal</span>
                            </div>
                            <Slider defaultValue={[80]} max={100} min={50} step={1} onValueChange={(vals) => setLabor(vals[0])} />
                            <p className="text-xs text-muted-foreground">Adjust crew size relative to plan.</p>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label>Material Price Variance ({material > 0 ? "+" : ""}{material}%)</Label>
                                <span className="text-xs text-muted-foreground">Current Market</span>
                            </div>
                            <Slider defaultValue={[0]} max={50} min={-20} step={1} onValueChange={(vals) => setMaterial(vals[0])} />
                            <p className="text-xs text-muted-foreground">Simulate raw material cost fluctuations.</p>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label>Weather Severity ({weather}%)</Label>
                                <span className="text-xs text-muted-foreground">{weather > 50 ? "Heavy Storms" : "Sunny/Mild"}</span>
                            </div>
                            <Slider defaultValue={[20]} max={100} min={0} step={1} onValueChange={(vals) => setWeather(vals[0])} />
                            <p className="text-xs text-muted-foreground">Probability of extreme weather events.</p>
                        </div>

                        <Button className="w-full" onClick={handleSimulation} disabled={loading}>
                            {loading ? "Simulating..." : "Run Simulation"} {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
                        </Button>
                    </CardContent>
                </Card>

                {/* Prediction Results */}
                <div className="space-y-6">
                    <Card className="bg-primary text-primary-foreground border-none">
                        <CardHeader>
                            <CardTitle>AI Prediction</CardTitle>
                            <CardDescription className="text-primary-foreground/80">Based on current simulation inputs.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4">
                            <div className="flex items-center justify-between border-b border-primary-foreground/20 pb-4">
                                <span className="font-medium">Estimated Completion</span>
                                <span className="text-2xl font-bold">
                                    {prediction ? `+${prediction.predicted_delay_days} Days` : "Oct 15, 2025"}
                                </span>
                            </div>
                            <div className="flex items-center justify-between border-b border-primary-foreground/20 pb-4">
                                <span className="font-medium">Projected Cost</span>
                                <div className="text-right">
                                    <span className="text-2xl font-bold block">
                                        {prediction ? `$${prediction.predicted_cost.toLocaleString()}` : "$1.45M"}
                                    </span>
                                    <span className="text-xs opacity-80">
                                        {prediction ? "Dynamic Forecast" : "+$250k variance"}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="font-medium">Risk Score</span>
                                <span className="text-2xl font-bold">
                                    {prediction ? prediction.risk_score : "87"}
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-yellow-500" /> Key Risks Identified
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                                <TrendingDown className="h-5 w-5 text-destructive mt-0.5" />
                                <div>
                                    <p className="font-medium text-sm">Material Cost Spike</p>
                                    <p className="text-xs text-muted-foreground">Steel prices are volatile. A 10% increase is likely.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                                <Sun className="h-5 w-5 text-orange-500 mt-0.5" />
                                <div>
                                    <p className="font-medium text-sm">Monsoon Impact</p>
                                    <p className="text-xs text-muted-foreground">High probability of delay in June-July.</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
