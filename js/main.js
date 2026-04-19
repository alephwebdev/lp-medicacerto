/* ============================================
   MEDICA CERTO — Main JS
   ============================================ */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
    /* ── GSAP ── */
    gsap.registerPlugin(ScrollTrigger);

    /* ── Lenis smooth scroll ── */
    const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    });

    lenis.on('scroll', ScrollTrigger.update);

    gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);

    /* ── Anchor links smooth scroll via Lenis ── */
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener('click', (e) => {
            e.preventDefault();
            const target = document.querySelector(anchor.getAttribute('href'));
            if (target) lenis.scrollTo(target, { offset: 0 });
        });
    });

    /* ── "Testar agora" buttons → form page ── */
    document.querySelectorAll('button').forEach((btn) => {
        const span = btn.querySelector('span');
        if (span && span.textContent.trim() === 'Testar agora') {
            btn.addEventListener('click', () => {
                window.location.href = './form.html';
            });
        }
    });

    /* ══════════════════════════════════════════
       ENTRANCE ANIMATIONS
       ══════════════════════════════════════════ */

    const mm = gsap.matchMedia();
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!prefersReduced) {

        /* ── Hero: stagger on load ── */
        const heroTl = gsap.timeline({ defaults: { ease: 'power3.out', duration: 0.9 } });

        heroTl
            .from('.hero__container-header', { y: -20, opacity: 0 })
            .from('.hero__container-texts > h1', { y: 40, opacity: 0 }, '-=0.5')
            .from('.hero__container-texts > p', { y: 30, opacity: 0 }, '-=0.6')
            .from('.hero__container-mockup', { y: 60, opacity: 0, duration: 1 }, '-=0.5');

        /* ── Reveal helper ── */
        function revealOnScroll(selector, fromVars, stagger) {
            const elements = document.querySelectorAll(selector);
            if (!elements.length) return;

            elements.forEach((el) => {
                gsap.from(el, {
                    ...fromVars,
                    scrollTrigger: {
                        trigger: el,
                        start: 'top 85%',
                        once: true,
                    },
                    stagger: stagger || 0,
                });
            });
        }

        /* ── Solution section ── */
        revealOnScroll('.solution__container > .solution__container-texts', {
            y: 40, opacity: 0, duration: 0.8, ease: 'power3.out'
        });

        // Grid items stagger
        gsap.from('.hero__container-grid-item', {
            y: 50,
            opacity: 0,
            duration: 0.8,
            ease: 'power3.out',
            stagger: 0.15,
            scrollTrigger: {
                trigger: '.hero__container-grid',
                start: 'top 80%',
                once: true,
            }
        });

        /* ── Process section ── */
        revealOnScroll('.process__container > .process__container-texts', {
            y: 40, opacity: 0, duration: 0.8, ease: 'power3.out'
        });

        // Process items alternate slide
        document.querySelectorAll('.process__container-steps-item').forEach((item, i) => {
            const isOdd = i % 2 === 0;
            gsap.from(item, {
                x: isOdd ? -40 : 40,
                opacity: 0,
                duration: 0.8,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: item,
                    start: 'top 85%',
                    once: true,
                }
            });
        });

        /* ── CTA section ── */
        gsap.from('.cta__container', {
            y: 40,
            opacity: 0,
            duration: 0.8,
            ease: 'power3.out',
            scrollTrigger: {
                trigger: '.cta',
                start: 'top 80%',
                once: true,
            }
        });
    }

    /* ══════════════════════════════════════════
       PROCESS PROGRESS LINE
       ══════════════════════════════════════════ */

    const stepsContainer = document.querySelector('.process__container-steps');
    const trackLine = document.querySelector('.process__container-steps-track-line');
    const trackFill = document.querySelector('.process__container-steps-track-fill');
    const dots = document.querySelectorAll('.process__container-steps-track-dot');
    const items = document.querySelectorAll('.process__container-steps-item');

    if (!stepsContainer || !trackFill || !trackLine || dots.length < 4 || !items.length) return;

    /* ── Position dots ── */
    function positionDots() {
        const containerRect = stepsContainer.getBoundingClientRect();
        const containerTop = containerRect.top + window.scrollY;
        const containerHeight = containerRect.height;

        items.forEach((item, i) => {
            if (!dots[i]) return;
            const badge = item.querySelector('.process__container-steps-item-texts-badge');
            const target = badge || item;
            const targetRect = target.getBoundingClientRect();
            const targetTop = targetRect.top + window.scrollY;
            const targetCenter = targetTop + targetRect.height / 2;
            const pct = ((targetCenter - containerTop) / containerHeight) * 100;
            dots[i].style.top = pct + '%';
        });

        dots[3].style.top = '100%';

        const firstDotPct = parseFloat(dots[0].style.top);

        trackLine.style.top = firstDotPct + '%';
        trackLine.style.height = (100 - firstDotPct) + '%';
        trackFill.style.top = firstDotPct + '%';
    }

    positionDots();
    window.addEventListener('resize', positionDots);

    /* ── Scroll-driven fill + dot activation ── */
    const ctaSection = document.querySelector('#cta');

    ScrollTrigger.create({
        trigger: stepsContainer,
        start: 'top 30%',
        endTrigger: ctaSection || stepsContainer,
        end: ctaSection ? 'top 80%' : 'bottom top',
        scrub: true,
        onUpdate: (self) => {
            const progress = self.progress;
            const firstPct = parseFloat(dots[0].style.top);
            const lineSpan = 100 - firstPct;

            const fillHeight = progress * lineSpan;
            trackFill.style.height = fillHeight + '%';

            dots.forEach((dot, i) => {
                const dotPct = parseFloat(dot.style.top);
                const dotProgress = (dotPct - firstPct) / lineSpan;
                const reached = progress >= dotProgress - 0.01;

                let isCurrent = false;
                if (reached) {
                    const nextDot = dots[i + 1];
                    if (nextDot) {
                        const nextPct = parseFloat(nextDot.style.top);
                        const nextProgress = (nextPct - firstPct) / lineSpan;
                        isCurrent = progress < nextProgress - 0.01;
                    } else {
                        isCurrent = true;
                    }
                }

                dot.classList.toggle('is-active', reached && isCurrent);
                dot.classList.toggle('is-passed', reached && !isCurrent);

                if (!reached) {
                    dot.classList.remove('is-passed', 'is-active');
                }
            });
        }
    });
});
