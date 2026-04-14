import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

// Optional Claude support
const useClaude =
  process.env.ENABLE_CLAUDE === "true" && !!process.env.CLAUDE_API_KEY;

// Parse Gemini API keys
const getKeys = () =>
  (process.env.GEMINI_API_KEY || "")
    .split(",")
    .map(k => k.trim())
    .filter(Boolean);

let currentGlobalKeyIndex = 0;

// Helper for last 6 months
const getLast6MonthsLabel = () => {
    const list = [];
    for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        list.push(d.toLocaleString('default', { month: 'short', year: 'numeric' }));
    }
    return list;
};

export const getAIAnalytics = async (req, res) => {
    const timestamp = new Date().toLocaleTimeString();
    const apiKeys = getKeys();

    console.log(`[${timestamp}] --- NEW AI REQUEST ---`);
    console.log(`[${timestamp}] Active Keys: ${apiKeys.length}`);

    if (apiKeys.length === 0) {
        return res.status(500).json({ message: "Missing GEMINI_API_KEY" });
    }

    const { type, projectData } = req.body;
    let prompt = "";
    const windowMonths = getLast6MonthsLabel();

  // ---------------- PROMPT BUILDER ----------------
  // Support both single-project and dashboard-level requests
  if (type === "cost_forecast" || type === "dashboard_cost_forecast" || type === "project_cost_forecast") {
    // For dashboard requests, projectData may be an array
    const pd = (Array.isArray(projectData) ? projectData[0] : projectData) || {};
    prompt = `
You are an AI project manager.
Analyze the project below and return ONLY valid JSON.
IMPORTANT: For the forecastData, use the following month names as 'name': ${windowMonths.join(", ")}.

Project:
Name: ${pd.name}
Budget: ${pd.budget}
Start Date: ${pd.startDate}
Description: ${pd.description || "N/A"}
Telemetry (Actual logged data): ${pd.telemetry ? JSON.stringify(pd.telemetry) : "No actual data logged yet"}

JSON format:
{
  "forecastData": [
    { "name": "${windowMonths[0]}", "Actual": 1000, "Predicted": 1200 }
  ],
  "finalCost": 120000,
  "overrunPercentage": 10,
  "insight": "One sentence insight. If telemetry was provided, base your 'Actual' values ON THE TELEMETRY for those months."
}
`;
  } else if (type === "dashboard_risk_assessment" || type === "project_risk_assessment") {
    // Expect an array of projects or single project
    const projects = (Array.isArray(projectData) ? projectData : [projectData]).filter(p => p);

    // If it's a single project risk assessment (Project Details Page), we want a detailed breakdown
    const isSingleProject = type === "project_risk_assessment";

    const projectList = projects
      .map((p) => `- Name: ${p.name || "Unnamed"}, Region: ${p.region || p.type || "General"}, Risk: ${p.riskLevel || "Low"}`)
      .join("\n");

    prompt = `
You are an AI risk analyst. 
${isSingleProject
        ? "Analyze this specific project and identify potential risk zones (Regional/Operational areas). Break down the risk by 4-5 hypothetical or actual regions/zones."
        : "Given the following list of projects, aggregate risk by region."}
Return ONLY valid JSON.

Projects:
${projectList}

JSON format:
{
  "riskData": [
    { "region": "Region/Zone Name", "factor": "Risk Factor Name", "score": 85 }
  ]
}
`;
  } else {
    console.warn(`[${timestamp}] Invalid prediction type received: ${type}`);
    return res.status(400).json({ message: "Invalid prediction type" });
  }

  // ---------------- GEMINI CALL ----------------
  const generateWithRetry = async () => {
    // Priority list of models as requested
    // Note: 2.5 models are hypothetical or preview-only; adding 2.0 and 1.5 as safe production fallbacks.
    const MODELS = [
      "gemini-2.5-flash-lite",
      "gemini-2.5-flash",
      "gemini-2.0-flash",
      "gemini-1.5-flash"
    ];

    let lastError = null;

    for (const modelName of MODELS) {
      console.log(`[${timestamp}] Trying model: ${modelName}`);

      for (let k = 0; k < apiKeys.length; k++) {
        const keyIdx = (currentGlobalKeyIndex + k) % apiKeys.length;
        const genAI = new GoogleGenerativeAI(apiKeys[keyIdx]);

        try {
          // Rate-limit protection
          await new Promise(r => setTimeout(r, 800)); // Slightly reduced wait for efficiency

          console.log(`[${timestamp}] Requesting ${modelName} with key index ${keyIdx}...`);

          const model = genAI.getGenerativeModel({ model: modelName });
          const result = await model.generateContent(prompt);

          const text = result.response.text();
          currentGlobalKeyIndex = keyIdx; // Update global index on success
          return { text, modelName };
        } catch (err) {
          lastError = err;
          const msg = err.message?.toLowerCase() || "";
          console.error(`[${timestamp}] Error with ${modelName} (key ${keyIdx}):`, err.message);

          // If it's a model not found error, break key loop and try next model immediately
          if (msg.includes("not found") || msg.includes("404")) {
            console.warn(`[${timestamp}] Model ${modelName} not found. Switching to next model.`);
            break; // Break key loop, go to next model
          }

          // If quota/rate limit, try next key (continue loop)
          if (msg.includes("429") || msg.includes("quota") || msg.includes("403")) {
            console.warn(`[${timestamp}] Quota exceeded for key ${keyIdx}. Trying next key.`);
            continue;
          }

          // Other errors, continue to next key/model attempt
        }
      }
    }

    throw new Error(`All Gemini models and keys exhausted. Last error: ${lastError?.message}`);
  };

  // ---------------- RESPONSE HANDLING ----------------
  try {
    const { text, modelName } = await generateWithRetry();
    console.log(`[${timestamp}] Gemini success using ${modelName}`);

    let jsonStr = text.replace(/```json|```/g, "").trim();
    // Improved JSON extraction in case of preamble/postamble
    const firstBrace = jsonStr.indexOf("{");
    const lastBrace = jsonStr.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1) {
      jsonStr = jsonStr.slice(firstBrace, lastBrace + 1);
    }

    const data = JSON.parse(jsonStr);
    data.__aiSource = "gemini";
    data.__aiModel = modelName;
    return res.json(data);
  } catch (err) {
    console.warn(`[${timestamp}] AI Generation failed: ${err.message}. Using FALLBACK data.`);
    const fallback = generateFallbackData(type, projectData);
    fallback.__aiSource = "fallback";
    return res.json(fallback);
  }
};

// ---------------- FALLBACK ----------------
const generateFallbackData = (type, projectData) => {
  if (type === "cost_forecast" || type === "dashboard_cost_forecast" || type === "project_cost_forecast") {
    const pd = Array.isArray(projectData) ? projectData[0] : projectData;
    const budget = Math.max(Number(pd?.budget) || 150000, 150000);

    // If telemetry exists, map it to forecastData
    if (pd?.telemetry && pd.telemetry.length > 0) {
      const telemetryData = pd.telemetry.map(t => ({
        name: t.month,
        Actual: t.actualSpend,
        Predicted: budget * 0.12 // Still predict something
      }));

      // If we have telemetry, use it, then maybe simulated future months
      return {
        forecastData: telemetryData,
        finalCost: budget * 1.05,
        overrunPercentage: 5,
        insight: "Reporting based on user-logged telemetry data."
      };
    }

    const windowMonths = getLast6MonthsLabel();
    return {
        forecastData: windowMonths.map((m, i) => ({
            name: m,
            Actual: budget * (0.1 + (i * 0.12)),
            Predicted: budget * (0.12 + (i * 0.1))
        })),
        finalCost: budget * 1.08,
        overrunPercentage: 8,
        insight: "Spending is slightly above projection but within acceptable variance."
    };
  }

  if (type === "dashboard_risk_assessment" || type === "project_risk_assessment") {
    const projects = (Array.isArray(projectData) ? projectData : [projectData]).filter(p => p);
    const regionMap = {};

    // Logic for single project fallback (simulated regions)
    if (projects.length === 1 && type === "project_risk_assessment") {
      return {
        riskData: [
          { region: "North Zone", factor: "Supply Chain", score: 75 },
          { region: "South Zone", factor: "Labor Availability", score: 45 },
          { region: "East Zone", factor: "Weather Impact", score: 60 },
          { region: "West Zone", factor: "Regulatory", score: 30 }
        ]
      };
    }

    projects.forEach(p => {
      const region = p.region || p.type || "General";
      if (!regionMap[region]) regionMap[region] = { count: 0, scoreSum: 0 };
      let score = p.riskLevel === 'Critical' ? 95 : p.riskLevel === 'High' ? 85 : p.riskLevel === 'Medium' ? 55 : 20;
      regionMap[region].count++;
      regionMap[region].scoreSum += score;
    });

    const finalRisk = Object.keys(regionMap).map(r => ({
      region: r,
      factor: regionMap[r].scoreSum / regionMap[r].count > 60 ? "Timeline Criticality" : "Operational Efficiency",
      score: Math.round(regionMap[r].scoreSum / regionMap[r].count)
    }));
    return { riskData: finalRisk };
  }

  // Default fallback for unknown types
  return {};
};
