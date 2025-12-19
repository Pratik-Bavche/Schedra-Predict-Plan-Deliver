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
                
                Generate a CUMULATIVE S-Curve cost analysis for the last 6 months.
                The 'Predicted' line must show cumulative spending increasing over time (not flat), representing project progress (e.g., Month 1: 10%, Month 6: 100% of pro-rated budget).
                'Actual' spend should vary realistically around this curve (+/- 5-10%).
                
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
        } else if (type === "dashboard_risk_assessment") {
            const projects = req.body.projects || [];
            const summary = projects.map(p => `${p.region || p.type || "General"}: ${p.name} (${p.riskLevel})`).join(", ");

            prompt = `
                You are a Risk Analyst. Analyze these projects grouped by Region/Category: ${summary.substring(0, 1000)}...
                
                Identify the primary risk factor for each region (e.g., "Resource Shortage", "Timeline Compression", "Budget Constraints").
                Calculate an aggregate risk score (0-100) for each region.
                
                Return ONLY valid JSON in this format:
                {
                    "riskData": [
                         {"region": "North America", "factor": "Resource Shortage", "score": 75},
                         {"region": "Europe", "factor": "Regulatory Compliance", "score": 40}
                    ]
                }
            `;
        } else if (type === "project_cost_forecast") {
            prompt = `
                You are a Construction Project Manager. Analyze this project:
                Name: ${projectData.name}
                Budget: $${projectData.budget}
                Start Date: ${projectData.startDate}
                
                Generate a 6-month 'Actual vs Predicted' cumulative cost forecast based on the budget curve.
                
                Return ONLY valid JSON in this format:
                {
                    "forecastData": [
                         {"name": "Jan", "Actual": 20000, "Predicted": 22000},
                         ... (6 months)
                    ],
                    "insight": "Brief financial health check."
                }
            `;
        } else if (type === "project_risk_assessment") {
            prompt = `
                You are a Risk Manager. Analyze risks for this project: ${projectData.name} (Risk Level: ${projectData.riskLevel}).
                Categories: Technical, Financial, Schedule, Environmental, Operational.
                
                Assign a risk score (0-100) and primary factor for 3-4 relevant categories.
                
                Return ONLY valid JSON in this format:
                {
                    "riskData": [
                         {"region": "Technical", "factor": "Integration", "score": 65},
                         {"region": "Financial", "factor": "Cost Overrun", "score": 40}
                    ]
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
    const pName = (projectData && projectData.name) ? projectData.name : "Default";
    for (let i = 0; i < pName.length; i++) {
        seed += pName.charCodeAt(i);
    }
    const pseudoRandom = (offset) => {
        const x = Math.sin(seed + offset) * 10000;
        return x - Math.floor(x);
    };

    const budget = (projectData && projectData.budget) ? parseFloat(projectData.budget) : 10000;

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
        const data = [];
        let projects = [];
        if (projectData && Array.isArray(projectData.projects)) {
            projects = projectData.projects;
        } else if (Array.isArray(projectData)) {
            projects = projectData;
        }

        let totalBudget = 0;
        if (projects.length > 0) {
            totalBudget = projects.reduce((acc, p) => acc + (Number(p.budget) || 0), 0);
        } else {
            totalBudget = 300000; // Mock 300k if no data
        }

        const monthlyBase = totalBudget / 6;

        // Create a stable seed from project names to ensure consistent fallback data across refreshes
        let seed = 0;
        projects.forEach(p => {
            const name = p.name || "";
            for (let j = 0; j < name.length; j++) {
                seed += name.charCodeAt(j);
            }
        });

        const pseudoRandom = (offset) => {
            const x = Math.sin(seed + offset) * 10000;
            return x - Math.floor(x);
        };

        for (let i = 1; i <= 6; i++) {
            // Use seeded random for variance so it looks dynamic but stays constant on refresh
            const curve = 1 + (Math.sin(i * 0.5) * 0.2); // Seasonal curve
            const noise = (pseudoRandom(i) * 0.3) - 0.15; // Random noise

            // Cumulative S-Curve Logic (Predicted = Ideal Growth, Actual = Real with variance)
            const predictedVal = monthlyBase * i;
            const variance = 1 + (pseudoRandom(i) * 0.2 - 0.1); // +/- 10% noise
            const actualVal = predictedVal * variance;

            data.push({
                name: `Month ${i}`,
                Actual: Math.round(actualVal),
                Predicted: Math.round(predictedVal)
            });
        }
        return {
            forecastData: data,
            insight: "Portfolio spending is projected based on current budgets (Backend Fallback)."
        };
    } else if (type === "dashboard_risk_assessment") {
        const projects = (projectData && Array.isArray(projectData.projects)) ? projectData.projects : (Array.isArray(projectData) ? projectData : []);
        const regionMap = {};

        projects.forEach(p => {
            const region = p.region || p.type || "General";
            if (!regionMap[region]) regionMap[region] = { count: 0, scoreSum: 0 };

            let score = 20; // Low
            if (p.riskLevel === 'Medium') score = 55;
            if (p.riskLevel === 'High') score = 85;
            if (p.riskLevel === 'Critical') score = 95;

            regionMap[region].count++;
            regionMap[region].scoreSum += score;
        });

        const riskData = Object.keys(regionMap).map(r => {
            const avg = Math.round(regionMap[r].scoreSum / regionMap[r].count);
            const factor = avg > 70 ? "Timeline Criticality" : (avg > 40 ? "Resource Allocation" : "Operational Efficiency");
            return { region: r, factor, score: avg };
        });

        if (riskData.length === 0) {
            return {
                riskData: [
                    { region: "General", factor: "System Stability", score: 25 }
                ]
            };
        }

        return { riskData };
    } else if (type === "project_cost_forecast") {
        const budget = Number(projectData.budget) || 50000;
        const monthly = budget / 6; // Spread over 6 months view
        const data = [];

        for (let i = 1; i <= 6; i++) {
            // Use project-specific seed for unique chart shapes per project
            const uniqueCurve = 1 + (pseudoRandom(i + 10) * 0.3 - 0.15);

            const predictedVal = monthly * i;
            const actualVal = predictedVal * uniqueCurve;

            data.push({
                name: `Month ${i}`,
                Actual: Math.round(actualVal),
                Predicted: Math.round(predictedVal)
            });
        }

        return {
            forecastData: data,
            insight: "Project spending is tracking against the baseline curve (Backend Fallback)."
        };
    } else if (type === "project_risk_assessment") {
        const baseScore = projectData.riskLevel === 'High' ? 80 : (projectData.riskLevel === 'Medium' ? 50 : 20);

        const riskData = [
            { region: "Technical", factor: "Complexity", score: baseScore + Math.floor(Math.random() * 10) },
            { region: "Financial", factor: "Budget", score: baseScore - 5 },
            { region: "Schedule", factor: "Timeline", score: baseScore + 5 },
            { region: "Operational", factor: "Resources", score: baseScore }
        ];

        return { riskData };
    }
    return { message: "No data available" };
};
