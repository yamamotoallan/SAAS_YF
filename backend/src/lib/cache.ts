import NodeCache from 'node-cache';

// Standard TTL of 5 minutes (300 seconds)
const myCache = new NodeCache({ stdTTL: 300, checkperiod: 60 });

export const cache = {
    get: <T>(key: string): T | undefined => {
        return myCache.get<T>(key);
    },
    set: <T>(key: string, value: T, ttl?: number): boolean => {
        return ttl ? myCache.set(key, value, ttl) : myCache.set(key, value);
    },
    del: (key: string | string[]): number => {
        return myCache.del(key);
    },
    flush: () => {
        myCache.flushAll();
    }
};
