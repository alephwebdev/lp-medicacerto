/* ============================================
   MEDICA CERTO — Main JS
   ============================================ */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
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

});
