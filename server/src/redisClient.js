// server/redisClient.js
const Redis = require('ioredis');

let redis;

if (process.env.REDIS_URL) {
  // Option A: Real Redis (Upstash/Render)
  console.log("🔌 Found REDIS_URL. Connecting...");
  redis = new Redis(process.env.REDIS_URL, {
    tls: { rejectUnauthorized: false }, 
    maxRetriesPerRequest: null
  });

  redis.on('error', (err) => {
    // Silence errors so they don't crash the app
    console.error('⚠️ Redis error (switched to safe mode):', err.message);
    redis.status = 'disabled';
  });
} else {
  // Option B: No Redis (Safe Mode)
  console.log("⚠️ No REDIS_URL found. Running in 'Safe Mode' (Database only).");
  redis = {
      status: 'disabled',
      get: async () => null,
      set: async () => {},
      del: async () => {},
      on: () => {}
  };
}

module.exports = redis;