import { getRedisClient } from '../lib/redis';
import { logger } from './logger';

const CACHE_TTL = 60 * 60 * 24; // Dura 1 día entero

export function getEventsListCacheKey(params: { 
    page?: number;
    limit?: number;
    status?: string;
    category?: string;
    city?: string;
    search?: string;
    dateFrom?: string;
    dateTo?: string;
    tags?: string;
    }): string {
        const parts = ['events:list'];
        if (params.page) parts.push(`page:${params.page}`);
        if (params.limit) parts.push(`limit:${params.limit}`);
        if (params.status) parts.push(`status:${params.status}`);
        if (params.category) parts.push(`category:${params.category}`);
        if (params.city) parts.push(`city:${params.city}`);
        if (params.search) parts.push(`search:${params.search}`);
        if (params.dateFrom) parts.push(`dateFrom:${params.dateFrom}`);
        if (params.dateTo) parts.push(`dateTo:${params.dateTo}`);
        if (params.tags) parts.push(`tags:${params.tags}`);
        
        return parts.join(':');
}

export function getEventCacheKey(eventId: string): string {
    return `event:${eventId}`;
}

export async function getFromCache<T>(key: string): Promise<T | null> {
    try {
        const redis = getRedisClient();
        const data = await redis.get(key);
        
        if (!data) {
            return null;
        }

        return data ? JSON.parse(data) : null;
    } catch (error) {
        logger.error('Error al obtener el valor del cache:', error);
        return null;
    }
}

export async function setCache(key: string, value: unknown, ttlSeconds: number = CACHE_TTL): Promise<void> {
    try {
        const redis = getRedisClient();
        await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch (error) {
        logger.error('Error al guardar en cache:', error);
    }
}

export async function deleteCache(pattern: string): Promise<void> {
    try {
        const redis = getRedisClient();
        const keys: string[] = [];
        let cursor = '0';
        
        do {
            const result = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
            cursor = result[0];
            keys.push(...result[1]);
        } while (cursor !== '0');
        
        if (keys.length > 0) {
            await redis.del(...keys);
        }
    } catch (error) {
        logger.error('Error al eliminar del cache:', error);
    }
}

export async function clearEventsCache(): Promise<void> {
    try {
        const redis = getRedisClient();
        const listKeys = await redis.keys('events:list:*');
        const eventKeys = await redis.keys('event:*');
        const allKeys = [...listKeys, ...eventKeys];
        if (allKeys.length > 0) {
            await redis.del(...allKeys);
            logger.info(`Cache de eventos limpiado: ${allKeys.length} claves eliminadas`);
        }
    } catch (error) {
        logger.error('Error al limpiar el cache de eventos:', error);
    }
}