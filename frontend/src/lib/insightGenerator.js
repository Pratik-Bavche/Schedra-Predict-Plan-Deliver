export const generateProjectForecast = (project) => {
    if (!project) return [];

    const budget = Number(project.budget) || 100000;
    const monthlyBenchmark = Math.round(budget / 12);
    const end = new Date(project.dueDate);
    
    // Generate the last 6 months as the focus window
    let windowMonths = [];
    for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        
        // Trimming Logic: If project is completed/ended, don't show future months
        if (d > end && (project.status === "Completed" || calculateCurrentPhase(project) === "Completed")) continue;
        
        windowMonths.push(d.toLocaleString('en-US', { month: 'short', year: 'numeric' }));
    }

    // Map telemetry and benchmarks to this 6-month window
    return windowMonths.map(monthLabel => {
        // Find actual data if exists in telemetry
        const telemetryEntry = project.telemetry?.find(t => t.month === monthLabel);
        
        return {
            name: monthLabel, // Use 'name' to match Chart XAxis
            Actual: telemetryEntry ? telemetryEntry.actualSpend : 0, 
            Predicted: monthlyBenchmark, // The original/actual budget benchmark
            isActual: !!telemetryEntry,
            isSimulated: !telemetryEntry
        };
    });
};

export const generateProjectTimeline = (project) => {
    if (!project) return [];

    const start = new Date(project.startDate || new Date());
    start.setHours(0, 0, 0, 0); // Normalize to start of day
    
    // Default to 60 days if no due date, or ensure end > start
    let end = new Date(project.dueDate || new Date(start.getTime() + 60 * 24 * 60 * 60 * 1000));
    end.setHours(23, 59, 59, 999); // Normalize to end of day
    
    if (end <= start) end = new Date(start.getTime() + 60 * 24 * 60 * 60 * 1000);

    // Ensure unique ID for Gantt tasks to prevent duplicates crashing the component
    const id = project._id || project.id || project.projectId || `proj_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    const totalDuration = end.getTime() - start.getTime();

    // Helper to get date at specific percentage of total duration
    const getDateAt = (percent) => new Date(start.getTime() + (totalDuration * percent));

    // Helper to calculate progress based on "Now"
    const getProgress = (taskStart, taskEnd) => {
        if (now < taskStart) return 0;
        if (now > taskEnd) return 100;
        const duration = taskEnd.getTime() - taskStart.getTime();
        const elapsed = now.getTime() - taskStart.getTime();
        return Math.round((elapsed / duration) * 100);
    };

    // Define Phases relative to project duration (0.0 to 1.0)
    // Define Phases: 4 Equal Phases (25% each)
    const phases = [
        { name: "Planning", startP: 0.0, endP: 0.25, color: "#ffbb54", sColor: "#ff9e0d" },
        { name: "Implementation", startP: 0.25, endP: 0.50, color: "#22d3ee", sColor: "#06b6d4" },
        { name: "Testing", startP: 0.50, endP: 0.75, color: "#f472b6", sColor: "#db2777" },
        { name: "Deployment", startP: 0.75, endP: 1.0, color: "#a3a3a3", sColor: "#525252" }
    ];

    return phases.map((phase, index) => {
        const tStart = getDateAt(phase.startP);
        const tEnd = getDateAt(phase.endP);
        const taskId = `${id}_${index + 1}`;
        const prevId = index > 0 ? [`${id}_${index}`] : [];

        return {
            start: tStart,
            end: tEnd,
            name: phase.name,
            id: taskId,
            type: phase.type || "task",
            progress: getProgress(tStart, tEnd),
            isDisabled: true, // Read-only projection
            dependencies: prevId,
            styles: { progressColor: phase.color, progressSelectedColor: phase.sColor },
        };
    });
};

export function generateResourceData(project, timeRange = 'all') {
    if (!project) return null;

    // IF TELEMETRY EXISTS, USE THE LAST LOGGED DATA
    if (project.telemetry && project.telemetry.length > 0) {
        const lastLog = project.telemetry[project.telemetry.length - 1];
        return [
            { site: "Active Personnel", manpower: lastLog.activeResources },
            { site: "HQ Support", manpower: 15 },
        ];
    }

    // Seed random based on project ID length to keep it deterministic per project
    const seed = project._id ? project._id.length : 10;
    let baseManpower = seed * 15;

    // If visualizing Last 30 Days, mock "Active" manpower might be slightly different or same
    // Let's assume for this mock, Last 30 Days shows "Active Daily Average" vs "Allocated Total"
    if (timeRange === 'last30') {
        baseManpower = Math.floor(baseManpower * 0.8); // 80% active currently
    }

    return [
        { site: "Site A", manpower: Math.floor(baseManpower * 0.4) },
        { site: "Site B", manpower: Math.floor(baseManpower * 0.3) },
        { site: "Site C", manpower: Math.floor(baseManpower * 0.5) },
        { site: "Site D", manpower: Math.floor(baseManpower * 0.2) },
        { site: "HQ", manpower: 25 },
    ];
}

export function generateCostBreakdown(project, timeRange = 'all') {
    if (!project) return null;

    const seed = project._id ? project._id.charCodeAt(0) : 50;
    const isTech = project.name.toLowerCase().includes("web") || project.name.toLowerCase().includes("app");

    // Scale factor: Total Project vs Monthly Spend (approx 10-15%)
    const scale = timeRange === 'last30' ? 0.15 : 1;

    if (isTech) {
        return [
            { name: "Labor (Dev)", value: Math.floor(seed * 800 * scale), color: "hsl(var(--primary))" },
            { name: "Software/Cloud", value: Math.floor(seed * 200 * scale), color: "#22d3ee" },
            { name: "Equipment", value: Math.floor(seed * 100 * scale), color: "#f472b6" },
            { name: "Marketing", value: Math.floor(seed * 300 * scale), color: "#a3a3a3" },
        ];
    }

    return [
        { name: "Materials", value: Math.floor(seed * 1000 * scale), color: "#22d3ee" },
        { name: "Labor", value: Math.floor(seed * 600 * scale), color: "hsl(var(--primary))" },
        { name: "Equipment", value: Math.floor(seed * 400 * scale), color: "#f472b6" },
        { name: "Overhead", value: Math.floor(seed * 150 * scale), color: "#a3a3a3" },
    ];
};

export function calculateOverallProgress(project) {
    if (!project) return 0;
    const start = new Date(project.startDate || new Date());
    let end = new Date(project.dueDate || new Date(start.getTime() + 60 * 24 * 60 * 60 * 1000));
    if (end <= start) end = new Date(start.getTime() + 60 * 24 * 60 * 60 * 1000);

    const now = new Date();
    if (now < start) return 0;
    if (now > end) return 100;

    const total = end.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();
    return Math.round((elapsed / total) * 100);
}

export function calculateCurrentPhase(project) {
    if (!project) return "Not Started";
    
    const now = new Date();
    const end = new Date(project.dueDate);
    const progress = calculateOverallProgress(project); // 0-100
    const p = progress / 100;

    // Fix: If deployment is completed (p >= 1 or past end), show Completed
    if (p >= 1 || now > end) {
        return "Completed";
    }

    if (p <= 0) return "Not Started";
    if (p < 0.25) return "Planning";
    if (p < 0.50) return "Implementation";
    if (p < 0.75) return "Testing";
    return "Deployment";
}
