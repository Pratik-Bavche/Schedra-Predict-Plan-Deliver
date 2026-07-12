import {
    ComposedChart, Bar, Line, XAxis, YAxis,
    CartesianGrid, Tooltip, Legend,
    ResponsiveContainer, Cell, LabelList
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

const defaultData = [
    { name: "Feb 2026", Actual: 18500, Predicted: 17200 },
    { name: "Mar 2026", Actual: 21000, Predicted: 22500 },
    { name: "Apr 2026", Actual: 15600, Predicted: 15000 },
    { name: "May 2026", Actual: 27800, Predicted: 26900 },
    { name: "Jun 2026", Actual: 14900, Predicted: 16100 },
    { name: "Jul 2026", Actual: 5200, Predicted: 18500, isCurrentMonth: true },
]

// ─── LIVE dot label rendered above current-month bar ─────────────────────────
const LiveDotLabel = (props) => {
    const { x, y, width, index, viewBox } = props;
    // LabelList passes viewBox; use it to check if this entry is current month
    // We look it up from the data via index
    if (props.isCurrentMonth === undefined) return null;
    if (!props.isCurrentMonth) return null;

    const cx = x + width / 2;
    const cy = y - 14;

    return (
        <g>
            {/* Dashed connecting line from dot to bar top */}
            <line x1={cx} y1={y - 4} x2={cx} y2={cy + 6}
                stroke="#10b981" strokeWidth={1.5} strokeDasharray="3 2" opacity={0.7} />
            {/* Outer pulsing ring */}
            <circle cx={cx} cy={cy} r={8} fill="none" stroke="#10b981" strokeWidth={1.5} opacity={0.5}>
                <animate attributeName="r" values="7;12;7" dur="1.8s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.5;0;0.5" dur="1.8s" repeatCount="indefinite" />
            </circle>
            {/* Inner solid dot */}
            <circle cx={cx} cy={cy} r={5} fill="#10b981">
                <animate attributeName="opacity" values="1;0.5;1" dur="1.8s" repeatCount="indefinite" />
            </circle>
        </g>
    );
};

// ─── Custom tooltip ───────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;

    const actual    = payload.find(p => p.dataKey === "Actual")?.value    || 0;
    const predicted = payload.find(p => p.dataKey === "Predicted")?.value || 0;
    const entry     = payload[0]?.payload || {};
    const { isCurrentMonth, isSimulated } = entry;
    const isOver    = actual > predicted;
    const delta     = Math.abs(actual - predicted);

    return (
        <div className="bg-background p-4 border rounded-xl shadow-xl ring-1 ring-border min-w-[210px]">
            {/* Header */}
            <div className="flex justify-between items-center mb-2 border-b pb-1.5 gap-3">
                <p className="font-bold text-sm truncate">{label}</p>
                <div className="flex gap-1 shrink-0">
                    {isCurrentMonth && (
                        <span className="flex items-center gap-1 text-[10px] bg-emerald-100 text-emerald-700
                                         dark:bg-emerald-900/40 dark:text-emerald-400 px-1.5 py-0.5
                                         rounded font-bold uppercase tracking-tight">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Live
                        </span>
                    )}
                    {isSimulated && !isCurrentMonth && (
                        <span className="text-[10px] bg-yellow-100 text-yellow-800 px-1.5 py-0.5
                                         rounded font-bold uppercase tracking-tight">
                            Simulated
                        </span>
                    )}
                </div>
            </div>

            {/* In-progress note */}
            {isCurrentMonth && (
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mb-2 leading-tight">
                    📊 Month in progress — data may be partial
                </p>
            )}

            {/* Values */}
            <div className="space-y-1.5">
                <p className="text-sm flex justify-between gap-6">
                    <span className="text-muted-foreground font-medium">Actual Spend</span>
                    <span className={`font-bold ${isCurrentMonth ? "text-emerald-600 dark:text-emerald-400" : "text-primary"}`}>
                        ${actual.toLocaleString()}
                    </span>
                </p>
                <p className="text-sm flex justify-between gap-6">
                    <span className="text-muted-foreground font-medium">AI Forecast</span>
                    <span className="font-bold text-destructive">${predicted.toLocaleString()}</span>
                </p>
            </div>

            {/* Delta badge */}
            <div className={`mt-3 pt-2 border-t flex justify-between items-center gap-3
                             ${isOver ? "text-red-500" : "text-emerald-600"}`}>
                <span className="text-[10px] font-black uppercase tracking-wider">
                    {isCurrentMonth
                        ? (isOver ? "Trending Over"  : "Trending Under")
                        : (isOver ? "Over Budget"    : "Under Budget")}
                </span>
                <span className="text-base font-black">${delta.toLocaleString()}</span>
            </div>
        </div>
    );
};

// ─── Custom legend ────────────────────────────────────────────────────────────
const CustomLegend = ({ payload }) => (
    <div className="flex items-center justify-end gap-5 pb-4 flex-wrap pr-2">
        {payload?.map((entry, i) => (
            <span key={i} className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <span className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ background: entry.color, display: "inline-block" }} />
                {entry.value}
            </span>
        ))}
        {/* Current-month indicator */}
        <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-70" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
            Current Month
        </span>
    </div>
);

// ─── Custom X-axis tick (highlight current month) ─────────────────────────────
const CustomXTick = ({ x, y, payload, chartData }) => {
    const entry  = chartData?.find(d => d.name === payload.value);
    const isCurr = entry?.isCurrentMonth;
    return (
        <g transform={`translate(${x},${y})`}>
            <text
                x={0} y={0} dy={12}
                textAnchor="middle"
                fill={isCurr ? "#10b981" : "#888888"}
                fontSize={isCurr ? 12 : 11}
                fontWeight={isCurr ? 700 : 400}
            >
                {payload.value}
            </text>
        </g>
    );
};

// ─── Main export ──────────────────────────────────────────────────────────────
export function CostOverviewChart({ data, loading }) {
    const chartData = (data && data.length > 0) ? data : defaultData;

    // Per-bar colors: emerald for current month, CSS-var primary for others
    const barColor = (entry) => entry.isCurrentMonth ? "#10b981" : "hsl(var(--primary))";

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
                            <ComposedChart
                                data={chartData}
                                margin={{ top: 28, right: 30, left: 20, bottom: 20 }}
                            >
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    vertical={false}
                                    strokeOpacity={0.4}
                                />

                                <XAxis
                                    dataKey="name"
                                    tickLine={false}
                                    axisLine={false}
                                    dy={4}
                                    tick={(props) => (
                                        <CustomXTick {...props} chartData={chartData} />
                                    )}
                                />

                                <YAxis
                                    stroke="#888888"
                                    fontSize={11}
                                    tickLine={false}
                                    axisLine={false}
                                    domain={[0, "auto"]}
                                    tickFormatter={(v) => v >= 1000 ? `$${v / 1000}k` : `$${v}`}
                                />

                                <Tooltip
                                    cursor={{ fill: "hsl(var(--muted))", opacity: 0.08 }}
                                    content={<CustomTooltip />}
                                />

                                <Legend content={<CustomLegend />} />

                                {/* ── Actual spend bars ── */}
                                <Bar
                                    dataKey="Actual"
                                    name="Actual Spend"
                                    radius={[5, 5, 0, 0]}
                                    barSize={32}
                                    fill="hsl(var(--primary))"
                                >
                                    {/* Per-bar fill colour */}
                                    {chartData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={barColor(entry)}
                                            opacity={entry.isCurrentMonth ? 0.9 : 1}
                                        />
                                    ))}

                                    {/* Dashed border overlay for current month */}
                                    <LabelList
                                        dataKey="Actual"
                                        content={(props) => {
                                            const { x, y, width, height, index } = props;
                                            const entry = chartData[index];
                                            if (!entry?.isCurrentMonth || !height || height <= 0) return null;
                                            return (
                                                <rect
                                                    key={`dash-${index}`}
                                                    x={Number(x) + 1}
                                                    y={Number(y) + 1}
                                                    width={Number(width) - 2}
                                                    height={Number(height) - 2}
                                                    rx={4} ry={4}
                                                    fill="none"
                                                    stroke="#6ee7b7"
                                                    strokeWidth={1.5}
                                                    strokeDasharray="5 3"
                                                    opacity={0.85}
                                                />
                                            );
                                        }}
                                    />

                                    {/* Pulsing LIVE dot above current month */}
                                    <LabelList
                                        dataKey="isCurrentMonth"
                                        content={(props) => {
                                            const { x, y, width, index } = props;
                                            const entry = chartData[index];
                                            if (!entry?.isCurrentMonth) return null;
                                            const cx = Number(x) + Number(width) / 2;
                                            const cy = Number(y) - 14;
                                            return (
                                                <g key={`dot-${index}`}>
                                                    <line
                                                        x1={cx} y1={Number(y) - 3}
                                                        x2={cx} y2={cy + 6}
                                                        stroke="#10b981" strokeWidth={1.5}
                                                        strokeDasharray="3 2" opacity={0.6}
                                                    />
                                                    <circle cx={cx} cy={cy} r={9}
                                                        fill="none" stroke="#10b981"
                                                        strokeWidth={1.5} opacity={0.4}>
                                                        <animate attributeName="r"
                                                            values="7;13;7" dur="2s"
                                                            repeatCount="indefinite" />
                                                        <animate attributeName="opacity"
                                                            values="0.4;0;0.4" dur="2s"
                                                            repeatCount="indefinite" />
                                                    </circle>
                                                    <circle cx={cx} cy={cy} r={5}
                                                        fill="#10b981">
                                                        <animate attributeName="opacity"
                                                            values="1;0.55;1" dur="2s"
                                                            repeatCount="indefinite" />
                                                    </circle>
                                                </g>
                                            );
                                        }}
                                    />
                                </Bar>

                                {/* ── AI forecast line ── */}
                                <Line
                                    type="monotone"
                                    dataKey="Predicted"
                                    name="AI Forecast"
                                    stroke="hsl(var(--destructive))"
                                    strokeWidth={3}
                                    dot={{ r: 4, fill: "white", strokeWidth: 2, stroke: "hsl(var(--destructive))" }}
                                    activeDot={{ r: 6 }}
                                />
                            </ComposedChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
