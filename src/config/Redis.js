/**
 * Redis Connection Manager
 *
 * Redis use hoga:
 * 1. Caching (products, categories)
 * 2. Session storage
 * 3. OTP storage
 * 4. Rate limiting
 * 5. BullMQ queues
 *
 * Do alag connections:
 * - redisClient    → General use (cache, OTP, sessions)
 * - redisForBullMQ → Sirf BullMQ queues ke liye (alag rakhna best practice hai)
 */

const { createClient } = require("redis");
const { env } = require("./env");
const logger = require("../utils/logger");

// Redis connection config
const redisConfig = {
  socket: {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    // Connection drop hone par dobara try karo
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        logger.error("Redis: Too many reconnect attempts. Giving up.");
        return new Error("Redis reconnect limit reached");
      }
      // Exponential backoff: 100ms, 200ms, 400ms... max 3000ms
      const delay = Math.min(100 * Math.pow(2, retries), 3000);
      logger.warn(`Redis reconnecting in ${delay}ms... (attempt ${retries})`);
      return delay;
    },
  },
};

// Agar password set hai to add karo
if (env.REDIS_PASSWORD) {
  redisConfig.password = env.REDIS_PASSWORD;
}

// Main Redis client
const redisClient = createClient(redisConfig);

redisClient.on("connect", () => {
  logger.info(" Redis connected");
});

redisClient.on("error", (err) => {
  logger.error(` Redis error: ${err.message}`);
});

redisClient.on("reconnecting", () => {
  logger.warn(" Redis reconnecting...");
});

// BullMQ ke liye alag connection
// BullMQ apna connection khud manage karta hai
// isliye hum sirf options dete hain
const bullMQRedisOptions = {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  ...(env.REDIS_PASSWORD && { password: env.REDIS_PASSWORD }),
  maxRetriesPerRequest: null, // BullMQ requirement
  enableReadyCheck: false,    // BullMQ requirement
};

async function connectRedis() {
  try {
    await redisClient.connect();
    logger.info(" Redis client ready");
  } catch (error) {
    logger.error(` Redis connection failed: ${error.message}`);
    // Redis failure mein server band mat karo
    // Gracefully degrade karo (cache miss hoga, DB se lega)
    logger.warn(" Continuing without Redis cache...");
  }
}

async function disconnectRedis() {
  try {
    await redisClient.quit();
    logger.info("Redis connection closed gracefully");
  } catch (error) {
    logger.error(`Error closing Redis: ${error.message}`);
  }
}

module.exports = {
  redisClient,
  bullMQRedisOptions,
  connectRedis,
  disconnectRedis,
};