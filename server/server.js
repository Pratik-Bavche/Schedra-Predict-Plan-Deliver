import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true
}));
app.use(express.json());

// Database Connection
connectDB();

// Test Route
app.get("/", (req, res) => {
    res.send("Schedra API is running...");
});

// Routes
import projectRoutes from "./routes/projectRoutes.js";
import mlRoutes from "./routes/mlRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";

app.use("/api/projects", projectRoutes);
app.use("/api/predict", mlRoutes);
app.use("/api/analytics", analyticsRoutes);

// Error Handler
app.use((err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
    res.status(statusCode);
    res.json({
        message: err.message,
        stack: process.env.NODE_ENV === "production" ? null : err.stack,
    });
});

// Export for Vercel
export default app;

// Only listen if run directly (not imported as a module by Vercel)
// Only listen if run directly
if (process.env.NODE_ENV !== 'production') {
    const server = app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`Local link: http://localhost:${PORT}`);
    });

    server.on('error', (e) => {
        if (e.code === 'EADDRINUSE') {
            console.error(`\n\x1b[31mError: Port ${PORT} is already in use.\x1b[0m`);
            console.error(`\x1b[33mPossible fix:\x1b[0m Stop the other terminal/process running the server, or wait a few seconds.`);
            process.exit(1);
        } else {
            console.error(e);
        }
    });
}
