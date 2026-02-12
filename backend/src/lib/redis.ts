import Redis from 'ioredis';
import { env } from '../config/env';
import { logger } from '../utils/logger';

let redis: Redis | null = null;

export const getRedisClient = (): Redis => {
    if (!redis) {
        redis = new Redis(env.REDIS_URL, {
            maxRetriesPerRequest: 3,
            retryStrategy(times: number) {
                return Math.min(times * 50, 2000);
            },
        });

        redis.on('error', (error) => {
            logger.error('Redis error:', error);
        });

        redis.on('connect', () => {
            logger.info('✅ Redis connected');
        });
    }

    return redis;
};

export const closeRedisConnection = async (): Promise<void> => {
    if (redis) {
        await redis.quit();
        redis = null;
    }
};