import Project from "../models/Project.js";
import asyncHandler from "express-async-handler";

// @desc    Fetch all projects
// @route   GET /api/projects
// @access  Public
const getProjects = asyncHandler(async (req, res) => {
    const projects = await Project.find({});
    res.json(projects);
});

// @desc    Fetch single project
// @route   GET /api/projects/:id
// @access  Public
const getProjectById = asyncHandler(async (req, res) => {
    const project = await Project.findById(req.params.id);

    if (project) {
        res.json(project);
    } else {
        res.status(404);
        throw new Error("Project not found");
    }
});

const determineRisk = (budget) => {
    const amount = Number(budget) || 0;
    if (amount >= 1000000) return 'Critical';
    if (amount >= 500000) return 'High';
    if (amount >= 100000) return 'Medium';
    return 'Low';
};

// @desc    Create a project
// @route   POST /api/projects
// @access  Public
const createProject = asyncHandler(async (req, res) => {
    const {
        name, type, description, startDate, dueDate, budget,
        manager, client,
        // IT
        techStack, teamSize, modules, repoLink, methodology, expectedLoad, integrationReq,
        // Infra
        subType, region, capacity, terrain, contractor, landStatus, envStatus, equipment, permits,
        // Startup
        startupStage, industrySector, founders, targetMarket, gtmPlan, revenueModel, funding,
        // Docs
        scheduleUrl, boqUrl
    } = req.body;

    // Generate Auto ID
    let projectId;
    let isUnique = false;
    while (!isUnique) {
        projectId = `PROJ-${Math.floor(1000 + Math.random() * 9000)}`; // Simple 4-digit ID
        const existing = await Project.findOne({ projectId });
        if (!existing) isUnique = true;
    }

    const calculatedRisk = determineRisk(budget);

    const project = await Project.create({
        projectId,
        name, type, description, startDate, dueDate, budget,
        manager, client,
        techStack, teamSize, modules, repoLink, methodology, expectedLoad, integrationReq,
        subType, region, capacity, terrain, contractor, landStatus, envStatus, equipment, permits,
        startupStage, industrySector, founders, targetMarket, gtmPlan, revenueModel, funding,
        scheduleUrl, boqUrl,
        riskLevel: calculatedRisk,
        status: "Planning",
        progress: 0
    });

    if (project) {
        res.status(201).json(project);
    } else {
        res.status(400);
        throw new Error("Invalid project data");
    }
});

// @desc    Delete a project
// @route   DELETE /api/projects/:id
// @access  Public
const deleteProject = asyncHandler(async (req, res) => {
    console.log(`Attempting to delete project ID: ${req.params.id}`);
    const project = await Project.findByIdAndDelete(req.params.id);

    if (project) {
        console.log("Project deleted successfully");
        res.json({ message: "Project removed" });
    } else {
        console.log("Project not found for deletion");
        res.status(404);
        throw new Error("Project not found");
    }
});

// @desc    Update a project
// @route   PUT /api/projects/:id
// @access  Public
const updateProject = asyncHandler(async (req, res) => {
    const project = await Project.findById(req.params.id);

    if (project) {
        project.name = req.body.name || project.name;
        project.type = req.body.type || project.type;
        project.description = req.body.description || project.description;
        project.startDate = req.body.startDate || project.startDate;
        project.dueDate = req.body.dueDate || project.dueDate;

        // Update budget and recalculate risk
        if (req.body.budget !== undefined) {
            project.budget = req.body.budget;
            project.riskLevel = determineRisk(project.budget);
        }

        project.manager = req.body.manager || project.manager;
        project.client = req.body.client || project.client;

        project.status = req.body.status || project.status;
        if (req.body.progress !== undefined) project.progress = req.body.progress;

        // IT
        project.techStack = req.body.techStack || project.techStack;
        project.teamSize = req.body.teamSize || project.teamSize;
        project.modules = req.body.modules || project.modules;
        project.repoLink = req.body.repoLink || project.repoLink;
        project.methodology = req.body.methodology || project.methodology;
        project.expectedLoad = req.body.expectedLoad || project.expectedLoad;
        project.integrationReq = req.body.integrationReq || project.integrationReq;

        // Infra
        project.subType = req.body.subType || project.subType;
        project.region = req.body.region || project.region;
        project.capacity = req.body.capacity || project.capacity;
        project.terrain = req.body.terrain || project.terrain;
        project.contractor = req.body.contractor || project.contractor;
        project.landStatus = req.body.landStatus || project.landStatus;
        project.envStatus = req.body.envStatus || project.envStatus;
        project.equipment = req.body.equipment || project.equipment;
        project.permits = req.body.permits || project.permits;

        // Startup
        project.startupStage = req.body.startupStage || project.startupStage;
        project.industrySector = req.body.industrySector || project.industrySector;
        project.founders = req.body.founders || project.founders;
        project.targetMarket = req.body.targetMarket || project.targetMarket;
        project.gtmPlan = req.body.gtmPlan || project.gtmPlan;
        project.revenueModel = req.body.revenueModel || project.revenueModel;
        project.funding = req.body.funding || project.funding;

        // Docs
        project.scheduleUrl = req.body.scheduleUrl || project.scheduleUrl;
        project.boqUrl = req.body.boqUrl || project.boqUrl;

        // Phase Adjustments
        if (req.body.phaseAdjustments !== undefined) {
            project.phaseAdjustments = req.body.phaseAdjustments;
        }

        const updatedProject = await project.save();
        res.json(updatedProject);
    } else {
        res.status(404);
        throw new Error("Project not found");
    }
});

// @desc    Update project telemetry
// @route   POST /api/projects/:id/telemetry
// @access  Public
const updateProjectTelemetry = asyncHandler(async (req, res) => {
    const { month, actualSpend, activeResources } = req.body;
    const project = await Project.findById(req.params.id);

    if (project) {
        // Find if month already exists
        const index = project.telemetry.findIndex(t => t.month === month);
        
        if (index !== -1) {
            // Update existing record
            project.telemetry[index].actualSpend = actualSpend;
            project.telemetry[index].activeResources = activeResources;
        } else {
            // Add new record
            project.telemetry.push({ month, actualSpend, activeResources });
        }

        const updatedProject = await project.save();
        res.json(updatedProject);
    } else {
        res.status(404);
        throw new Error("Project not found");
    }
});

// @desc    Update project telemetry bulk
// @route   POST /api/projects/:id/telemetry/bulk
// @access  Public
const updateProjectTelemetryBulk = asyncHandler(async (req, res) => {
    const { telemetry } = req.body; // Expects array of { month, actualSpend, activeResources }
    const project = await Project.findById(req.params.id);

    if (project) {
        if (!Array.isArray(telemetry)) {
            res.status(400);
            throw new Error("Telemetry data must be an array");
        }

        // Overwrite or Merge? Let's merge/update based on month
        telemetry.forEach(newEntry => {
            const index = project.telemetry.findIndex(t => t.month === newEntry.month);
            if (index !== -1) {
                project.telemetry[index].actualSpend = newEntry.actualSpend;
                project.telemetry[index].activeResources = newEntry.activeResources;
            } else {
                project.telemetry.push(newEntry);
            }
        });

        const updatedProject = await project.save();
        res.json(updatedProject);
    } else {
        res.status(404);
        throw new Error("Project not found");
    }
});

// @desc    Auto-fill telemetry for all projects (Demo Utility)
// @route   POST /api/projects/bulk/auto-fill-telemetry
// @access  Public
const autoFillTelemetryAll = asyncHandler(async (req, res) => {
    const projects = await Project.find({});
    const now = new Date();

    for (const project of projects) {
        const start = new Date(project.startDate);
        let current = new Date(start.getFullYear(), start.getMonth(), 1);
        const monthlyBudget = (Number(project.budget) || 120000) / 12;

        // For completed projects, cap at dueDate; for ongoing, cap at today
        const isCompleted = project.status === "Completed" ||
            (project.dueDate && now > new Date(project.dueDate));
        const loopEnd = isCompleted && project.dueDate
            ? new Date(new Date(project.dueDate).getFullYear(), new Date(project.dueDate).getMonth(), 1)
            : new Date(now.getFullYear(), now.getMonth(), 1);

        while (current <= loopEnd) {
            // Use 'en-US' locale to match frontend format ("Aug 2025")
            const monthLabel = current.toLocaleString('en-US', { month: 'short', year: 'numeric' });
            
            // Only add if not already present (check both en-US and any old numeric format)
            const exists = project.telemetry.find(t => t.month === monthLabel);
            if (!exists) {
                const variance = 0.8 + (Math.random() * 0.4);
                const actualSpend = Math.round(monthlyBudget * variance);
                const activeResources = Math.floor((Number(project.teamSize) || 10) * (0.8 + Math.random() * 0.4));

                project.telemetry.push({
                    month: monthLabel,
                    actualSpend: actualSpend,
                    activeResources: activeResources,
                    timestamp: new Date(current)
                });
            }
            current.setMonth(current.getMonth() + 1);
        }
        await project.save();
    }

    res.json({ message: "Telemetry auto-filled for all projects" });
});


export { getProjects, getProjectById, createProject, deleteProject, updateProject, updateProjectTelemetry, updateProjectTelemetryBulk, autoFillTelemetryAll };
