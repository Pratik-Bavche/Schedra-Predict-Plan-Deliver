import express from "express";
const router = express.Router();
import { runPrediction } from "../controllers/mlController.js";
import { getAIAnalytics } from "../controllers/aiController.js";

router.post("/", runPrediction);
router.post("/ai", getAIAnalytics);

export default router;
