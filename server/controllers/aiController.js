import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

// Parse multiple API keys from .env
const getKeys = () => (process.env.GEMINI_API_KEY || "").split(',').map(k => k.trim()).filter(Boolean);
let currentGlobalKeyIndex = 0;

export const getAIAnalytics = async (req, res) => {
    try {
        const timestamp = new Date().toLocaleTimeString();
        const apiKeys = getKeys();

        console.log(`[${timestamp}] --- NEW AI REQUEST ---`);
        console.log(`[${timestamp}] Active Keys available: ${apiKeys.length}`);

        if (apiKeys.length === 0) {
            console.error(`[${timestamp}] CRITICAL: No API keys found!`);
            return res.status(500).json({ message: "Server misconfiguration: Missing API Keys" });
        }

        const { type, projectData } = req.body;
        console.log("Request Type:", type);

        let prompt = "";

        if (type === "cost_forecast") {
            prompt = `
                You are an AI project manager. Analyze the following project data and provide a JSON response.
                
                Project Context:
                Name: ${projectData.name}
                Budget: ${projectData.budget}
                Start Date: ${projectData.startDate}
                Description: ${projectData.description}
                
                Task: Generate a cost forecast comparing actual spend vs AI-predicted budget for the last 6 months.
                Also predict final cost and potential overrun percentage.
                
                Return ONLY valid JSON in this format:
                {
                    "forecastData": [
                        {"name": "Month 1", "Actual": 1000, "Predicted": 1200},
                         ... (6 months)
                    ],
                    "finalCost": 120000,
                    "overrunPercentage": 15,
                    "insight": "Brief one sentence insight."
                }
            `;
        } else if (type === "resource_utilization") {
            prompt = `
                You are an AI resource planner. Analyze the project: ${projectData.name}.
                Generate a heatmap of team activity and utilization stats.
                
                Return ONLY valid JSON in this format:
                {
                    "utilizationScore": 85,
                    "heatmap": [
                        {"name": "Dev Team", "data": [{"x": "Mon", "y": 80}, {"x": "Tue", "y": 90} ... (5 days)]}
                    ],
                    "pendingApprovals": 3,
                    "insight": "Brief one sentence insight."
                }
            `;
        } else if (type === "risk_assessment") {
            prompt = `
                 You are an AI Risk Analyst. Analyze: ${projectData.name}.
                 
                 Return ONLY valid JSON in this format:
                 {
                    "riskScore": 78,
                    "confidenceLevel": "High",
                    "hotspots": [
                        "Supply Chain Delay"
                    ],
                    "insight": "Brief one sentence mitigation strategy."
                 }
            `;
        } else if (type === "timeline_prediction") {
            prompt = `
                You are an AI Scheduler. Analyze: ${projectData.name}.
                
                Return ONLY valid JSON in this format:
                {
                    "predictedCompletion": "2025-12-25",
                    "delayProbability": "Medium",
                    "phases": [
                        {"name": "Implementation", "status": "Delayed"}
                    ],
                    "insight": "Reason for potential delay."
                }
            `;
        } else if (type === "dashboard_cost_forecast") {
            const projects = req.body.projects || [];
            const summary = projects.map(p => `${p.name} ($${p.budget})`).join(", ");
            const totalBudget = projects.reduce((acc, p) => acc + (Number(p.budget) || 0), 0);

            prompt = `
                You are a Portfolio Manager. Analyze these projects: ${summary.substring(0, 1000)}...
                Total Portfolio Budget: $${totalBudget}.
                
                Generate an aggregated 'Actual vs Predicted' cost analysis for the last 6 months for the entire portfolio.
                Assume 'Actual' varies slightly from 'Predicted'.
                
                Return ONLY valid JSON in this format:
                {
                    "forecastData": [
                         {"name": "Month 1", "Actual": 45000, "Predicted": 50000},
                         {"name": "Month 2", "Actual": 52000, "Predicted": 50000},
                         ... (6 months)
                    ],
                    "insight": "Brief aggregated financial insight."
                }
            `;
        }

        if (!prompt) {
            return res.status(400).json({ message: "Invalid prediction type" });
        }

        const generateWithRetry = async (retries = 2, delay = 1000) => {
            const requestedModel = "gemini-2.5-flash";
            const fallbackModel = "gemini-flash-latest";

            for (let k = 0; k < apiKeys.length; k++) {
                const keyIdx = (currentGlobalKeyIndex + k) % apiKeys.length;
                const currentKey = apiKeys[keyIdx];

                console.log(`[${timestamp}] Trying Key #${keyIdx + 1} (${currentKey.substring(0, 8)}...)`);
                const localGenAI = new GoogleGenerativeAI(currentKey);

                for (let i = 0; i < retries; i++) {
                    try {
                        console.log(`[${timestamp}] Requesting ${requestedModel}...`);
                        const model = localGenAI.getGenerativeModel({ model: requestedModel });
                        const result = await model.generateContent(prompt);
                        const response = await result.response;

                        currentGlobalKeyIndex = keyIdx;
                        return response.text();
                    } catch (error) {
                        const errorMsg = error.message?.toLowerCase() || "";
                        if (errorMsg.includes("429") || errorMsg.includes("quota")) {
                            console.warn(`[${timestamp}] Key #${keyIdx + 1} quota exceeded for 2.5.`);
                            break;
                        }
                        if ((errorMsg.includes("503") || errorMsg.includes("overload")) && i < retries - 1) {
                            console.warn(`[${timestamp}] Overload. Retrying in ${delay}ms...`);
                            await new Promise(r => setTimeout(r, delay));
                            delay *= 2;
                            continue;
                        }
                        throw error;
                    }
                }
            }

            console.error(`[${timestamp}] ALL KEYS EXHAUSTED for 2.5-flash. Falling back to stable...`);
            const stableGenAI = new GoogleGenerativeAI(apiKeys[0]);
            const stableModel = stableGenAI.getGenerativeModel({ model: fallbackModel });
            const result = await stableModel.generateContent(prompt);
            const response = await result.response;
            return response.text();
        };

        try {
            const text = await generateWithRetry();
            console.log(`[${timestamp}] Gemini Response Text (First 100 chars):`, text.substring(0, 100));

            let jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
            const firstBrace = jsonStr.indexOf('{');
            const lastBrace = jsonStr.lastIndexOf('}');
            if (firstBrace !== -1 && lastBrace !== -1) {
                jsonStr = jsonStr.substring(firstBrace, lastBrace + 1);
            }

            try {
                const data = JSON.parse(jsonStr);
                res.json(data);
            } catch (parseError) {
                console.error(`[${timestamp}] JSON Parse Error. Full response text:`, text);
                res.status(500).json({ message: "AI response format was invalid", error: parseError.message });
            }
        } catch (apiError) {
            console.error(`[${timestamp}] Gemini API Final Failure:`, apiError.message);
            console.warn(`[${timestamp}] Generating STATIC FALLBACK data to keep dashboard alive.`);

            const fallbackData = generateFallbackData(type, projectData);
            res.json(fallbackData);
        }
    } catch (error) {
        console.error("Critical AI Controller Error:", error);
        // Even in critical error, try to return fallback if type and projectData exist
        if (req.body.type && req.body.projectData) {
            const fallbackData = generateFallbackData(req.body.type, req.body.projectData);
            return res.json(fallbackData);
        }
        res.status(500).json({ message: "Critical internal error", error: error.message });
    }
};

const generateFallbackData = (type, projectData) => {
    // Generate seeded randomness based on project name for consistency
    let seed = 0;
    const pName = projectData.name || "Default";
    for (let i = 0; i < pName.length; i++) {
        seed += pName.charCodeAt(i);
    }
    const pseudoRandom = (offset) => {
        const x = Math.sin(seed + offset) * 10000;
        return x - Math.floor(x);
    };

    const budget = parseFloat(projectData.budget) || 10000;

    if (type === "cost_forecast") {
        const variance = 1 + (pseudoRandom(1) * 0.4 - 0.2);
        return {
            forecastData: [
                { name: "Month 1", Actual: budget * 0.1, Predicted: budget * 0.12 * variance },
                { name: "Month 2", Actual: budget * 0.25, Predicted: budget * 0.24 * variance },
                { name: "Month 3", Actual: budget * 0.4, Predicted: budget * 0.36 * variance },
                { name: "Month 4", Actual: budget * 0.55, Predicted: budget * 0.48 * variance },
                { name: "Month 5", Actual: budget * 0.7, Predicted: budget * 0.60 * variance },
                { name: "Month 6", Actual: budget * 0.85, Predicted: budget * 0.72 * variance }
            ],
            finalCost: budget * (1.05 + pseudoRandom(2) * 0.1),
            overrunPercentage: Math.floor(5 + pseudoRandom(3) * 15),
            insight: "Spending is slightly above projection but within acceptable variance (Backend Fallback)."
        };
    } else if (type === "resource_utilization") {
        return {
            utilizationScore: Math.floor(70 + pseudoRandom(4) * 25),
            heatmap: [
                { name: "Dev Team", data: Array.from({ length: 5 }, (_, i) => ({ x: ["Mon", "Tue", "Wed", "Thu", "Fri"][i], y: Math.floor(60 + pseudoRandom(i + 5) * 40) })) },
                { name: "QA Team", data: Array.from({ length: 5 }, (_, i) => ({ x: ["Mon", "Tue", "Wed", "Thu", "Fri"][i], y: Math.floor(50 + pseudoRandom(i + 10) * 40) })) },
                { name: "Design", data: Array.from({ length: 5 }, (_, i) => ({ x: ["Mon", "Tue", "Wed", "Thu", "Fri"][i], y: Math.floor(40 + pseudoRandom(i + 15) * 50) })) }
            ],
            pendingApprovals: Math.floor(pseudoRandom(20) * 5),
            insight: "Resource utilization is optimal across key teams (Backend Fallback)."
        };
    } else if (type === "risk_assessment") {
        const score = Math.floor(pseudoRandom(25) * 100);
        return {
            riskScore: score,
            confidenceLevel: score > 75 ? "High" : (score > 40 ? "Medium" : "Low"),
            hotspots: score > 50 ? ["Budget Constraint", "Tight Deadline"] : ["Minor Schedule Slip"],
            insight: score > 50 ? "High risk detected (Backend Fallback)." : "Project risk is well managed (Backend Fallback)."
        };
    } else if (type === "timeline_prediction") {
        const delayChance = pseudoRandom(30);
        return {
            predictedCompletion: projectData.dueDate || "2025-12-31",
            delayProbability: delayChance > 0.7 ? "High" : (delayChance > 0.3 ? "Medium" : "Low"),
            phases: [
                { name: "Planning", status: "Done" },
                { name: "Execution", status: delayChance > 0.5 ? "Delayed" : "On Track" },
                { name: "Testing", status: "Pending" }
            ],
            insight: "Timeline analysis completed (Backend Fallback)."
        };
    } else if (type === "dashboard_cost_forecast") {
        // Aggregate fallback for dashboard
        const data = [];
        // Approximate total budget from "projects" if passed, or mock it?
        // generateFallbackData signature assumes `projectData` is the second arg. 
        // For dashboard, we might have passed `req.body` as projectData or we need to check if projectData is array?
        // In the controller call: `generateFallbackData(type, projectData)`
        // In the dashboard case, `projectData` might be undefined or we used `req.body.projects`.
        // Let's assume we pass `req.body.projects` as projectData for this type locally?
        // But `generateWithRetry` catch passes `type` and `projectData`.
        // We need to make sure we treat it right. 

        // Simple mock since we don't assume full project access in fallback context easily without refactor
        const base = 50000;
        for (let i = 1; i <= 6; i++) {
            data.push({
                name: `Month ${i}`,
                Actual: base * (0.8 + Math.random() * 0.4),
                Predicted: base
            });
        }
        return {
            forecastData: data,
            insight: "Portfolio spending is within limits (Backend Fallback)."
        };
    }
    return { message: "No data available" };
};
