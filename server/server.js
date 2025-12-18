import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";

dotenv.config();

console.log("\n==================================");
console.log("!!! SCHEDRA SERVER BOOTED !!!");
console.log("!!! TIMESTAMP: " + new Date().toISOString() + " !!!");
console.log("GEMINI_API_KEY:", process.env.GEMINI_API_KEY ? `PRESENT (${process.env.GEMINI_API_KEY.substring(0, 6)}...)` : "!!! MISSING !!!");
console.log("==================================\n");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
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

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
