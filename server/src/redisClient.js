const Redis = require('ioredis');

let redis;

if (process.env.REDIS_URL) {
  // Option A: Real Redis
  redis = new Redis(process.env.REDIS_URL, {
    tls: { rejectUnauthorized: false }, 
    maxRetriesPerRequest: null
  });
  
  redis.on('error', (err) => {
    console.error('⚠️ Redis error (switched to safe mode):', err.message);
    redis.status = 'disabled';
  });
} else {
  // Option B: Safe Mode (No Redis)
  console.log("⚠️ No REDIS_URL found. Running in 'Safe Mode'.");
  redis = {
      status: 'disabled',
      get: async () => null,
      set: async () => {},
      del: async () => {},
      on: () => {}
  };
}

module.exports = redis;