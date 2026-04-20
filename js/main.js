/* ============================================
   MEDICA CERTO — Main JS
   ============================================ */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
    /* ── GSAP ── */
    gsap.registerPlugin(ScrollTrigger);

    /* ── Anchor links smooth scroll (native) ── */
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener('click', (e) => {
            e.preventDefault();
            const target = document.querySelector(anchor.getAttribute('href'));
            if (target) target.scrollIntoView({ behavior: 'smooth' });
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
       SPLASH SCREEN
       ══════════════════════════════════════════ */

    const splash = document.getElementById('splash');
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* Hide hero elements immediately so they don't flash behind the splash */
    const heroSelectors = [
        '.hero__container-header',
        '.hero__container-texts > h1',
        '.hero__container-texts > p',
        '.hero__container-mockup'
    ];
    if (!prefersReduced) {
        gsap.set(heroSelectors, { opacity: 0 });
    }

    function startSiteAnimations() {
        if (prefersReduced) return;

        /* ── Hero: stagger on load ── */
        const heroTl = gsap.timeline({ defaults: { ease: 'power3.out', duration: 0.9 } });

        heroTl
            .fromTo('.hero__container-header', { y: -20, opacity: 0 }, { y: 0, opacity: 1 })
            .fromTo('.hero__container-texts > h1', { y: 40, opacity: 0 }, { y: 0, opacity: 1 }, '-=0.5')
            .fromTo('.hero__container-texts > p', { y: 30, opacity: 0 }, { y: 0, opacity: 1 }, '-=0.6')
            .fromTo('.hero__container-mockup', { y: 60, opacity: 0 }, { y: 0, opacity: 1, duration: 1 }, '-=0.5');
    }

    if (splash) {
        const splashTl = gsap.timeline({
            onComplete: () => {
                splash.remove();
                startSiteAnimations();
            }
        });

        splashTl
            .from('.splash__icon', {
                scale: 0.8,
                opacity: 0,
                duration: 0.5,
                ease: 'power2.out'
            })
            .to(splash, {
                opacity: 0,
                duration: 0.6,
                ease: 'power2.inOut',
                delay: 0.8
            });
    } else {
        startSiteAnimations();
    }

    /* ══════════════════════════════════════════
       SCROLL REVEAL ANIMATIONS
       ══════════════════════════════════════════ */

    if (!prefersReduced) {

        /* ── Reveal helper ── */
        function revealOnScroll(selector, fromVars) {
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
                });
            });
        }

        /* ── Solution section ── */
        revealOnScroll('.solution__container > .solution__container-texts', {
            y: 40, opacity: 0, duration: 0.8, ease: 'power3.out'
        });

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
});
