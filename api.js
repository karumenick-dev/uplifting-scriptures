/* ==========================================================================
   ES MODULE: SCRIPTURE DATA API
   ========================================================================== */

const DB_URL = './db.json';
let cachedVerses = null;

/**
 * Fetches and caches all 100 scripture entries from db.json.
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
 * Filters verses by seasonLabel (returns all verses when seasonLabel is 'all').
 */
export async function getVersesBySeason(seasonLabel = 'all') {
    const verses = await loadAllVerses();

    if (!seasonLabel || seasonLabel.toLowerCase() === 'all') {
        return verses;
    }

    return verses.filter(
        (verse) => verse.seasonLabel?.toLowerCase() === seasonLabel.toLowerCase()
    );
}

/**
 * Returns a two-page verse spread (leftPage and rightPage) starting at verseIndex.
 * Wraps cleanly around the start and end of the list.
 */
export async function getBookSpread(verseIndex = 0, seasonLabel = 'all') {
    const list = await getVersesBySeason(seasonLabel);
    const total = list.length;

    if (total === 0) {
        return {
            leftPage: null,
            rightPage: null,
            verseIndex: 0,
            total: 0,
            seasonLabel
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
        seasonLabel
    };
}