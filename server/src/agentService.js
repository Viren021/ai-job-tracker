const { ChatGoogleGenerativeAI } = require("@langchain/google-genai");
const { HumanMessage, SystemMessage, AIMessage } = require("@langchain/core/messages");
const { StateGraph, END } = require("@langchain/langgraph");
const { PrismaClient } = require('@prisma/client');
const { fetchExternalJobs } = require('./jobService');

// ---------------------------------------------------------
// 🚨 FIX: USE SAFE REDIS CLIENT (NO IOREDIS)
// ---------------------------------------------------------
// This prevents the "ECONNRESET" crash by using your safe wrapper.
const redis = require('./redisClient'); 

const prisma = new PrismaClient();

// 1. Setup Gemini (Using Gemini 2.5 Flash as requested)
const chatModel = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash-lite", 
  apiKey: process.env.GOOGLE_API_KEY,
  temperature: 0,
});

// 2. Define Tools Logic
const executeTools = async (query) => {
  // A. FETCH & SEARCH
  if (query.includes("FETCH_AND_SEARCH")) {
    const match = query.match(/"([^"]*)"/);
    const term = match ? match[1] : "Developer";
    
    console.log(`🤖 Graph Agent fetching: ${term}`);
    const newJobs = await fetchExternalJobs(term);
    
    if (newJobs.length > 0) {
      // Save jobs to DB
      await prisma.job.createMany({ data: newJobs, skipDuplicates: true });
      // Clear cache safely (won't crash if redis is disabled)
      await redis.del('jobs:all'); 
    }
    return JSON.stringify({ 
      reply: `I've updated the feed with the latest ${term} jobs!`, 
      action: { type: 'REFRESH_FEED' } 
    });
  }

  // B. GET APPLICATIONS
  if (query.includes("GET_APPLICATIONS")) {
    const apps = await prisma.application.findMany({ take: 5, orderBy: { appliedAt: 'desc' } });
    if (apps.length === 0) return JSON.stringify({ reply: "No applications found." });
    return JSON.stringify({ reply: `You have applied to: ${apps.map(a => a.jobTitle).join(", ")}` });
  }

  // C. UPDATE FILTER
  if (query.includes("UPDATE_FILTER")) {
    const args = query.match(/"([^"]*)"/g);
    if (args && args.length >= 2) {
        const filter = args[0].replace(/"/g, '');
        const value = args[1].replace(/"/g, '');
        return JSON.stringify({ 
        reply: `Filtering for ${value}...`, 
        action: { type: 'UPDATE_FILTER', filter, value } 
        });
    }
  }

  return JSON.stringify({ reply: "I couldn't process that tool command." });
};

// 3. Define the Graph State
// LangGraph state definition
const graphState = {
  messages: {
    value: (x, y) => x.concat(y),
    default: () => [],
  },
};

// 4. Define Nodes

// Node A: The Brain (Agent)
const agentNode = async (state) => {
  const { messages } = state;
  const lastMessage = messages[messages.length - 1];

  const systemPrompt = `
    You are an intelligent Career Assistant. 
    
    INSTRUCTIONS:
    1. FILTER RULE (Priority High):
       - If user asks for "Internships", "Contract", or "Full-time" roles, 
         output strictly: CALL: UPDATE_FILTER("type", "Internship") 
         (or "Contract" / "Full-time" accordingly).
         
    2. FILTER RULE (Remote):
       - If user asks for "Remote" or "Work from home", 
         output strictly: CALL: UPDATE_FILTER("location", "Remote")

    3. SEARCH RULE:
       - If user asks for a specific job title (e.g. "Find Java jobs", "Search for Backend"),
         output strictly: CALL: FETCH_AND_SEARCH("job title")
    
    4. HISTORY RULE:
       - If user asks about their own history (e.g. "What did I apply to?"), 
         output strictly: CALL: GET_APPLICATIONS()

    - Otherwise, answer normally.
  `;

  try {
    const response = await chatModel.invoke([
      new SystemMessage(systemPrompt),
      ...messages
    ]);
    return { messages: [response] };

  } catch (error) {
    console.error("Agent Error:", error.message);
    return { messages: [new AIMessage("I'm having trouble connecting to AI right now.")] };
  }
};

// Node B: The Hands (Tool Executor)
const toolNode = async (state) => {
  const { messages } = state;
  const lastMessage = messages[messages.length - 1];
  const toolResult = await executeTools(lastMessage.content);
  return { messages: [new AIMessage(toolResult)] };
};

// 5. Define Edges (Routing Logic)
const shouldContinue = (state) => {
  const { messages } = state;
  const lastMessage = messages[messages.length - 1];

  if (lastMessage.content.includes("CALL:")) {
    return "tools";
  }
  return END;
};

// 6. Build the Graph
const workflow = new StateGraph({ channels: graphState })
  .addNode("agent", agentNode)
  .addNode("tools", toolNode)
  .setEntryPoint("agent")
  .addConditionalEdges("agent", shouldContinue, {
    tools: "tools",
    [END]: END,
  })
  .addEdge("tools", END);

const app = workflow.compile();

// 7. Export Handler for Fastify
async function handleChat(userMessage) {
  try {
    const result = await app.invoke({ messages: [new HumanMessage(userMessage)] });
    const finalMsg = result.messages[result.messages.length - 1].content;
    
    try {
      return JSON.parse(finalMsg);
    } catch {
      return { reply: finalMsg };
    }
  } catch (err) {
      console.error("Graph Error:", err);
      return { reply: "I am having a temporary brain freeze. Please try again." };
  }
}

module.exports = { handleChat };