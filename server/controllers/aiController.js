import dotenv from "dotenv";
dotenv.config();

const getApiKey = () => process.env.OPENROUTER_API_KEY;

// ─── Month Helpers ────────────────────────────────────────────────────────────
const getLast6MonthsLabel = () => {
    const list = [];
    for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setDate(1);
        d.setMonth(d.getMonth() - i);
        list.push(d.toLocaleString("en-US", { month: "short", year: "numeric" }));
    }
    return list;
};

// Generate months from startDate to endDate (inclusive), capped at today for ongoing
const getProjectMonthRange = (startDate, endDate, isCompleted) => {
    const list = [];
    const start = new Date(startDate);
    const ceiling = isCompleted ? new Date(endDate) : new Date();
    let cursor = new Date(start.getFullYear(), start.getMonth(), 1);
    const end = new Date(ceiling.getFullYear(), ceiling.getMonth(), 1);
    let max = 36; // safety cap
    while (cursor <= end && max-- > 0) {
        list.push(cursor.toLocaleString("en-US", { month: "short", year: "numeric" }));
        cursor.setMonth(cursor.getMonth() + 1);
    }
    return list;
};

// ─── Model Cascade ────────────────────────────────────────────────────────────
// Ordered by: verified working first, then fallbacks.
// Each entry specifies whether the model supports json_object response_format.
const MODEL_CASCADE = [
    { id: "nvidia/nemotron-3-ultra-550b-a55b:free", jsonObject: true  }, // 550B MoE, free, confirmed working ✅
    { id: "qwen/qwen-2.5-72b-instruct",             jsonObject: true  }, // High capability fallback
    { id: "tencent/hy3:free",                       jsonObject: false }, // 295B MoE, free, but no json_object
    { id: "cohere/north-mini-code:free",            jsonObject: false }, // 30B, free, fallback
];

// ─── API Call ─────────────────────────────────────────────────────────────────
const callOpenRouter = async (apiKey, modelEntry, prompt, timeoutMs = 25000) => {
    const { id: modelName, jsonObject } = typeof modelEntry === 'string'
        ? { id: modelEntry, jsonObject: true }
        : modelEntry;
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] Trying model: ${modelName}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const bodyPayload = {
        model: modelName,
        temperature: 0.3,
        max_tokens: 1500,
        messages: [
            {
                role: "system",
                content: "You are an expert AI project financial analyst. Always respond with ONLY valid JSON matching the exact schema requested. No extra text, no markdown, no code blocks."
            },
            { role: "user", content: prompt }
        ]
    };

    // Only add response_format if the model supports json_object
    if (jsonObject) {
        bodyPayload.response_format = { type: "json_object" };
    }

    let response;
    try {
        response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "https://schedra.app",
                "X-Title": "Schedra - Predict, Plan, Deliver"
            },
            body: JSON.stringify(bodyPayload),
            signal: controller.signal
        });
    } finally {
        clearTimeout(timeoutId);
    }


    // ── Full error logging ────────────────────────────────────────────────────
    if (!response.ok) {
        const bodyText = await response.text().catch(() => "(unreadable body)");
        const headersObj = {};
        response.headers.forEach((v, k) => { headersObj[k] = v; });

        console.error(`[${timestamp}] ❌ OpenRouter Error for model "${modelName}":
  Status : ${response.status} ${response.statusText}
  Body   : ${bodyText.slice(0, 500)}
  Headers: ${JSON.stringify(headersObj)}`);

        throw new Error(`OpenRouter ${response.status} for ${modelName}: ${bodyText.slice(0, 200)}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content;

    if (!text || text.trim() === "") {
        throw new Error(`Model "${modelName}" returned empty content.`);
    }

    console.log(`[${timestamp}] ✅ SUCCESS with model: ${modelName}`);
    return { text, modelName };
};

// ─── Try cascade of models ────────────────────────────────────────────────────
const generateWithCascade = async (apiKey, prompt) => {
    let lastError;
    for (const model of MODEL_CASCADE) {
        try {
            return await callOpenRouter(apiKey, model, prompt);
        } catch (err) {
            console.error(`[${new Date().toLocaleTimeString()}] Model "${model}" failed: ${err.message}`);
            lastError = err;
        }
    }
    throw lastError;
};

// ─── Parse JSON from model response ──────────────────────────────────────────
const parseJson = (text) => {
    let jsonStr = text.replace(/```json|```/g, "").trim();
    const first = jsonStr.indexOf("{");
    const last  = jsonStr.lastIndexOf("}");
    if (first !== -1 && last !== -1) jsonStr = jsonStr.slice(first, last + 1);
    return JSON.parse(jsonStr);
};

// ─── Main Handler ─────────────────────────────────────────────────────────────
export const getAIAnalytics = async (req, res) => {
    const timestamp = new Date().toLocaleTimeString();
    const apiKey = getApiKey();

    console.log(`[${timestamp}] ─── NEW AI REQUEST ───`);
    console.log(`[${timestamp}] API key loaded: ${apiKey ? `YES (length: ${apiKey.length})` : "NO ⚠️"}`);

    if (!apiKey) {
        return res.status(500).json({ message: "Missing OPENROUTER_API_KEY in server environment." });
    }

    const { type, projectData } = req.body;

    if (!projectData || (Array.isArray(projectData) && projectData.length === 0)) {
        return res.status(400).json({ message: "Invalid or missing projectData." });
    }

    // ─── Build prompt ─────────────────────────────────────────────────────────
    let prompt = "";

    // ── Cost Forecast ──────────────────────────────────────────────────────────
    if (["cost_forecast", "dashboard_cost_forecast", "project_cost_forecast"].includes(type)) {
        const projects = Array.isArray(projectData) ? projectData : [projectData];
        const isSingle = projects.length === 1;
        const totalBudget = projects.reduce((s, p) => s + (Number(p.budget) || 0), 0);

        // Build detailed telemetry summary per project
        const projectSummaries = projects.map(p => {
            const isCompleted = p.status === "Completed" ||
                (p.dueDate && new Date() > new Date(p.dueDate));
            const monthRange = (p.startDate && p.dueDate)
                ? getProjectMonthRange(p.startDate, p.dueDate, isCompleted)
                : getLast6MonthsLabel();

            const telemetryMap = {};
            (p.telemetry || []).forEach(t => {
                if (t.month && t.actualSpend != null) telemetryMap[t.month] = Number(t.actualSpend);
            });

            const monthsData = monthRange.map(m => ({
                month: m,
                actual: telemetryMap[m] ?? null,
                hasData: telemetryMap[m] != null
            }));

            const totalActual = Object.values(telemetryMap).reduce((s, v) => s + v, 0);
            const budgetUsedPct = p.budget ? Math.round((totalActual / Number(p.budget)) * 100) : 0;

            return {
                name: p.name,
                budget: Number(p.budget) || 0,
                status: p.status || "In Progress",
                startDate: p.startDate,
                dueDate: p.dueDate,
                type: p.type,
                riskLevel: p.riskLevel,
                teamSize: p.teamSize,
                totalActualSpend: totalActual,
                budgetUsedPercent: budgetUsedPct,
                remainingBudget: (Number(p.budget) || 0) - totalActual,
                monthlyData: monthsData
            };
        });

        // For dashboard requests: aggregate telemetry across all projects
        const aggregatedTelemetry = {};
        projects.forEach(p => {
            (p.telemetry || []).forEach(t => {
                if (t.month) aggregatedTelemetry[t.month] = (aggregatedTelemetry[t.month] || 0) + Number(t.actualSpend || 0);
            });
        });

        // Determine the months to include in forecastData
        // For single projects, use project range; for dashboard, use last 6 months
        const windowMonths = isSingle
            ? (() => {
                const p = projects[0];
                const isCompleted = p.status === "Completed" || (p.dueDate && new Date() > new Date(p.dueDate));
                return (p.startDate && p.dueDate)
                    ? getProjectMonthRange(p.startDate, p.dueDate, isCompleted)
                    : getLast6MonthsLabel();
            })()
            : getLast6MonthsLabel();

        const monthlyActualStr = windowMonths.map(m => {
            const actual = aggregatedTelemetry[m];
            return `"${m}": ${actual != null ? `$${actual}` : "no data"}`;
        }).join(", ");

        prompt = `You are an expert AI financial analyst for a project management platform called Schedra.

Analyze the following project data and generate a REALISTIC cost forecast.

CRITICAL INSTRUCTIONS:
- The "Predicted" value for each month should be an AI-generated intelligent forecast based on burn rate, remaining budget, and project timeline.
- Do NOT make the Predicted line always increase. It should reflect actual patterns: if spending slows, predictions should decrease or plateau.
- If actual spending is low in early months and budget is large, predict reasonable steady-state monthly burn.
- Each project should get a DIFFERENT forecast based on its unique data.

${isSingle ? "SINGLE PROJECT ANALYSIS:" : "FLEET ANALYSIS:"}
${JSON.stringify(projectSummaries, null, 2)}

Monthly actual spend for forecastData months:
{ ${monthlyActualStr} }

Total fleet budget: $${totalBudget.toLocaleString()}

Generate forecastData for EXACTLY these months in order: ${windowMonths.join(", ")}

Rules:
1. "Actual" = exact actualSpend from telemetry for that month (0 if no data recorded yet)
2. "Predicted" = your AI-generated forecast (NOT a fixed multiple of budget/12)
3. "isSimulated" = true if no real telemetry exists for that month
4. Make "Predicted" values vary realistically based on project phase, risk, remaining budget, and burn rate trend

Return ONLY this JSON (no markdown, no extra text):
{
  "forecastData": [
    { "name": "${windowMonths[0]}", "Actual": 0, "Predicted": 0, "isSimulated": false }
  ],
  "finalCost": 0,
  "overrunPercentage": 0,
  "insight": "Detailed 2-3 sentence AI analysis of budget trajectory and cost risks."
}`;

    // ── Risk Assessment ────────────────────────────────────────────────────────
    } else if (["dashboard_risk_assessment", "project_risk_assessment", "risk_assessment"].includes(type)) {
        const projects = (Array.isArray(projectData) ? projectData : [projectData]).filter(Boolean);
        const isSingle = type === "project_risk_assessment" || type === "risk_assessment" || projects.length === 1;

        const projectDetails = projects.map(p => ({
            name: p.name,
            type: p.type,
            status: p.status,
            riskLevel: p.riskLevel,
            budget: p.budget,
            region: p.region,
            startDate: p.startDate,
            dueDate: p.dueDate,
            teamSize: p.teamSize,
            progress: p.progress,
            totalActualSpend: (p.telemetry || []).reduce((s, t) => s + Number(t.actualSpend || 0), 0)
        }));

        prompt = `You are an expert AI risk analyst for a project management platform.

${isSingle ? "Analyze this specific project for risk zones:" : "Analyze this fleet of projects and aggregate risk by region/type:"}

${JSON.stringify(projectDetails, null, 2)}

${isSingle
    ? "Break down risk into 4-5 specific risk dimensions (e.g., Budget Risk, Timeline Risk, Technical Risk, Resource Risk, Compliance Risk). Score each 0-100 based on the actual project data."
    : "Group projects by region or type and calculate aggregate risk scores. Each group should have a realistic score based on actual project data."}

Return ONLY this JSON:
{
  "riskData": [
    { "region": "Risk Area Name", "factor": "Primary Risk Factor", "score": 75 }
  ],
  "riskScore": 75,
  "confidenceLevel": "High",
  "hotspots": ["Risk Factor 1", "Risk Factor 2"],
  "insight": "2-3 sentence AI risk assessment based on the actual project data."
}`;

    // ── Resource Utilization ───────────────────────────────────────────────────
    } else if (type === "resource_utilization") {
        const p = Array.isArray(projectData) ? projectData[0] : projectData;
        const lastTelemetry = (p.telemetry || []).slice(-3);
        prompt = `You are an AI resource manager analyzing a project team.

Project: ${p.name}
Team Size: ${p.teamSize || "Unknown"}
Status: ${p.status}
Recent telemetry (last 3 months): ${JSON.stringify(lastTelemetry)}

Based on the team size, project status, and telemetry, estimate realistic resource utilization.

Return ONLY this JSON:
{
  "utilizationScore": 82,
  "heatmap": [
    { "name": "Development", "data": [{ "x": "Mon", "y": 80 }, { "x": "Tue", "y": 85 }, { "x": "Wed", "y": 78 }, { "x": "Thu", "y": 90 }, { "x": "Fri", "y": 70 }] }
  ],
  "pendingApprovals": 5,
  "insight": "2 sentence analysis of team utilization based on this project's actual data."
}`;

    // ── Timeline Prediction ────────────────────────────────────────────────────
    } else if (type === "timeline_prediction") {
        const p = Array.isArray(projectData) ? projectData[0] : projectData;
        const daysRemaining = p.dueDate
            ? Math.ceil((new Date(p.dueDate) - new Date()) / (1000 * 60 * 60 * 24))
            : null;
        prompt = `You are an AI timeline prediction expert.

Project: ${p.name}
Start: ${p.startDate}
Due: ${p.dueDate}
Days Remaining: ${daysRemaining}
Status: ${p.status}
Progress: ${p.progress || 0}%
Risk Level: ${p.riskLevel}
Budget Used: $${(p.telemetry || []).reduce((s, t) => s + Number(t.actualSpend || 0), 0).toLocaleString()} of $${Number(p.budget || 0).toLocaleString()}

Based on this data, predict the timeline outcome.

Return ONLY this JSON:
{
  "predictedCompletion": "${p.dueDate || new Date().toISOString().split('T')[0]}",
  "delayProbability": "Low",
  "phases": [
    { "name": "Planning", "status": "Done" },
    { "name": "Implementation", "status": "In Progress" },
    { "name": "Testing", "status": "Pending" },
    { "name": "Deployment", "status": "Pending" }
  ],
  "insight": "2-3 sentence AI timeline analysis based on current progress and risk level."
}`;

    } else {
        return res.status(400).json({ message: `Invalid prediction type: "${type}"` });
    }

    // ─── Call AI with cascade ─────────────────────────────────────────────────
    try {
        const { text, modelName } = await generateWithCascade(apiKey, prompt);

        const data = parseJson(text);
        data.__aiSource = "openrouter";
        data.__aiModel = modelName;

        console.log(`[${timestamp}] Response dispatched. Model: ${modelName}`);
        return res.json(data);

    } catch (err) {
        console.error(`[${timestamp}] ❌ ALL MODELS FAILED. Error: ${err.message}`);
        console.error(`[${timestamp}] Stack: ${err.stack}`);

        // Use fallback — but log clearly that it is a fallback
        const fallback = generateFallbackData(type, projectData);
        fallback.__aiSource = "server_fallback";
        fallback.__aiError = err.message;
        fallback.__allModelsFailed = true;

        console.warn(`[${timestamp}] ⚠️ Returning server-side fallback data.`);
        return res.json(fallback);
    }
};

// ─── Server-Side Fallback ─────────────────────────────────────────────────────
// Used ONLY when all AI models fail. Produces realistic (not upward-sloping)
// predictions based on actual telemetry and project data.
const generateFallbackData = (type, projectData) => {
    if (["cost_forecast", "dashboard_cost_forecast", "project_cost_forecast"].includes(type)) {
        const projects = Array.isArray(projectData) ? projectData : [projectData];
        const totalBudget = projects.reduce((s, p) => s + (Number(p.budget) || 150000), 0);

        // Build locale-agnostic telemetry lookup
        const aggregatedTelemetry = {};
        projects.forEach(p => {
            (p.telemetry || []).forEach(t => {
                if (!t.month) return;
                try {
                    const d = new Date(t.month.replace(/^(\w+)\s(\d{4})$/, '$1 1, $2'));
                    if (!isNaN(d.getTime())) {
                        const key = d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
                        aggregatedTelemetry[key] = (aggregatedTelemetry[key] || 0) + Number(t.actualSpend || 0);
                    }
                } catch { /* skip */ }
            });
        });

        // Use project's actual range if single project, else last 6 months
        const isSingle = projects.length === 1;
        const p = projects[0];
        const isCompleted = p?.status === "Completed" ||
            (p?.dueDate && new Date() > new Date(p.dueDate));

        const windowMonths = isSingle && p?.startDate && p?.dueDate
            ? getProjectMonthRange(p.startDate, p.dueDate, isCompleted)
            : getLast6MonthsLabel();

        // Compute average actual burn from telemetry (not a fixed formula)
        const actualValues = windowMonths.map(m => aggregatedTelemetry[m] || 0).filter(v => v > 0);
        const avgBurn = actualValues.length > 0
            ? actualValues.reduce((s, v) => s + v, 0) / actualValues.length
            : totalBudget / 12;

        const forecastData = windowMonths.map((m) => {
            const actual = aggregatedTelemetry[m] || 0;
            // Predicted: based on average burn (not i * 0.05 escalation)
            const jitter = 0.9 + Math.random() * 0.2; // ±10% realistic variance
            const predicted = Math.round(avgBurn * jitter);
            return {
                name: m,
                Actual: actual,
                Predicted: predicted,
                isSimulated: actual === 0
            };
        });

        return {
            forecastData,
            finalCost: Math.round(avgBurn * windowMonths.length),
            overrunPercentage: Math.round(((avgBurn * windowMonths.length - totalBudget) / totalBudget) * 100),
            insight: "Fallback: AI unavailable. Forecast based on actual telemetry burn rate."
        };
    }

    if (["dashboard_risk_assessment", "project_risk_assessment", "risk_assessment"].includes(type)) {
        const projects = (Array.isArray(projectData) ? projectData : [projectData]).filter(Boolean);
        if (projects.length === 1) {
            const p = projects[0];
            const budgetUsed = (p.telemetry || []).reduce((s, t) => s + Number(t.actualSpend || 0), 0);
            const budgetRisk = p.budget ? Math.min(100, Math.round((budgetUsed / Number(p.budget)) * 120)) : 50;
            return {
                riskData: [
                    { region: "Budget Risk",   factor: "Cost Overrun",        score: budgetRisk },
                    { region: "Timeline Risk", factor: "Deadline Pressure",   score: p.riskLevel === "Critical" ? 90 : p.riskLevel === "High" ? 70 : 45 },
                    { region: "Resource Risk", factor: "Team Capacity",       score: p.teamSize > 20 ? 40 : 65 },
                    { region: "Technical Risk",factor: "Implementation Gaps", score: p.type === "IT" ? 55 : 40 },
                ]
            };
        }
        const regionMap = {};
        projects.forEach(p => {
            const region = p.region || p.type || "General";
            if (!regionMap[region]) regionMap[region] = { count: 0, scoreSum: 0 };
            const score = p.riskLevel === "Critical" ? 90 : p.riskLevel === "High" ? 70 : p.riskLevel === "Medium" ? 50 : 20;
            regionMap[region].count++;
            regionMap[region].scoreSum += score;
        });
        return {
            riskData: Object.keys(regionMap).map(r => ({
                region: r,
                factor: regionMap[r].scoreSum / regionMap[r].count > 60 ? "Timeline Criticality" : "Operational Efficiency",
                score: Math.round(regionMap[r].scoreSum / regionMap[r].count)
            }))
        };
    }

    return {};
};
