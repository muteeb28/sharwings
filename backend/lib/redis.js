import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config();

const redisUrl = process.env.UPSTASH_REDIS_URL;
const useRedisFlag = process.env.USE_REDIS;
const disableRedis = useRedisFlag === "false" || process.env.DISABLE_REDIS === "true";
const isProduction = process.env.NODE_ENV === "production" || Boolean(process.env.VERCEL);
const useRedis = !disableRedis && (useRedisFlag === "true" || isProduction);
const shouldUseRedis = useRedis && Boolean(redisUrl);

const createInMemoryStore = () => {
    const store = new Map();
    return {
        get: async (key) => (store.has(key) ? store.get(key) : null),
        set: async (key, value, mode, ttlSeconds) => {
            store.set(key, value);
            if (mode === "EX" && Number.isFinite(ttlSeconds)) {
                const timeout = setTimeout(() => store.delete(key), ttlSeconds * 1000);
                if (typeof timeout.unref === "function") {
                    timeout.unref();
                }
            }
            return "OK";
        },
        del: async (key) => (store.delete(key) ? 1 : 0),
        on: () => {},
        quit: async () => {},
        disconnect: () => {},
    };
};

export const redis = shouldUseRedis ? new Redis(redisUrl) : createInMemoryStore();

if (shouldUseRedis) {
    redis.on("error", (err) => {
        console.error("Redis connection error:", err.message);
    });
} else if (useRedis && !redisUrl) {
    console.warn("UPSTASH_REDIS_URL is not set; using in-memory cache.");
} else {
    console.warn("Redis disabled (set USE_REDIS=true to enable).");
}
