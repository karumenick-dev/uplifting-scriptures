/* ==========================================================================
   ES MODULE: BOOK OPEN/CLOSE TOGGLE & FIREFLY PARTICLE ENGINE
   ========================================================================== */

// Warm golden, honey, and soft amber color palette
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
            // Spawn near the center book spine/pages during the opening burst
            this.x = width * 0.5 + (Math.random() - 0.5) * (width * 0.35);
            this.y = height * 0.52 + (Math.random() - 0.5) * (height * 0.35);
            this.vx = (Math.random() - 0.5) * 1.4;
            this.vy = -0.4 - Math.random() * 1.3;
            this.size = 1.6 + Math.random() * 3.4;
            this.life = 0;
            this.maxLife = 140 + Math.random() * 120;
            this.isBurst = true;
        } else {
            // Ambient drifting fireflies across the viewport
            this.x = Math.random() * width;
            this.y = Math.random() * height;
            this.vx = (Math.random() - 0.5) * 0.45;
            this.vy = -0.15 - Math.random() * 0.35;
            this.size = 1.2 + Math.random() * 3.8;
            this.isBurst = false;
        }

        // Organic wandering & twinkling phase parameters
        this.phase = Math.random() * Math.PI * 2;
        this.twinkleSpeed = 0.02 + Math.random() * 0.04;
        this.wanderAngle = Math.random() * Math.PI * 2;
        this.wanderSpeed = 0.01 + Math.random() * 0.02;
        // Some particles are soft out-of-focus bokeh orbs, others crisp glitters
        this.isBokeh = Math.random() > 0.72;
    }

    update(intensity) {
        const { width, height } = this.bounds;
        this.phase += this.twinkleSpeed * (1 + intensity * 1.2);
        this.wanderAngle += (Math.random() - 0.5) * 0.12;

        // Gentle organic flight path + upward draft when book opens
        const boostMultiplier = 1 + intensity * 1.8;
        this.x += (this.vx + Math.cos(this.wanderAngle) * 0.35) * boostMultiplier;
        this.y += (this.vy + Math.sin(this.wanderAngle) * 0.25 - intensity * 0.45);

        if (this.isBurst) {
            this.life++;
            if (this.life >= this.maxLife) {
                return false; // Remove expired burst spark
            }
        } else {
            // Wrap seamlessly around screen edges
            if (this.x < -30) this.x = width + 30;
            if (this.x > width + 30) this.x = -30;
            if (this.y < -30) this.y = height + 30;
            if (this.y > height + 30) this.y = -30;
        }
        return true;
    }

    draw(ctx, intensity) {
        // Smooth pulsing alpha (twinkle)
        let twinkle = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(this.phase));
        if (this.isBurst) {
            const progress = this.life / this.maxLife;
            const fadeEnvelope = Math.sin(progress * Math.PI);
            twinkle *= fadeEnvelope;
        }

        const alpha = Math.min(1, twinkle * (0.65 + intensity * 0.45));
        const radius = this.isBokeh ? this.size * 2.6 : this.size;

        // Soft radial glow halo
        const gradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, radius * 3.2
        );
        gradient.addColorStop(0, `rgba(${this.r}, ${this.g}, ${this.b}, ${alpha})`);
        gradient.addColorStop(0.35, `rgba(${this.r}, ${this.g}, ${this.b}, ${alpha * 0.45})`);
        gradient.addColorStop(1, `rgba(${this.r}, ${this.g}, ${this.b}, 0)`);

        ctx.beginPath();
        ctx.fillStyle = gradient;
        ctx.arc(this.x, this.y, radius * 3.2, 0, Math.PI * 2);
        ctx.fill();

        // Crisp glittering core for non-bokeh fireflies
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

    let burstIntensity = 0; // Boosts firefly glow & upward swirl when book opens

    window.addEventListener('resize', () => {
        bounds.width = canvas.width = window.innerWidth;
        bounds.height = canvas.height = window.innerHeight;
    });

    // Initialize ambient firefly swarm (scales gracefully with screen size)
    const ambientCount = Math.min(55, Math.max(25, Math.floor((bounds.width * bounds.height) / 26000)));
    const particles = [];
    for (let i = 0; i < ambientCount; i++) {
        particles.push(new Firefly(bounds, false));
    }

    // Spawn extra celebratory sparks from the book pages when opening
    function triggerOpenBurst(count = 36) {
        burstIntensity = 1.0;
        for (let i = 0; i < count; i++) {
            particles.push(new Firefly(bounds, true));
        }
    }

    function calmParticles() {
        burstIntensity = 0;
    }

    // Main 60fps animation loop
    function animateFireflies() {
        ctx.clearRect(0, 0, bounds.width, bounds.height);

        // Use 'lighter' blend mode so overlapping golden glows shimmer naturally
        ctx.globalCompositeOperation = 'lighter';

        // Smoothly decay the opening burst intensity back to calm ambient drift
        if (burstIntensity > 0.005) {
            burstIntensity *= 0.985;
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

    function openBook() {
        if (isBookOpen || isTransitioning) return;
        isTransitioning = true;
        isBookOpen = true;

        // Clear any closing state and trigger opening classes
        bookEl.classList.remove('is-closing');
        void bookEl.offsetWidth; // Force reflow for clean CSS animation start
        bookEl.classList.add('is-open');
        document.body.classList.add('book-opened');

        // Update toggle button immediately to "Close"
        toggleBtnLabel.textContent = 'Close';
        toggleBtn.setAttribute('aria-expanded', 'true');
        toggleBtn.setAttribute('aria-label', 'Close book');

        // Trigger golden firefly surge as white pages flutter open
        onOpen?.();

        setTimeout(() => {
            isTransitioning = false;
        }, 2600);
    }

    function closeBook() {
        if (!isBookOpen || isTransitioning) return;
        isTransitioning = true;
        isBookOpen = false;

        // Reverse page cascade & fold cover shut smoothly
        bookEl.classList.remove('is-open');
        bookEl.classList.add('is-closing');
        document.body.classList.remove('book-opened');

        // Update toggle button immediately to "Open"
        toggleBtnLabel.textContent = 'Open';
        toggleBtn.setAttribute('aria-expanded', 'false');
        toggleBtn.setAttribute('aria-label', 'Open book');

        // Calm fireflies back to gentle ambient drift
        onClose?.();

        setTimeout(() => {
            bookEl.classList.remove('is-closing');
            void bookEl.offsetWidth;
            isTransitioning = false;
        }, 2450);
    }

    function toggleBook() {
        if (isTransitioning) return;
        if (isBookOpen) {
            closeBook();
        } else {
            openBook();
        }
    }

    // Allow clicking directly on the closed hardcover to open it
    bookEl.addEventListener('click', () => {
        if (!isBookOpen && !isTransitioning) {
            openBook();
        }
    });

    // Bottom Open / Close toggle button listener
    toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleBook();
    });

    return {
        openBook,
        closeBook,
        toggleBook
    };
}

/* --------------------------------------------------------------------------
   4. BOOTSTRAP APPLICATION (ES MODULES ARE DEFERRED BY DEFAULT)
   -------------------------------------------------------------------------- */
const canvas = document.getElementById('firefly-canvas');
const bookEl = document.getElementById('book');
const toggleBtn = document.getElementById('toggle-book-btn');
const toggleBtnLabel = document.getElementById('toggle-btn-label');

if (canvas && bookEl && toggleBtn && toggleBtnLabel) {
    const fireflies = initFireflyEngine(canvas);

    initBookControls({
        bookEl,
        toggleBtn,
        toggleBtnLabel,
        onOpen: () => fireflies.triggerOpenBurst(36),
        onClose: () => fireflies.calmParticles()
    });
}