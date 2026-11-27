import { getBookSpread, getAvailableSeasons } from './api.js';

/* ==========================================================================
   ES MODULE: BOOK OPEN/CLOSE TOGGLE & FIREFLY PARTICLE ENGINE
   ========================================================================== */

const DARK_BG_PARTICLE_COLORS = [
    { r: 255, g: 230, b: 145 }, // Warm champagne gold
    { r: 245, g: 190, b: 75 },  // Rich honey gold
    { r: 255, g: 165, b: 60 },  // Soft amber ember
    { r: 255, g: 245, b: 195 }  // Bright starlight sparkle
];

const LIGHT_BG_PARTICLE_COLORS = [
    { r: 175, g: 132, b: 48 },  // Warm antique gold
    { r: 145, g: 108, b: 42 },  // Burnished bronze dust
    { r: 195, g: 158, b: 78 },  // Sunlit pollen
    { r: 255, g: 250, b: 235 }  // Soft ivory glint
];

let activeParticlePalette = DARK_BG_PARTICLE_COLORS;

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
        const color = activeParticlePalette[Math.floor(Math.random() * activeParticlePalette.length)];
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
    let enabled = true;
    let rafId = null;

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
        if (!enabled) return;
        burstIntensity = 1.0;
        for (let i = 0; i < count; i++) {
            particles.push(new Firefly(bounds, true));
        }
    }

    function calmParticles() {
        burstIntensity = 0;
    }

    function refreshPalette() {
        for (const p of particles) {
            const color = activeParticlePalette[Math.floor(Math.random() * activeParticlePalette.length)];
            p.r = color.r;
            p.g = color.g;
            p.b = color.b;
        }
    }

    function stepFrame() {
        ctx.clearRect(0, 0, bounds.width, bounds.height);
        if (!enabled) {
            rafId = null;
            return;
        }

        const isLightBackdrop = document.body.classList.contains('light-backdrop');
        ctx.globalCompositeOperation = isLightBackdrop ? 'source-over' : 'lighter';

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
        rafId = requestAnimationFrame(stepFrame);
    }

    function setEnabled(isEnabled) {
        enabled = Boolean(isEnabled);
        if (!enabled) {
            burstIntensity = 0;
            // Remove temporary burst particles when toggled off
            for (let i = particles.length - 1; i >= 0; i--) {
                if (particles[i].isBurst) {
                    particles.splice(i, 1);
                }
            }
            ctx.clearRect(0, 0, bounds.width, bounds.height);
        } else if (!rafId) {
            rafId = requestAnimationFrame(stepFrame);
        }
    }

    rafId = requestAnimationFrame(stepFrame);

    return {
        triggerOpenBurst,
        calmParticles,
        refreshPalette,
        setEnabled
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
4. PILL DROPDOWN HELPER (SHOWS CATEGORY UNTIL CHOSEN, THEN SHOWS CHOICE)
   -------------------------------------------------------------------------- */
function createPillDropdown({ containerEl, triggerEl, menuEl, onSelect }) {
    const textEl = triggerEl?.querySelector('.pill-text');
    let hasUserChosen = false;

    function getDefaultLabel() {
        return containerEl?.dataset.defaultLabel || triggerEl?.getAttribute('aria-label') || 'Select';
    }

    function setOpen(open) {
        if (!containerEl || !triggerEl) return;
        if (open && triggerEl.disabled) return;
        containerEl.classList.toggle('is-open', open);
        triggerEl.setAttribute('aria-expanded', String(open));
    }

    function syncSelectedVisual(value) {
        if (!menuEl) return;
        menuEl.querySelectorAll('.pill-option').forEach((opt) => {
            const isMatch = opt.dataset.value === value;
            opt.classList.toggle('is-selected', isMatch);
            opt.setAttribute('aria-selected', String(isMatch));
        });
    }

    function setValue(value, { markAsChosen = false, triggerCallback = false } = {}) {
        if (!menuEl || !textEl) return;
        const options = Array.from(menuEl.querySelectorAll('.pill-option'));
        const matched = options.find((opt) => opt.dataset.value === value) || options[0];
        if (!matched) return;

        const chosenValue = matched.dataset.value;
        const chosenLabel = matched.dataset.label || matched.textContent.trim();

        if (markAsChosen) {
            hasUserChosen = true;
        }

        textEl.textContent = hasUserChosen ? chosenLabel : getDefaultLabel();
        syncSelectedVisual(chosenValue);

        if (triggerCallback) {
            onSelect?.(chosenValue, chosenLabel);
        }
    }

    function addOption(value, label) {
        if (!menuEl) return;
        const li = document.createElement('li');
        li.className = 'pill-option';
        li.setAttribute('role', 'option');
        li.setAttribute('aria-selected', 'false');
        li.dataset.value = value;
        li.dataset.label = label;
        li.textContent = label;
        menuEl.appendChild(li);
    }

    triggerEl?.addEventListener('click', (e) => {
        e.stopPropagation();
        if (triggerEl.disabled) return;
        const willOpen = !containerEl.classList.contains('is-open');
        closeAllPillDropdowns(containerEl);
        setOpen(willOpen);
    });

    menuEl?.addEventListener('click', (e) => {
        e.stopPropagation();
        const optionEl = e.target.closest('.pill-option');
        if (!optionEl) return;
        const val = optionEl.dataset.value;
        setValue(val, { markAsChosen: true, triggerCallback: true });
        setOpen(false);
    });

    return {
        setValue,
        setOpen,
        addOption,
        setDisabled: (disabled) => {
            if (!triggerEl) return;
            triggerEl.disabled = disabled;
            if (disabled) setOpen(false);
        }
    };
}

const allPillDropdowns = [];

function closeAllPillDropdowns(exceptEl = null) {
    allPillDropdowns.forEach((item) => {
        if (item.containerEl !== exceptEl) {
            item.setOpen(false);
        }
    });
}

document.addEventListener('click', () => {
    closeAllPillDropdowns();
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeAllPillDropdowns();
    }
});

/* --------------------------------------------------------------------------
5. BOOTSTRAP APPLICATION (ES MODULES ARE DEFERRED BY DEFAULT)
   -------------------------------------------------------------------------- */
const canvas = document.getElementById('firefly-canvas');
const bookEl = document.getElementById('book');
const toggleBtn = document.getElementById('toggle-book-btn');
const toggleBtnLabel = document.getElementById('toggle-btn-label');
const prevVerseBtn = document.getElementById('prev-verse-btn');
const nextVerseBtn = document.getElementById('next-verse-btn');
const firefliesToggleBtn = document.getElementById('fireflies-toggle-btn');
const firefliesToggleTextEl = firefliesToggleBtn?.querySelector('.pill-text');
const leftPageStackEl = document.getElementById('left-page-stack');
const pageTurnerEl = document.getElementById('page-turner');

const FONT_STORAGE_KEY = 'uplifting_scriptures_font';
const THEME_STORAGE_KEY = 'uplifting_scriptures_theme';
const BG_STORAGE_KEY = 'uplifting_scriptures_bg';
const FIREFLIES_STORAGE_KEY = 'uplifting_scriptures_fireflies';
const LIGHT_BACKGROUNDS = new Set(['sage-mist', 'linen-sand']);
const PAGE_TURN_DURATION_MS = 1080;

let firefliesInstance = null;
let firefliesEnabled = true;
let seasonDropdown = null;
let fontDropdown = null;
let themeDropdown = null;
let bgDropdown = null;

function applyFirefliesEnabled(isEnabled, { burstIfOpen = false } = {}) {
    firefliesEnabled = Boolean(isEnabled);
    document.body.classList.toggle('fireflies-off', !firefliesEnabled);
    firefliesInstance?.setEnabled(firefliesEnabled);

    if (firefliesToggleBtn) {
        firefliesToggleBtn.setAttribute('aria-pressed', String(firefliesEnabled));
    }
    if (firefliesToggleTextEl) {
        firefliesToggleTextEl.textContent = firefliesEnabled ? 'Fireflies: On' : 'Fireflies: Off';
    }

    if (firefliesEnabled && burstIfOpen && document.body.classList.contains('book-opened')) {
        firefliesInstance?.triggerOpenBurst(16);
    }

    try {
        localStorage.setItem(FIREFLIES_STORAGE_KEY, firefliesEnabled ? 'on' : 'off');
    } catch (_) {}
}

function applyReadingFont(fontValue) {
    const cleanFont = fontValue || 'current';
    document.body.dataset.font = cleanFont;
    fontDropdown?.setValue(cleanFont, { markAsChosen: false, triggerCallback: false });
    try {
        localStorage.setItem(FONT_STORAGE_KEY, cleanFont);
    } catch (_) {}
}

function applyColorScheme(themeValue) {
    const cleanTheme = themeValue || 'warm-parchment';
    document.body.dataset.theme = cleanTheme;
    themeDropdown?.setValue(cleanTheme, { markAsChosen: false, triggerCallback: false });
    try {
        localStorage.setItem(THEME_STORAGE_KEY, cleanTheme);
    } catch (_) {}
}

function applyBackgroundAmbiance(bgValue) {
    const cleanBg = bgValue || 'espresso-brown';
    const isLight = LIGHT_BACKGROUNDS.has(cleanBg);

    document.body.dataset.bg = cleanBg;
    document.body.classList.toggle('light-backdrop', isLight);
    activeParticlePalette = isLight ? LIGHT_BG_PARTICLE_COLORS : DARK_BG_PARTICLE_COLORS;
    firefliesInstance?.refreshPalette();

    bgDropdown?.setValue(cleanBg, { markAsChosen: false, triggerCallback: false });
    try {
        localStorage.setItem(BG_STORAGE_KEY, cleanBg);
    } catch (_) {}
}

if (canvas && bookEl && toggleBtn && toggleBtnLabel) {
    const fireflies = initFireflyEngine(canvas);
    firefliesInstance = fireflies;
    fireflies.refreshPalette();

    let currentVerseIndex = 0;
    let currentSeasonTotal = 0;
    let activeSeason = 'all';
    let seasonsLoaded = false;
    let spreadRequestId = 0;
    let isPageTurning = false;

    async function populateSeasonsDropdown() {
        if (!seasonDropdown || seasonsLoaded) return;

        try {
            const seasons = await getAvailableSeasons();
            for (const season of seasons) {
                seasonDropdown.addOption(season, season);
            }
            seasonsLoaded = true;
        } catch (error) {
            console.error('Failed to populate seasons:', error);
        }
    }

    function syncNavigationButtonStates() {
        const isOpen = bookControls.getIsOpen();
        if (prevVerseBtn) {
            prevVerseBtn.disabled = !isOpen || currentVerseIndex <= 0;
        }
        if (nextVerseBtn) {
            nextVerseBtn.disabled = !isOpen || currentSeasonTotal <= 0 || currentVerseIndex >= currentSeasonTotal - 1;
        }
    }

    function setBookControlsActive(isOpen) {
        syncNavigationButtonStates();
        seasonDropdown?.setDisabled(!isOpen);
        fontDropdown?.setDisabled(!isOpen);
        themeDropdown?.setDisabled(!isOpen);
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

    function renderScripturePage(articleEl, entry, seasonProgress = '', instantReveal = false) {
        if (!articleEl) return;

        const revealClass = instantReveal
            ? 'spread-content-reveal is-instant-reveal flex flex-col h-full justify-between'
            : 'spread-content-reveal flex flex-col h-full justify-between';

        if (!entry) {
            articleEl.innerHTML = `
                <div class="${revealClass}">
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
            <div class="${revealClass}">
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

    async function updateSpread(targetIndex = currentVerseIndex, instantReveal = false) {
        const leftPageEl = document.querySelector('.left-spread-page');
        const rightPageEl = document.querySelector('.right-spread-page');
        const requestToken = ++spreadRequestId;

        try {
            let clampedIndex = Math.max(0, Number(targetIndex) || 0);
            if (currentSeasonTotal > 0) {
                clampedIndex = Math.min(clampedIndex, currentSeasonTotal - 1);
            }

            const spread = await getBookSpread(clampedIndex, activeSeason);
            if (requestToken !== spreadRequestId) return;

            currentSeasonTotal = spread.total || 0;
            currentVerseIndex = currentSeasonTotal > 0
                ? Math.min(Math.max(0, spread.verseIndex), currentSeasonTotal - 1)
                : 0;

            const progressLabel = formatSeasonProgress(currentVerseIndex, currentSeasonTotal);

            renderBlankLeftPage(leftPageEl);
            renderLeftPageStack(currentVerseIndex, currentSeasonTotal);
            renderScripturePage(rightPageEl, spread.leftPage, progressLabel, instantReveal);
            syncNavigationButtonStates();
        } catch (error) {
            console.error('Error loading scriptures:', error);
        }
    }

    function turnToSpread(targetIndex, direction = 'next') {
        if (!bookControls.getIsOpen() || isPageTurning) return;

        // Stop at the first or last verse of the active season instead of wrapping around
        if (targetIndex < 0) return;
        if (currentSeasonTotal > 0 && targetIndex >= currentSeasonTotal) return;

        if (!pageTurnerEl) {
            updateSpread(targetIndex, true);
            return;
        }

        isPageTurning = true;
        const animClass = direction === 'prev' ? 'is-turning-prev' : 'is-turning-next';

        pageTurnerEl.classList.remove('is-turning-next', 'is-turning-prev');
        void pageTurnerEl.offsetWidth;
        pageTurnerEl.classList.add(animClass);

        // Swap at 50% (90° upright crease) with instantReveal = true so text never lingers blank
        setTimeout(() => {
            updateSpread(targetIndex, true);
        }, Math.round(PAGE_TURN_DURATION_MS * 0.5));

        setTimeout(() => {
            pageTurnerEl.classList.remove('is-turning-next', 'is-turning-prev');
            isPageTurning = false;
        }, PAGE_TURN_DURATION_MS + 100);
    }

    seasonDropdown = createPillDropdown({
        containerEl: document.getElementById('season-dropdown'),
        triggerEl: document.getElementById('season-pill-btn'),
        menuEl: document.getElementById('season-menu'),
        onSelect: (value) => {
            if (!bookControls.getIsOpen()) return;
            activeSeason = value || 'all';
            currentVerseIndex = 0;
            currentSeasonTotal = 0;
            renderLeftPageStack(0, 0);
            updateSpread(0);
        }
    });

    fontDropdown = createPillDropdown({
        containerEl: document.getElementById('font-dropdown'),
        triggerEl: document.getElementById('font-pill-btn'),
        menuEl: document.getElementById('font-menu'),
        onSelect: (value) => {
            applyReadingFont(value);
        }
    });

    themeDropdown = createPillDropdown({
        containerEl: document.getElementById('theme-dropdown'),
        triggerEl: document.getElementById('theme-pill-btn'),
        menuEl: document.getElementById('theme-menu'),
        onSelect: (value) => {
            applyColorScheme(value);
        }
    });

    bgDropdown = createPillDropdown({
        containerEl: document.getElementById('bg-dropdown'),
        triggerEl: document.getElementById('bg-pill-btn'),
        menuEl: document.getElementById('bg-menu'),
        onSelect: (value) => {
            applyBackgroundAmbiance(value);
        }
    });

    allPillDropdowns.push(
        { containerEl: document.getElementById('season-dropdown'), setOpen: seasonDropdown.setOpen },
        { containerEl: document.getElementById('font-dropdown'), setOpen: fontDropdown.setOpen },
        { containerEl: document.getElementById('theme-dropdown'), setOpen: themeDropdown.setOpen },
        { containerEl: document.getElementById('bg-dropdown'), setOpen: bgDropdown.setOpen }
    );

    try {
        applyReadingFont(localStorage.getItem(FONT_STORAGE_KEY) || 'current');
        applyColorScheme(localStorage.getItem(THEME_STORAGE_KEY) || 'warm-parchment');
        applyBackgroundAmbiance(localStorage.getItem(BG_STORAGE_KEY) || 'espresso-brown');
        const savedFireflies = localStorage.getItem(FIREFLIES_STORAGE_KEY);
        applyFirefliesEnabled(savedFireflies !== 'off');
    } catch (_) {
        applyReadingFont('current');
        applyColorScheme('warm-parchment');
        applyBackgroundAmbiance('espresso-brown');
        applyFirefliesEnabled(true);
    }

    firefliesToggleBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        closeAllPillDropdowns();
        applyFirefliesEnabled(!firefliesEnabled, { burstIfOpen: true });
    });

    const bookControls = initBookControls({
        bookEl,
        toggleBtn,
        toggleBtnLabel,
        onOpen: async () => {
            if (firefliesEnabled) {
                fireflies.triggerOpenBurst(28);
            }
            await populateSeasonsDropdown();
            setBookControlsActive(true);
            updateSpread(currentVerseIndex);
        },
        onClose: () => {
            fireflies.calmParticles();
            setBookControlsActive(false);
            renderLeftPageStack(0, 0);
            closeAllPillDropdowns();
        }
    });

    prevVerseBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        turnToSpread(currentVerseIndex - 1, 'prev');
    });

    nextVerseBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        turnToSpread(currentVerseIndex + 1, 'next');
    });

    const leftSpreadPageEl = document.querySelector('.left-spread-page');
    const rightSpreadPageEl = document.querySelector('.right-spread-page');
    let pointerDownPos = null;

    function isTextSelectionActive() {
        const selection = window.getSelection?.();
        return Boolean(selection && selection.toString().trim().length > 0);
    }

    function bindPageTapTurn(pageEl, direction) {
        if (!pageEl) return;

        pageEl.addEventListener('pointerdown', (e) => {
            if (!bookControls.getIsOpen() || e.button !== 0) {
                pointerDownPos = null;
                return;
            }
            pointerDownPos = { x: e.clientX, y: e.clientY };
        });

        pageEl.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!bookControls.getIsOpen() || isPageTurning) return;
            if (isTextSelectionActive()) return;

            // Ignore drags/scroll gestures (movement > 8px)
            if (pointerDownPos) {
                const dx = Math.abs(e.clientX - pointerDownPos.x);
                const dy = Math.abs(e.clientY - pointerDownPos.y);
                pointerDownPos = null;
                if (dx > 8 || dy > 8) return;
            }

            if (direction === 'next') {
                turnToSpread(currentVerseIndex + 1, 'next');
            } else {
                turnToSpread(currentVerseIndex - 1, 'prev');
            }
        });
    }

    bindPageTapTurn(rightSpreadPageEl, 'next');
    bindPageTapTurn(leftSpreadPageEl, 'prev');
    
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