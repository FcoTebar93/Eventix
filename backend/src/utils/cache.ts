import { getRedisClient } from '../lib/redis';

const CACHE_TTL = 300;

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

const FAV_TTL = 60;

export function getFavoriteCacheKey(userId: string, eventId: string): string {
    return `fav:${userId}:${eventId}`;
}

export async function getFavoriteFromCache(userId: string, eventId: string): Promise<boolean | null> {
    const key = getFavoriteCacheKey(userId, eventId);
    const raw = await getFromCache<string>(key);
    if (raw === null) return null;
    return raw === '1';
}

export async function setFavoriteCache(userId: string, eventId: string, isFavorite: boolean): Promise<void> {
    const key = getFavoriteCacheKey(userId, eventId);
    await setCache(key, isFavorite ? '1' : '0', FAV_TTL);
}

export async function getFromCache<T>(key: string): Promise<T | null> {
    try {
        const redis = getRedisClient();
        const data = await redis.get(key);
        return data ? JSON.parse(data) : null;
    } catch {
        return null;
    }
}

export async function setCache(key: string, value: unknown, ttlSeconds: number = CACHE_TTL): Promise<void> {
    try {
        const redis = getRedisClient();
        await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch (error) {
        console.error('Error al setear el cache:', error instanceof Error ? error.message : error);
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
        console.error('Error al eliminar el cache:', error instanceof Error ? error.message : error);
    }
}

const EVENTS_CACHE_PATTERN = 'event*';

export async function clearEventsCache(): Promise<void> {
    await deleteCache(EVENTS_CACHE_PATTERN);
}