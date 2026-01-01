import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: (origin, callback) => {
        const allowedOrigins = [
            "https://schedra-predict-plan-deliver-client.vercel.app",
            "http://localhost:5173",
            "http://localhost:5000"
        ];

        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith(".vercel.app") || origin.includes("localhost") || origin.includes("127.0.0.1")) {
            return callback(null, true);
        } else {
            return callback(new Error('Not allowed by CORS'));
        }
    },
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
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`Local link: http://localhost:${PORT}`);
    });
}
