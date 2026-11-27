/* ==========================================================================
   ES MODULE: SCRIPTURE DATA API
   ========================================================================== */

const DB_URL = './db.json';
let cachedVerses = null;

/**
 * Fetches and caches all scripture entries from db.json.
 * Schema per entry: { id, seasonLabel, title, reference, body }
 */
export async function loadAllVerses() {
    if (cachedVerses) {
        return cachedVerses;
    }

    const response = await fetch(DB_URL);
    if (!response.ok) {
        throw new Error(`Failed to load db.json (HTTP ${response.status})`);
    }

    const data = await response.json();
    cachedVerses = Array.isArray(data.verses) ? data.verses : [];
    return cachedVerses;
}

/**
 * Returns a sorted list of unique seasonLabel values from db.json.
 */
export async function getAvailableSeasons() {
    const verses = await loadAllVerses();
    const seasons = new Set();

    for (const verse of verses) {
        if (typeof verse.seasonLabel === 'string' && verse.seasonLabel.trim()) {
            seasons.add(verse.seasonLabel.trim());
        }
    }

    return Array.from(seasons).sort((a, b) => a.localeCompare(b));
}

/**
 * Filters verses by seasonLabel (returns all verses when seasonLabel is 'all').
 */
export async function getVersesBySeason(seasonLabel = 'all') {
    const verses = await loadAllVerses();
    const normalizedFilter = (seasonLabel || 'all').trim().toLowerCase();

    if (normalizedFilter === 'all') {
        return verses;
    }

    return verses.filter(
        (verse) => (verse.seasonLabel || '').trim().toLowerCase() === normalizedFilter
    );
}

/**
 * Returns a two-page verse spread (leftPage and rightPage) starting at verseIndex,
 * along with metadata needed for the footer season counter.
 */
export async function getBookSpread(verseIndex = 0, seasonLabel = 'all') {
    const normalizedSeason = (seasonLabel || 'all').trim();
    const list = await getVersesBySeason(normalizedSeason);
    const total = list.length;

    if (total === 0) {
        return {
            leftPage: null,
            rightPage: null,
            verseIndex: 0,
            total: 0,
            seasonLabel: normalizedSeason
        };
    }

    const safeIndex = ((verseIndex % total) + total) % total;
    const leftPage = list[safeIndex];
    const rightPage = total > 1 ? list[(safeIndex + 1) % total] : null;

    return {
        leftPage,
        rightPage,
        verseIndex: safeIndex,
        total,
        seasonLabel: normalizedSeason
    };
}