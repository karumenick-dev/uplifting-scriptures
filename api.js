/* ==========================================================================
   ES MODULE: SCRIPTURE DATA API (FETCH, CACHE, FILTER & SPREAD PAGINATION)
   ========================================================================== */

const DB_URL = './db.json';
let cachedVerses = null;

/**
 * Loads and caches all verses from db.json
 */
export async function loadAllVerses() {
    if (cachedVerses) {
        return cachedVerses;
    }

    const response = await fetch(DB_URL);
    if (!response.ok) {
        throw new Error(`Unable to load db.json (HTTP ${response.status})`);
    }

    const data = await response.json();
    cachedVerses = Array.isArray(data.verses) ? data.verses : [];
    return cachedVerses;
}

/**
 * Filters verses by emotional theme and/or testament ('OT' | 'NT')
 */
export async function getFilteredVerses({ theme = 'all', testament = 'all' } = {}) {
    const verses = await loadAllVerses();

    return verses.filter((verse) => {
        const themeMatch =
            theme === 'all' || verse.theme.toLowerCase() === theme.toLowerCase();
        const testamentMatch =
            testament === 'all' || verse.testament.toUpperCase() === testament.toUpperCase();

        return themeMatch && testamentMatch;
    });
}

/**
 * Returns a two-page spread (leftPage + rightPage) starting at spreadIndex
 */
export async function getBookSpread(spreadIndex = 0, filters = {}) {
    const list = await getFilteredVerses(filters);
    const totalVerses = list.length;

    if (totalVerses === 0) {
        return {
            leftPage: null,
            rightPage: null,
            spreadIndex: 0,
            totalSpreads: 0,
            totalVerses: 0
        };
    }

    const totalSpreads = Math.ceil(totalVerses / 2);
    const safeSpread = ((spreadIndex % totalSpreads) + totalSpreads) % totalSpreads;
    const startIdx = safeSpread * 2;

    return {
        leftPage: list[startIdx] || null,
        rightPage: list[startIdx + 1] || null,
        spreadIndex: safeSpread,
        totalSpreads,
        totalVerses
    };
}