
import dotenv from "dotenv";
import fs from "fs";
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

async function checkModels() {
    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.models) {
            const names = data.models.map(m => m.name).join("\n");
            fs.writeFileSync("models_list_new.txt", names);
            console.log("Wrote models to models_list_new.txt");
        } else {
            console.log("No models found or error:", JSON.stringify(data, null, 2));
        }
    } catch (error) {
        console.error("Fetch error:", error.message);
    }
}

checkModels();
