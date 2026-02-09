require('dotenv').config();
const fastify = require('fastify')({ logger: true });
const cors = require('@fastify/cors');
const multipart = require('@fastify/multipart');
const { PrismaClient } = require('@prisma/client');
const pdf = require('pdf-parse'); 

// ---------------------------------------------------------
// 🔌 SAFE REDIS IMPORT
// ---------------------------------------------------------
// This uses your new redisClient.js file. 
// It automatically handles connection errors or switches to "Safe Mode".
const redis = require('./redisClient');

// Import your services
const { scoreJobsBatch } = require('./aiService'); 
const { handleChat } = require('./agentService');
const { fetchExternalJobs } = require('./jobService'); 

const prisma = new PrismaClient();

// ---------------------------------------------------------
// 🔄 SMART CACHING GLOBALS
// ---------------------------------------------------------
let LOADING_PROMISE = null; 

fastify.register(cors, { 
  origin: true, 
  credentials: true 
});
fastify.register(multipart);

// ---------------------------------------------------------
// 1. Auth & Profile (MANDATORY FOR ASSIGNMENT)
// ---------------------------------------------------------

// A. Fake Login (Updated for Mobile)
fastify.post('/login', async (req, reply) => {
  const { email, password } = req.body;

  // 🛡️ MOBILE FIX: Sanitize Input
  // Phones often add capital letters or spaces at the end. We fix that here.
  const cleanEmail = email ? email.toLowerCase().trim() : '';
  const cleanPassword = password ? password.trim() : '';

  if (cleanEmail === 'test@gmail.com' && cleanPassword === 'test@123') {
    return { success: true, token: 'fake-jwt-token-123' };
  }
  return reply.status(401).send({ success: false, error: 'Invalid credentials' });
});

// B. Check Profile
fastify.get('/profile', async (req, reply) => {
  const user = await prisma.user.findUnique({ where: { email: 'test@gmail.com' } });
  return { 
    email: 'test@gmail.com', 
    hasResume: !!(user && user.resumeText) 
  };
});

// ---------------------------------------------------------
// 2. Upload Resume
// ---------------------------------------------------------
fastify.post('/upload-resume', async (req, reply) => {
  try {
    const data = await req.file();
    if (!data) return reply.status(400).send({ error: "No file uploaded" });

    const buffer = await data.toBuffer();
    const pdfData = await pdf(buffer);
    const resumeText = pdfData.text;

    // Save to DB
    await prisma.user.upsert({
      where: { email: 'test@gmail.com' },
      update: { resumeText: resumeText },
      create: { email: 'test@gmail.com', password: 'test@123', resumeText: resumeText }
    });

    // Clear cache
    await redis.del('jobs:all'); 
    console.log("🔄 Resume updated.");

    return { status: 'success', message: 'Resume parsed & saved!' };

  } catch (err) {
    console.error("Upload Error:", err);
    return reply.status(500).send({ error: "Failed to parse PDF" });
  }
});

// ---------------------------------------------------------
// 3. Get Jobs (Direct DB + AI Scoring)
// ---------------------------------------------------------
fastify.get('/jobs', async (req, reply) => {
  const cacheKey = 'jobs:all';

  // A. Cache Check
  // If Redis is disabled (Safe Mode), this simply returns null and skips to DB
  const cachedJobs = await redis.get(cacheKey);
  if (cachedJobs) return JSON.parse(cachedJobs);

  // B. If Loading, Wait (Prevent Stampede)
  if (LOADING_PROMISE) {
    console.log("⏳ Waiting for ongoing AI scoring...");
    return await LOADING_PROMISE;
  }

  // C. Fetch & Score (The Heavy Lift)
  console.log("🤖 Calculating AI Scores...");
  
  LOADING_PROMISE = (async () => {
    try {
      const user = await prisma.user.findUnique({ where: { email: 'test@gmail.com' } });
      let jobs = await prisma.job.findMany({ orderBy: { postedAt: 'desc' }, take: 50 });

      // If no resume, return jobs with 0 score
      if (!user || !user.resumeText) {
        return jobs.map(j => ({ ...j, matchScore: 0, matchReason: "Upload resume to see score" }));
      }

      // --- THE AI MAGIC ---
      const scoresMap = await scoreJobsBatch(user.resumeText, jobs);

      // Merge Scores into Jobs
      const finalJobs = jobs.map(job => {
        const scoreData = scoresMap[job.id] || { score: 0, reason: "N/A" };
        return { 
          ...job, 
          matchScore: scoreData.score, 
          matchReason: scoreData.reason 
        };
      });

      // Sort by High Score first!
      finalJobs.sort((a, b) => b.matchScore - a.matchScore);

      // Save to Cache (If Redis is active)
      await redis.set(cacheKey, JSON.stringify(finalJobs), 'EX', 3600);

      return finalJobs;

    } catch (err) {
      console.error("Job Fetch Error:", err);
      return []; 
    } finally {
      LOADING_PROMISE = null;
    }
  })();

  return await LOADING_PROMISE;
});

// ---------------------------------------------------------
// 4. Chat & Applications
// ---------------------------------------------------------
fastify.post('/chat', async (req, reply) => {
  const { message } = req.body || {};
  if (!message) return reply.status(400).send({ error: "Message is required" });
  return await handleChat(message);
});

fastify.post('/applications', async (req, reply) => {
  const { jobId, jobTitle, company, status } = req.body;
  const user = await prisma.user.findUnique({ where: { email: 'test@gmail.com' } });
  
  if (!user) return reply.status(404).send({ error: "User not found" });

  try {
    const application = await prisma.application.upsert({
       where: { userId_jobId: { userId: user.id, jobId: jobId } },
       update: { status: status || "Applied" },
       create: {
         userId: user.id,
         jobId: jobId,
         jobTitle, 
         company, 
         status: status || "Applied"
       }
    });
    return application;
  } catch (err) {
    console.error(err);
    return reply.status(500).send({ error: "Failed to save application" });
  }
});

fastify.get('/applications', async (req, reply) => {
  return await prisma.application.findMany({ orderBy: { appliedAt: 'desc' } });
});

// ---------------------------------------------------------
// 5. Seed Route
// ---------------------------------------------------------
fastify.post('/seed', async (req, reply) => {
  try {
    await prisma.application.deleteMany({}); 
    await prisma.job.deleteMany({});
    await redis.del('jobs:all'); 

    const realJobs = await fetchExternalJobs('software engineer');
    if (realJobs.length === 0) return { message: "Failed to fetch jobs." };

    await prisma.job.createMany({ data: realJobs });

    return { message: `✅ Reset complete. Seeded ${realJobs.length} jobs.` };
  } catch (err) {
    console.error(err);
    return reply.status(500).send({ error: "Seed failed" });
  }
});

const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: '0.0.0.0' });
    console.log('🚀 Server running on http://localhost:3000');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();