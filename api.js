/* ==========================================================================
   ES MODULE: SCRIPTURE DATA API
   ========================================================================== */

const DB_URL = './db.json';
let cachedVerses = null;

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

export async function getVersesBySeason(seasonLabel = 'all') {
    const verses = await loadAllVerses();

    if (!seasonLabel || seasonLabel.toLowerCase() === 'all') {
        return verses;
    }

    return verses.filter(
        (verse) => verse.seasonLabel.toLowerCase() === seasonLabel.toLowerCase()
    );
}

/**
 * Returns the current verse (leftPage) and following verse (rightPage)
 */
export async function getVersePair(verseIndex = 0, seasonLabel = 'all') {
    const list = await getVersesBySeason(seasonLabel);
    const total = list.length;

    if (total === 0) {
        return {
            leftVerse: null,
            rightVerse: null,
            currentIndex: 0,
            total: 0
        };
    }

    const safeIndex = ((verseIndex % total) + total) % total;
    const leftVerse = list[safeIndex];
    const rightVerse = total > 1 ? list[(safeIndex + 1) % total] : null;

    return {
        leftVerse,
        rightVerse,
        currentIndex: safeIndex,
        total
    };
}