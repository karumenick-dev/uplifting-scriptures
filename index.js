import { getBookSpread, getAvailableSeasons } from './api.js';

/* ==========================================================================
   ES MODULE: BOOK OPEN/CLOSE TOGGLE & FIREFLY PARTICLE ENGINE
   ========================================================================== */

const FIREFLY_COLORS = [
    { r: 255, g: 230, b: 145 }, // Warm champagne gold
    { r: 245, g: 190, b: 75 },  // Rich honey gold
    { r: 255, g: 165, b: 60 },  // Soft amber ember
    { r: 255, g: 245, b: 195 }  // Bright starlight sparkle
];

/* --------------------------------------------------------------------------
1. GLITTERING FIREFLY & WARM AMBER BOKEH PARTICLE CLASS
   -------------------------------------------------------------------------- */
export class Firefly {
    constructor(bounds, isBurst = false) {
        this.bounds = bounds;
        this.reset(isBurst);
    }

    reset(isBurst = false) {
        const { width, height } = this.bounds;
        const color = FIREFLY_COLORS[Math.floor(Math.random() * FIREFLY_COLORS.length)];
        this.r = color.r;
        this.g = color.g;
        this.b = color.b;

        if (isBurst) {
            this.x = width * 0.5 + (Math.random() - 0.5) * (width * 0.35);
            this.y = height * 0.52 + (Math.random() - 0.5) * (height * 0.35);
            this.vx = (Math.random() - 0.5) * 1.4;
            this.vy = -0.4 - Math.random() * 1.3;
            this.size = 1.6 + Math.random() * 3.4;
            this.life = 0;
            this.maxLife = 120 + Math.random() * 90;
            this.isBurst = true;
        } else {
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.vx = (Math.random() - 0.5) * 0.45;
            this.vy = -0.15 - Math.random() * 0.35;
            this.size = 1.2 + Math.random() * 3.5;
            this.isBurst = false;
        }

        this.phase = Math.random() * Math.PI * 2;
        this.twinkleSpeed = 0.02 + Math.random() * 0.04;
        this.wanderAngle = Math.random() * Math.PI * 2;
        this.wanderSpeed = 0.01 + Math.random() * 0.02;
        this.isBokeh = Math.random() > 0.72;
    }

    update(intensity) {
        const { width, height } = this.bounds;
        this.phase += this.twinkleSpeed * (1 + intensity * 1.2);
        this.wanderAngle += (Math.random() - 0.5) * 0.12;

        const boostMultiplier = 1 + intensity * 1.8;
        this.x += (this.vx + Math.cos(this.wanderAngle) * 0.35) * boostMultiplier;
        this.y += (this.vy + Math.sin(this.wanderAngle) * 0.25 - intensity * 0.45);

        if (this.isBurst) {
            this.life++;
            if (this.life >= this.maxLife) {
                return false;
            }
        } else {
            if (this.x < -30) this.x = width + 30;
            if (this.x > width + 30) this.x = -30;
            if (this.y < -30) this.y = height + 30;
            if (this.y > height + 30) this.y = -30;
        }
        return true;
    }

    draw(ctx, intensity) {
        let twinkle = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(this.phase));
        if (this.isBurst) {
            const progress = this.life / this.maxLife;
            const fadeEnvelope = Math.sin(progress * Math.PI);
            twinkle *= fadeEnvelope;
        }

        const alpha = Math.min(1, twinkle * (0.65 + intensity * 0.45));
        const radius = this.isBokeh ? this.size * 2.4 : this.size;

        const gradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, radius * 3.0
        );
        gradient.addColorStop(0, `rgba(${this.r}, ${this.g}, ${this.b}, ${alpha})`);
        gradient.addColorStop(0.35, `rgba(${this.r}, ${this.g}, ${this.b}, ${alpha * 0.45})`);
        gradient.addColorStop(1, `rgba(${this.r}, ${this.g}, ${this.b}, 0)`);

        ctx.beginPath();
        ctx.fillStyle = gradient;
        ctx.arc(this.x, this.y, radius * 3.0, 0, Math.PI * 2);
        ctx.fill();

        if (!this.isBokeh && alpha > 0.45) {
            ctx.beginPath();
            ctx.fillStyle = `rgba(255, 252, 230, ${alpha})`;
            ctx.arc(this.x, this.y, this.size * 0.55, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

/* --------------------------------------------------------------------------
2. PARTICLE ENGINE INITIALIZER
   -------------------------------------------------------------------------- */
export function initFireflyEngine(canvas) {
    const ctx = canvas.getContext('2d');
    const bounds = {
        width: (canvas.width = window.innerWidth),
        height: (canvas.height = window.innerHeight)
    };

    let burstIntensity = 0;

    window.addEventListener('resize', () => {
        bounds.width = canvas.width = window.innerWidth;
        bounds.height = canvas.height = window.innerHeight;
    });

    const ambientCount = Math.min(55, Math.max(25, Math.floor((bounds.width * bounds.height) / 26000)));
    const particles = [];
    for (let i = 0; i < ambientCount; i++) {
        particles.push(new Firefly(bounds, false));
    }

    function triggerOpenBurst(count = 28) {
        burstIntensity = 1.0;
        for (let i = 0; i < count; i++) {
            particles.push(new Firefly(bounds, true));
        }
    }

    function calmParticles() {
        burstIntensity = 0;
    }

    function animateFireflies() {
        ctx.clearRect(0, 0, bounds.width, bounds.height);
        ctx.globalCompositeOperation = 'lighter';

        if (burstIntensity > 0.005) {
            burstIntensity *= 0.982;
        } else {
            burstIntensity = 0;
        }

        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            const alive = p.update(burstIntensity);
            if (!alive) {
                particles.splice(i, 1);
            } else {
                p.draw(ctx, burstIntensity);
            }
        }

        ctx.globalCompositeOperation = 'source-over';
        requestAnimationFrame(animateFireflies);
    }

    animateFireflies();

    return {
        triggerOpenBurst,
        calmParticles
    };
}

/* --------------------------------------------------------------------------
3. BOOK OPEN & CLOSE TOGGLE CHOREOGRAPHY
   -------------------------------------------------------------------------- */
export function initBookControls({ bookEl, toggleBtn, toggleBtnLabel, onOpen, onClose }) {
    let isBookOpen = false;
    let isTransitioning = false;
    let coverReadyTimer = null;
    let closeFinishTimer = null;

    function clearCloseTimers() {
        clearTimeout(coverReadyTimer);
        clearTimeout(closeFinishTimer);
    }

    function openBook() {
        if (isBookOpen || isTransitioning) return;
        clearCloseTimers();
        isTransitioning = true;
        isBookOpen = true;

        bookEl.classList.remove('is-closing', 'cover-ready');
        void bookEl.offsetWidth;
        bookEl.classList.add('is-open');
        document.body.classList.add('book-opened');

        toggleBtnLabel.textContent = 'Close';
        toggleBtn.setAttribute('aria-expanded', 'true');
        toggleBtn.setAttribute('aria-label', 'Close book');

        onOpen?.();

        setTimeout(() => {
            isTransitioning = false;
        }, 1850);
    }

    function closeBook() {
        if (!isBookOpen || isTransitioning) return;
        clearCloseTimers();
        isTransitioning = true;
        isBookOpen = false;

        bookEl.classList.remove('is-open', 'cover-ready');
        void bookEl.offsetWidth;
        bookEl.classList.add('is-closing');
        document.body.classList.remove('book-opened');

        toggleBtnLabel.textContent = 'Open';
        toggleBtn.setAttribute('aria-expanded', 'false');
        toggleBtn.setAttribute('aria-label', 'Open book');

        onClose?.();

        // Reveal outer cover immediately after flip-sheet-1 finishes closing (~1580ms)
        coverReadyTimer = setTimeout(() => {
            bookEl.classList.add('cover-ready');
        }, 1580);

        closeFinishTimer = setTimeout(() => {
            bookEl.classList.remove('is-closing', 'cover-ready');
            void bookEl.offsetWidth;
            isTransitioning = false;
        }, 2100);
    }

    function toggleBook() {
        if (isTransitioning) return;
        if (isBookOpen) {
            closeBook();
        } else {
            openBook();
        }
    }

    bookEl.addEventListener('click', () => {
        if (!isBookOpen && !isTransitioning) {
            openBook();
        }
    });

    toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleBook();
    });

    return {
        openBook,
        closeBook,
        toggleBook,
        getIsOpen: () => isBookOpen
    };
}

/* --------------------------------------------------------------------------
4. BOOTSTRAP APPLICATION (ES MODULES ARE DEFERRED BY DEFAULT)
   -------------------------------------------------------------------------- */
const canvas = document.getElementById('firefly-canvas');
const bookEl = document.getElementById('book');
const toggleBtn = document.getElementById('toggle-book-btn');
const toggleBtnLabel = document.getElementById('toggle-btn-label');
const prevVerseBtn = document.getElementById('prev-verse-btn');
const nextVerseBtn = document.getElementById('next-verse-btn');
const seasonSelectEl = document.getElementById('season-select');
const fontSelectEl = document.getElementById('font-select');
const themeSelectEl = document.getElementById('theme-select');
const leftPageStackEl = document.getElementById('left-page-stack');
const pageTurnerEl = document.getElementById('page-turner');

const FONT_STORAGE_KEY = 'uplifting_scriptures_font';
const THEME_STORAGE_KEY = 'uplifting_scriptures_theme';
const PAGE_TURN_DURATION_MS = 850;

function applyReadingFont(fontValue) {
    const cleanFont = fontValue || 'current';
    document.body.dataset.font = cleanFont;
    if (fontSelectEl && fontSelectEl.value !== cleanFont) {
        fontSelectEl.value = cleanFont;
    }
    try {
        localStorage.setItem(FONT_STORAGE_KEY, cleanFont);
    } catch (_) {}
}

function applyColorScheme(themeValue) {
    const cleanTheme = themeValue || 'warm-parchment';
    document.body.dataset.theme = cleanTheme;
    if (themeSelectEl && themeSelectEl.value !== cleanTheme) {
        themeSelectEl.value = cleanTheme;
    }
    try {
        localStorage.setItem(THEME_STORAGE_KEY, cleanTheme);
    } catch (_) {}
}

try {
    applyReadingFont(localStorage.getItem(FONT_STORAGE_KEY) || 'current');
    applyColorScheme(localStorage.getItem(THEME_STORAGE_KEY) || 'warm-parchment');
} catch (_) {
    applyReadingFont('current');
    applyColorScheme('warm-parchment');
}

if (canvas && bookEl && toggleBtn && toggleBtnLabel) {
    const fireflies = initFireflyEngine(canvas);

    let currentVerseIndex = 0;
    let currentSeasonTotal = 0;
    let activeSeason = 'all';
    let seasonsLoaded = false;
    let spreadRequestId = 0;
    let isPageTurning = false;

    async function populateSeasonsDropdown() {
        if (!seasonSelectEl || seasonsLoaded) return;

        try {
            const seasons = await getAvailableSeasons();
            for (const season of seasons) {
                const option = document.createElement('option');
                option.value = season;
                option.textContent = season;
                seasonSelectEl.appendChild(option);
            }
            seasonsLoaded = true;
        } catch (error) {
            console.error('Failed to populate seasons:', error);
        }
    }

    function setBookControlsActive(isOpen) {
        [prevVerseBtn, nextVerseBtn, seasonSelectEl, fontSelectEl, themeSelectEl].forEach((el) => {
            if (!el) return;
            el.disabled = !isOpen;
        });
    }

    function formatSeasonProgress(indexInSeason, totalInSeason) {
        if (!totalInSeason) return '';
        const position = indexInSeason + 1;
        return `${position} of ${totalInSeason}`;
    }

    function renderLeftPageStack(indexInSeason, totalInSeason) {
        if (!leftPageStackEl) return;

        if (!totalInSeason || indexInSeason <= 0) {
            leftPageStackEl.innerHTML = '';
            return;
        }

        // Cap visible stacked sheets so it stays crisp even in a 100-verse season
        const visibleLayers = Math.min(indexInSeason, 12);
        const fragment = document.createDocumentFragment();

        for (let i = 0; i < visibleLayers; i++) {
            const layer = document.createElement('div');
            layer.className = 'stacked-page-layer';
            const offsetPx = i * 2.4;
            layer.style.transform = `translate3d(${offsetPx}px, 0, ${(i + 1) * 0.6}px)`;
            layer.style.opacity = String(Math.min(0.95, 0.55 + i * 0.04));
            fragment.appendChild(layer);
        }

        leftPageStackEl.replaceChildren(fragment);
    }

    function renderBlankLeftPage(articleEl) {
        if (!articleEl) return;
        articleEl.innerHTML = `<div class="spread-content-reveal h-full w-full"></div>`;
    }

    function renderScripturePage(articleEl, entry, seasonProgress = '') {
        if (!articleEl) return;

        if (!entry) {
            articleEl.innerHTML = `
                <div class="spread-content-reveal flex flex-col h-full justify-between">
                    <div>
                        <header class="page-header-meta">
                            <span>Selah</span>
                            <span>Quiet Reflection</span>
                        </header>
                        <h2 class="page-title">Be Still &amp; Rest</h2>
                        <div class="page-body space-y-3">
                            <p>Take a slow breath here before turning back to the beginning.</p>
                        </div>
                    </div>
                    <footer class="page-footer">~ Quiet Reflection ~</footer>
                </div>
            `;
            return;
        }

        const paragraphs = Array.isArray(entry.body) ? entry.body : [String(entry.body || '')];
        const paragraphsHtml = paragraphs
            .map((text, idx) =>
                idx === 0
                    ? `<p class="drop-cap">${text}</p>`
                    : `<p>${text}</p>`
            )
            .join('');

        const footerLabel = seasonProgress ? `~ ${seasonProgress} ~` : '';

        articleEl.innerHTML = `
            <div class="spread-content-reveal flex flex-col h-full justify-between">
                <div>
                    <header class="page-header-meta">
                        <span>${entry.reference}</span>
                        <span>${entry.seasonLabel}</span>
                    </header>
                    <h2 class="page-title">${entry.title}</h2>
                    <div class="page-body space-y-3">
                        ${paragraphsHtml}
                    </div>
                </div>
                <footer class="page-footer">${footerLabel}</footer>
            </div>
        `;
    }

    async function updateSpread(targetIndex = currentVerseIndex) {
        const leftPageEl = document.querySelector('.left-spread-page');
        const rightPageEl = document.querySelector('.right-spread-page');
        const requestToken = ++spreadRequestId;

        try {
            let normalizedIndex = Number(targetIndex) || 0;
            if (currentSeasonTotal > 0) {
                normalizedIndex = ((normalizedIndex % currentSeasonTotal) + currentSeasonTotal) % currentSeasonTotal;
            } else {
                normalizedIndex = Math.max(0, normalizedIndex);
            }

            const spread = await getBookSpread(normalizedIndex, activeSeason);
            if (requestToken !== spreadRequestId) return;

            currentVerseIndex = spread.verseIndex;
            currentSeasonTotal = spread.total || 0;
            const progressLabel = formatSeasonProgress(currentVerseIndex, currentSeasonTotal);

            renderBlankLeftPage(leftPageEl);
            renderLeftPageStack(currentVerseIndex, currentSeasonTotal);
            renderScripturePage(rightPageEl, spread.leftPage, progressLabel);
        } catch (error) {
            console.error('Error loading scriptures:', error);
        }
    }

    function turnToSpread(targetIndex, direction = 'next') {
        if (!bookControls.getIsOpen() || isPageTurning) return;

        if (!pageTurnerEl) {
            updateSpread(targetIndex);
            return;
        }

        isPageTurning = true;
        const animClass = direction === 'prev' ? 'is-turning-prev' : 'is-turning-next';

        pageTurnerEl.classList.remove('is-turning-next', 'is-turning-prev');
        void pageTurnerEl.offsetWidth;
        pageTurnerEl.classList.add(animClass);

        // Swap scripture content and update the left page stack right at the 90° midpoint
        setTimeout(() => {
            updateSpread(targetIndex);
        }, Math.round(PAGE_TURN_DURATION_MS * 0.48));

        setTimeout(() => {
            pageTurnerEl.classList.remove('is-turning-next', 'is-turning-prev');
            isPageTurning = false;
        }, PAGE_TURN_DURATION_MS + 40);
    }

    const bookControls = initBookControls({
        bookEl,
        toggleBtn,
        toggleBtnLabel,
        onOpen: async () => {
            fireflies.triggerOpenBurst(28);
            await populateSeasonsDropdown();
            setBookControlsActive(true);
            updateSpread(currentVerseIndex);
        },
        onClose: () => {
            fireflies.calmParticles();
            setBookControlsActive(false);
            renderLeftPageStack(0, 0);
        }
    });

    seasonSelectEl?.addEventListener('change', (e) => {
        e.stopPropagation();
        if (!bookControls.getIsOpen()) return;
        activeSeason = seasonSelectEl.value || 'all';
        currentVerseIndex = 0;
        currentSeasonTotal = 0;
        renderLeftPageStack(0, 0);
        updateSpread(0);
    });

    fontSelectEl?.addEventListener('change', (e) => {
        e.stopPropagation();
        applyReadingFont(fontSelectEl.value);
    });

    themeSelectEl?.addEventListener('change', (e) => {
        e.stopPropagation();
        applyColorScheme(themeSelectEl.value);
    });

    prevVerseBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        turnToSpread(currentVerseIndex - 1, 'prev');
    });

    nextVerseBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        turnToSpread(currentVerseIndex + 1, 'next');
    });

    // Optional keyboard navigation when the book is open
    document.addEventListener('keydown', (e) => {
        if (!bookControls.getIsOpen()) return;
        if (e.key === 'ArrowLeft') {
            turnToSpread(currentVerseIndex - 1, 'prev');
        } else if (e.key === 'ArrowRight') {
            turnToSpread(currentVerseIndex + 1, 'next');
        }
    });
}