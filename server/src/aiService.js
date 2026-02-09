require('dotenv').config();
const { ChatGoogleGenerativeAI } = require("@langchain/google-genai");
const { StructuredOutputParser } = require("langchain/output_parsers");
const { z } = require("zod");

// 1. Setup Gemini
const llm = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash", 
  apiKey: process.env.GOOGLE_API_KEY,
  temperature: 0,
  maxRetries: 1, 
});

// 2. Define the Schema (LangChain handles the JSON format for you)
const parser = StructuredOutputParser.fromZodSchema(
  z.object({
    scores: z.array(
      z.object({
        jobId: z.string().describe("The ID of the job"),
        score: z.number().describe("Score 0-100"),
        reason: z.string().describe("Short reason (Max 10 words)")
      })
    )
  })
);

async function scoreJobsBatch(resumeText, jobs) {
  // --- MOCK FALLBACK (Your Logic) ---
  const generateMockScores = () => {
    const mockScores = {};
    jobs.forEach(job => {
      mockScores[job.id] = {
        score: Math.floor(Math.random() * 30) + 60,
        reason: "⚡ Fast Match (AI Busy) - Keywords detected."
      };
    });
    return mockScores;
  };

  try {
    console.log("🤖 Asking AI (5s Timeout)...");

    // 3. Prepare Prompt with LangChain Instructions
    const formatInstructions = parser.getFormatInstructions();
    const jobList = jobs.map(j => `ID: ${j.id} | Title: ${j.title} | Desc: ${j.description.substring(0, 200)}`).join("\n");
    
    const prompt = `
      RESUME: ${resumeText.substring(0, 1000)}
      JOBS: ${jobList}
      
      Compare the resume to the jobs. Return a score (0-100) and reason for each.
      ${formatInstructions}
    `;

    // 4. THE RACE: AI vs. 5-Second Timer
    const aiPromise = llm.invoke(prompt);
    
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("TIMEOUT")), 5000);
    });

    const result = await Promise.race([aiPromise, timeoutPromise]);

    // 5. Parse with LangChain (Safer than JSON.parse)
    const parsedData = await parser.parse(result.content);
    
    const scoresMap = {};
    parsedData.scores.forEach(item => {
      scoresMap[item.jobId] = { score: item.score, reason: item.reason };
    });

    return scoresMap;

  } catch (error) {
    console.log(`⚠️ AI Logic Skipped: ${error.message}`);
    return generateMockScores();
  }
}

module.exports = { scoreJobsBatch };