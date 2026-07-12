// ─── Private helper: is a project completed? ─────────────────────────────────
// Uses ONLY status field + date check — never calls calculateCurrentPhase
// to avoid circular recursion.
const isProjectCompleted = (project) => {
    if (!project) return false;
    if (project.status === "Completed") return true;
    if (project.dueDate) {
        const end = new Date(project.dueDate);
        end.setHours(23, 59, 59, 999);
        return new Date() > end;
    }
    return false;
};

// ─── Private helper: parse a stored month string → { year, month(0-indexed) }
// Handles both 'en-US' short format ("Aug 2025") and any other stored format
// by converting to a Date object via the key year+monthIndex.
const parseMonthKey = (monthStr) => {
    if (!monthStr) return null;
    try {
        // Try "MMM YYYY" (en-US short) → "Aug 1, 2025"
        const d = new Date(monthStr.replace(/^(\w+)\s(\d{4})$/, '$1 1, $2'));
        if (!isNaN(d.getTime())) return d;
        // Try numeric "M/YYYY" (Windows default) → new Date("1/1/2025")
        const parts = monthStr.match(/^(\d{1,2})\/(\d{4})$/);
        if (parts) return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, 1);
        return null;
    } catch {
        return null;
    }
};

// ─── generateProjectForecast ─────────────────────────────────────────────────
/**
 * Returns monthly Cost vs Forecast data for a project.
 *
 * Strategy:
 *  - Build a month range: startDate → dueDate (completed) or today (ongoing)
 *  - For EACH month in that range, look up telemetry using year+monthIndex key
 *    (format-agnostic — works regardless of whether data was saved as "Aug 2025"
 *    or "8/2025" or any other locale string)
 *  - Every month in the range is included; months with data show actual spend,
 *    months without show 0 but still appear on the X-axis
 */
export const generateProjectForecast = (project) => {
    if (!project) return [];

    const budget           = Number(project.budget) || 100000;
    const monthlyBenchmark = Math.round(budget / 12);
    const completed        = isProjectCompleted(project);

    // ── Date range ──────────────────────────────────────────────────────────
    const startDate = project.startDate ? new Date(project.startDate) : new Date();
    const dueDate   = project.dueDate   ? new Date(project.dueDate)   : new Date();

    const rangeStart = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    const rangeEnd   = completed
        ? new Date(dueDate.getFullYear(), dueDate.getMonth(), 1)
        : new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    // Guard: if range is inverted or huge, cap it sensibly
    if (rangeStart > rangeEnd) return [];

    // ── Build telemetry lookup keyed by "YYYY-MM" ────────────────────────────
    // This is locale-agnostic: works for "Aug 2025", "8/2025", "August 2025", etc.
    const telemetryMap = {};
    (project.telemetry || []).forEach(t => {
        const d = parseMonthKey(t.month);
        if (d) {
            const key = `${d.getFullYear()}-${d.getMonth()}`;
            telemetryMap[key] = t;
        }
    });

    // ── Generate all months in range ─────────────────────────────────────────
    const months = [];
    let cursor = new Date(rangeStart);
    while (cursor <= rangeEnd) {
        months.push(new Date(cursor));
        cursor.setMonth(cursor.getMonth() + 1);
    }

    const currentMonthLabel = new Date().toLocaleString('en-US', { month: 'short', year: 'numeric' });

    return months.map(d => {
        const key        = `${d.getFullYear()}-${d.getMonth()}`;
        const monthLabel = d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
        const entry      = telemetryMap[key];

        return {
            name:           monthLabel,
            Actual:         entry ? (entry.actualSpend || 0) : 0,
            Predicted:      monthlyBenchmark,
            isActual:       !!entry,
            isSimulated:    !entry,
            isCurrentMonth: !completed && monthLabel === currentMonthLabel,
        };
    });
};

// ─── generateProjectTimeline ──────────────────────────────────────────────────
/**
 * Returns Gantt-compatible phase tasks.
 * Does NOT call calculateCurrentPhase — uses isProjectCompleted() to break cycle.
 */
export const generateProjectTimeline = (project) => {
    if (!project) return [];

    const start = new Date(project.startDate || new Date());
    start.setHours(0, 0, 0, 0);

    let end = new Date(project.dueDate || new Date(start.getTime() + 60 * 24 * 60 * 60 * 1000));
    end.setHours(23, 59, 59, 999);

    if (end <= start) end = new Date(start.getTime() + 60 * 24 * 60 * 60 * 1000);

    const id = project._id || project.id || project.projectId ||
        `proj_${Math.random().toString(36).substr(2, 9)}`;

    const rawNow      = new Date();
    const completed   = isProjectCompleted(project);
    const effectiveNow = completed ? end : rawNow;

    const totalDuration = end.getTime() - start.getTime();
    const phaseDuration = totalDuration / 4;

    const getProgress = (taskStart, taskEnd) => {
        if (effectiveNow < taskStart) return 0;
        if (effectiveNow > taskEnd)   return 100;
        const duration = taskEnd.getTime() - taskStart.getTime();
        const elapsed  = effectiveNow.getTime() - taskStart.getTime();
        return Math.round((elapsed / duration) * 100);
    };

    const phases = [
        { name: "Planning",       color: "#ffbb54", sColor: "#ff9e0d" },
        { name: "Implementation", color: "#22d3ee", sColor: "#06b6d4" },
        { name: "Testing",        color: "#f472b6", sColor: "#db2777" },
        { name: "Deployment",     color: "#a3a3a3", sColor: "#525252" },
    ];

    let currentStart = start.getTime();

    return phases.map((phase, index) => {
        const predictedEnd = currentStart + phaseDuration;

        const adjustment = project.phaseAdjustments?.find(a => a.phaseName === phase.name);
        let actualEnd = adjustment?.endDate
            ? new Date(adjustment.endDate).getTime()
            : predictedEnd;

        if (actualEnd < currentStart) actualEnd = currentStart + 1000 * 60 * 60 * 24;

        const tStart = new Date(currentStart);
        const tEnd   = new Date(actualEnd);
        currentStart = actualEnd;

        return {
            start:        tStart,
            end:          tEnd,
            name:         phase.name,
            id:           `${id}_${index + 1}`,
            type:         "task",
            progress:     getProgress(tStart, tEnd),
            isDisabled:   true,
            dependencies: index > 0 ? [`${id}_${index}`] : [],
            styles:       { progressColor: phase.color, progressSelectedColor: phase.sColor },
        };
    });
};

// ─── generateResourceData ─────────────────────────────────────────────────────
export function generateResourceData(project, timeRange = 'all') {
    if (!project) return null;

    if (project.telemetry && project.telemetry.length > 0) {
        const lastLog = project.telemetry[project.telemetry.length - 1];
        return [
            { site: "Active Personnel", manpower: lastLog.activeResources },
            { site: "HQ Support",       manpower: 15 },
        ];
    }

    const seed = project._id ? project._id.length : 10;
    let baseManpower = seed * 15;
    if (timeRange === 'last30') baseManpower = Math.floor(baseManpower * 0.8);

    return [
        { site: "Site A", manpower: Math.floor(baseManpower * 0.4) },
        { site: "Site B", manpower: Math.floor(baseManpower * 0.3) },
        { site: "Site C", manpower: Math.floor(baseManpower * 0.5) },
        { site: "Site D", manpower: Math.floor(baseManpower * 0.2) },
        { site: "HQ",     manpower: 25 },
    ];
}

// ─── generateCostBreakdown ────────────────────────────────────────────────────
export function generateCostBreakdown(project, timeRange = 'all') {
    if (!project) return null;

    const seed   = project._id ? project._id.charCodeAt(0) : 50;
    const isTech = project.name.toLowerCase().includes("web") ||
                   project.name.toLowerCase().includes("app");
    const scale  = timeRange === 'last30' ? 0.15 : 1;

    if (isTech) {
        return [
            { name: "Labor (Dev)",    value: Math.floor(seed * 800  * scale), color: "hsl(var(--primary))" },
            { name: "Software/Cloud", value: Math.floor(seed * 200  * scale), color: "#22d3ee" },
            { name: "Equipment",      value: Math.floor(seed * 100  * scale), color: "#f472b6" },
            { name: "Marketing",      value: Math.floor(seed * 300  * scale), color: "#a3a3a3" },
        ];
    }
    return [
        { name: "Materials", value: Math.floor(seed * 1000 * scale), color: "#22d3ee" },
        { name: "Labor",     value: Math.floor(seed * 600  * scale), color: "hsl(var(--primary))" },
        { name: "Equipment", value: Math.floor(seed * 400  * scale), color: "#f472b6" },
        { name: "Overhead",  value: Math.floor(seed * 150  * scale), color: "#a3a3a3" },
    ];
}

// ─── calculateOverallProgress ─────────────────────────────────────────────────
export function calculateOverallProgress(project) {
    if (!project) return 0;

    const tasks = generateProjectTimeline(project);
    if (tasks.length === 0) return 0;

    const start = tasks[0].start;
    const end   = tasks[tasks.length - 1].end;
    const now   = new Date();

    if (now < start) return 0;
    if (now > end)   return 100;

    const total   = end.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();
    return Math.round((elapsed / total) * 100);
}

// ─── calculateCurrentPhase ────────────────────────────────────────────────────
// Safe: calls generateProjectTimeline, which does NOT call back here.
export function calculateCurrentPhase(project) {
    if (!project) return "Not Started";
    if (project.status === "Completed") return "Completed";

    const tasks = generateProjectTimeline(project);
    if (tasks.length === 0) return "Not Started";

    const now = new Date();
    if (now < tasks[0].start)              return "Not Started";
    if (now > tasks[tasks.length - 1].end) return "Completed";

    for (const task of tasks) {
        if (now >= task.start && now <= task.end) return task.name;
    }
    return "Completed";
}
