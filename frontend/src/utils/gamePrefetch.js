import { startGame } from '../api/gameApi';

const PREFETCH_CACHE = {
    EASY: [],
    MEDIUM: [],
    HARD: [],
    DAILY: []
};

const MAX_CACHE_SIZE = 3;

/**
 * Prefetches words for a specific level and stores them in memory.
 */
export const prefetchLevelData = async (level) => {
    const upperLevel = level.toUpperCase();
    if (PREFETCH_CACHE[upperLevel].length >= MAX_CACHE_SIZE) return;

    try {
        const data = await startGame({ level: upperLevel });
        PREFETCH_CACHE[upperLevel].push(data);
        console.log(`[Prefetch] Cached word set for ${upperLevel}`);
    } catch (err) {
        console.warn(`[Prefetch] Failed for ${upperLevel}`, err);
    }
};

/**
 * Gets prefetched data for a level if available, otherwise returns null.
 */
export const getPrefetchedData = (level) => {
    const upperLevel = level.toUpperCase();
    if (PREFETCH_CACHE[upperLevel].length > 0) {
        return PREFETCH_CACHE[upperLevel].shift();
    }
    return null;
};

/**
 * Triggers prefetch for all common levels.
 */
export const prefetchAllLevels = () => {
    // stagger them to avoid overwhelming the single-threaded dev server or network
    setTimeout(() => prefetchLevelData('EASY'), 1000);
    setTimeout(() => prefetchLevelData('MEDIUM'), 2000);
    setTimeout(() => prefetchLevelData('HARD'), 3000);
    setTimeout(() => prefetchLevelData('DAILY'), 4000);
};
