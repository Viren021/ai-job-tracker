require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

async function listModels() {
  try {
    console.log("🔍 Scanning for available models...");
    const model = genAI.getGenerativeModel({ model: "gemini-pro" }); 
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GOOGLE_API_KEY}`
    );
    const data = await response.json();

    if (data.models) {
      console.log("\n✅ AVAILABLE MODELS (Copy one of these):");
      console.log("-----------------------------------------");
      data.models.forEach(m => {
        if (m.name.includes("gemini")) {
            console.log(`Model: ${m.name.replace("models/", "")}`);
            console.log(`   --> Limit: ${m.inputTokenLimit} tokens`);
        }
      });
      console.log("-----------------------------------------\n");
    } else {
      console.log("❌ No models found. Check API Key.");
      console.log(data);
    }
  } catch (error) {
    console.error("Error:", error.message);
  }
}

listModels();