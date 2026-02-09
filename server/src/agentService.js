const { ChatGoogleGenerativeAI } = require("@langchain/google-genai");
const { HumanMessage, SystemMessage, AIMessage } = require("@langchain/core/messages");
const { StateGraph, END } = require("@langchain/langgraph");
const { PrismaClient } = require('@prisma/client');
const { fetchExternalJobs } = require('./jobService');
const Redis = require('ioredis');

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// 1. Setup Gemini (Using Gemini 2.5 Flash as requested)
const chatModel = new ChatGoogleGenerativeAI({
  model: "gemini-2.5-flash-lite", 
  apiKey: process.env.GOOGLE_API_KEY,
  temperature: 0,
});

// 2. Define Tools Logic
const executeTools = async (query) => {
  // A. FETCH & SEARCH
  if (query.startsWith("CALL: FETCH_AND_SEARCH")) {
    const match = query.match(/"([^"]*)"/);
    const term = match ? match[1] : "Developer";
    
    console.log(`🤖 Graph Agent fetching: ${term}`);
    const newJobs = await fetchExternalJobs(term);
    
    if (newJobs.length > 0) {
      await prisma.job.createMany({ data: newJobs, skipDuplicates: true });
      await redis.del('jobs:all'); 
    }
    return JSON.stringify({ 
      reply: `I've updated the feed with the latest ${term} jobs!`, 
      action: { type: 'REFRESH_FEED' } 
    });
  }

  // B. GET APPLICATIONS
  if (query.startsWith("CALL: GET_APPLICATIONS")) {
    const apps = await prisma.application.findMany({ take: 5, orderBy: { appliedAt: 'desc' } });
    if (apps.length === 0) return JSON.stringify({ reply: "No applications found." });
    return JSON.stringify({ reply: `You have applied to: ${apps.map(a => a.jobTitle).join(", ")}` });
  }

  // C. UPDATE FILTER
  if (query.startsWith("CALL: UPDATE_FILTER")) {
    const args = query.match(/"([^"]*)"/g);
    const filter = args[0].replace(/"/g, '');
    const value = args[1].replace(/"/g, '');
    return JSON.stringify({ 
      reply: `Filtering for ${value}...`, 
      action: { type: 'UPDATE_FILTER', filter, value } 
    });
  }

  return JSON.stringify({ reply: "I couldn't process that tool command." });
};

// 3. Define the Graph State
const graphState = {
  messages: {
    value: (x, y) => x.concat(y),
    default: () => [],
  },
};

// 4. Define Nodes
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
         output strictly: CALL: UPDATE_FILTER("type", "Remote")

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
    
    if (error.status === 429 || error.status === 404 || error.message.includes('quota') || error.message.includes('not found')) {
        return { messages: [new AIMessage("FALLBACK_TRIGGERED: " + lastMessage.content)] };
    }
    return { messages: [new AIMessage("I'm having trouble thinking.")] };
  }
};

// Node B: The "Hands" (Tool Executor)
const toolNode = async (state) => {
  const { messages } = state;
  const lastMessage = messages[messages.length - 1];
  const toolResult = await executeTools(lastMessage.content);
  return { messages: [new AIMessage(toolResult)] };
};

// Node C: Fallback Handler (Circuit Breaker)
const fallbackNode = async (state) => {
    const { messages } = state;
    const userMsg = messages[messages.length - 1].content.replace("FALLBACK_TRIGGERED: ", "").toLowerCase();
    
    if (userMsg.includes("find") || userMsg.includes("search")) {
        const words = userMsg.split(' ');
        const keyTerm = words.find(w => !['find', 'search', 'jobs', 'me', 'for'].includes(w)) || 'Developer';
        
        console.log(`⚠️ AI Fallback searching for: ${keyTerm}`);
        const newJobs = await fetchExternalJobs(keyTerm);
        if (newJobs.length > 0) {
            await prisma.job.createMany({ data: newJobs, skipDuplicates: true });
            await redis.del('jobs:all');
        }

        return { messages: [new AIMessage(JSON.stringify({ 
            reply: `AI is resting, but I manually fetched ${keyTerm} jobs!`, 
            action: { type: 'REFRESH_FEED' } 
        }))] };
    }
    return { messages: [new AIMessage(JSON.stringify({ reply: "System is busy, try again later." }))] };
};

// 5. Define Edges (Routing Logic)
const shouldContinue = (state) => {
  const { messages } = state;
  const lastMessage = messages[messages.length - 1];

  if (lastMessage.content.startsWith("FALLBACK_TRIGGERED")) {
    return "fallback";
  }
  if (lastMessage.content.startsWith("CALL:")) {
    return "tools";
  }
  return END;
};

// 6. Build the Graph
const workflow = new StateGraph({ channels: graphState })
  .addNode("agent", agentNode)
  .addNode("tools", toolNode)
  .addNode("fallback", fallbackNode)
  .setEntryPoint("agent")
  .addConditionalEdges("agent", shouldContinue, {
    tools: "tools",
    fallback: "fallback",
    [END]: END,
  })
  .addEdge("tools", END)
  .addEdge("fallback", END);

const app = workflow.compile();

// 7. Export Handler for Fastify
async function handleChat(userMessage) {
  const result = await app.invoke({ messages: [new HumanMessage(userMessage)] });
  const finalMsg = result.messages[result.messages.length - 1].content;
  
  try {
    return JSON.parse(finalMsg);
  } catch {
    return { reply: finalMsg };
  }
}

module.exports = { handleChat };