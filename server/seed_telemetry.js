import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Project from './models/Project.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/schedra';

const seedTelemetry = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const projects = await Project.find();
        console.log(`Found ${projects.length} projects`);

        for (const project of projects) {
            const start = new Date(project.startDate);
            const end = new Date(); // Up to today
            const telemetry = [];

            let current = new Date(start.getFullYear(), start.getMonth(), 1);
            const monthlyBudget = project.budget / 12;

            while (current <= end) {
                const monthLabel = current.toLocaleString('default', { month: 'short', year: 'numeric' });
                
                // Only add if not already present
                if (!project.telemetry.find(t => t.month === monthLabel)) {
                    // Generate some realistic random data
                    // Vary between 80% and 110% of monthly average
                    const variance = 0.8 + (Math.random() * 0.3);
                    const actualSpend = Math.round(monthlyBudget * variance);
                    const activeResources = Math.floor(project.teamSize * (0.7 + Math.random() * 0.5)) || 5;

                    telemetry.push({
                        month: monthLabel,
                        actualSpend: actualSpend,
                        activeResources: activeResources,
                        timestamp: new Date(current)
                    });
                }
                current.setMonth(current.getMonth() + 1);
            }

            if (telemetry.length > 0) {
                project.telemetry = [...project.telemetry, ...telemetry];
                await project.save();
                console.log(`Updated telemetry for project: ${project.name} (+${telemetry.length} months)`);
            } else {
                console.log(`Telemetry already up to date for project: ${project.name}`);
            }
        }

        console.log('Seed completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding telemetry:', error);
        process.exit(1);
    }
};

seedTelemetry();
