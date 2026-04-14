import mongoose from "mongoose";

const projectSchema = mongoose.Schema(
    {
        projectId: {
            type: String,
            required: true,
            unique: true,
        },
        name: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: ["Planning", "In Progress", "Delayed", "Completed", "On Hold", "Archived"],
            default: "Planning",
        },
        riskLevel: {
            type: String,
            enum: ["Low", "Medium", "High", "Critical"],
            default: "Low",
        },
        progress: {
            type: Number,
            default: 0,
            min: 0,
            max: 100,
        },
        type: {
            type: String,
            enum: ["IT", "Infrastructure", "Startup", "Other"],
            required: true,
        },
        description: String,
        startDate: {
            type: Date,
            required: true,
        },
        dueDate: {
            type: Date,
            required: true,
        },
        budget: {
            type: Number,
            required: true,
        },
        manager: String,
        client: String,

        // IT Fields
        techStack: String,
        teamSize: Number,
        modules: String,
        repoLink: String,
        methodology: {
            type: String,
            enum: ["Agile", "Scrum", "Waterfall", "Kanban", "Other"],
        },
        expectedLoad: String,
        integrationReq: String,

        // Infrastructure Fields
        subType: {
            type: String, // e.g., Substation, Transmission Line
        },
        region: String,
        capacity: String,
        terrain: {
            type: String,
            enum: ["Plain", "Hilly", "Forest", "Coastal", "Desert", "Urban"],
        },
        contractor: String,
        landStatus: {
            type: String,
            enum: ["Completed", "Partial", "Pending"],
            default: "Pending",
        },
        envStatus: {
            type: String,
            enum: ["Approved", "In Process", "Not Started"],
            default: "Not Started",
        },
        equipment: String,
        permits: String,

        // Startup Fields
        startupStage: {
            type: String,
            enum: ["Idea", "Prototype", "MVP", "Revenue"],
        },
        industrySector: String,
        founders: String,
        targetMarket: String,
        gtmPlan: String,
        revenueModel: String,
        funding: String,

        scheduleUrl: String,
        boqUrl: String,

        telemetry: [{
            month: String, // format "MMM YYYY" e.g. "Jan 2024"
            actualSpend: Number,
            activeResources: Number,
            timestamp: { type: Date, default: Date.now }
        }]
    },
    {
        timestamps: true,
    }
);

const Project = mongoose.model("Project", projectSchema);

export default Project;
