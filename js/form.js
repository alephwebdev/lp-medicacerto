/* ============================================
   MEDICA CERTO — Form JS
   ============================================ */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
    const WEBHOOK_URL = 'https://n8n.wallaceproenca.cloud/webhook/medica-certo/data/form';

    /* ── Supabase config (anon key only — safe for client-side) ── */
    const SUPABASE_URL = 'https://sflxtwjyrtpbvnfppamt.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmbHh0d2p5cnRwYnZuZnBwYW10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1NjMxMDcsImV4cCI6MjA5MjEzOTEwN30.XM_avfHn9gqYduGL9AU2nQxnKM8b2d5ubTFKwT0E1bY';

    const steps = document.querySelectorAll('.form-page__step');
    const progressSteps = document.querySelectorAll('.form-page__progress-step');
    const progressLineFills = document.querySelectorAll('.form-page__progress-line-fill');
    const nextBtns = document.querySelectorAll('.form-page__btn-next');
    const backBtns = document.querySelectorAll('.form-page__btn-back');
    const prototypeBtn = document.querySelector('.form-page__btn-prototype');

    let currentStep = 0;
    let formSubmitted = false;

    /* ── Validation ── */
    function validateStep(stepIndex) {
        const step = steps[stepIndex];

        if (stepIndex === 0) {
            const name = step.querySelector('#field-name');
            const email = step.querySelector('#field-email');
            if (!name.value.trim()) { shakeField(name); return false; }
            if (!email.value.trim() || !email.validity.valid) { shakeField(email); return false; }
            return true;
        }

        if (stepIndex === 1) {
            const radios = ['q1', 'q2', 'q3', 'q4'];
            for (const name of radios) {
                const checked = step.querySelector(`input[name="${name}"]:checked`);
                if (!checked) {
                    const group = step.querySelector(`input[name="${name}"]`).closest('.form-page__question');
                    shakeElement(group);
                    group.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    return false;
                }
            }
            return true;
        }

        return true;
    }

    function shakeField(el) {
        el.focus();
        gsap.fromTo(el, { x: -6 }, { x: 0, duration: 0.5, ease: 'elastic.out(1, 0.3)' });
        el.style.borderColor = 'var(--color-error)';
        setTimeout(() => { el.style.borderColor = ''; }, 2000);
    }

    function shakeElement(el) {
        gsap.fromTo(el, { x: -4 }, { x: 0, duration: 0.5, ease: 'elastic.out(1, 0.3)' });
    }

    /* ── Email error helpers ── */
    function showEmailError(msg) {
        const el = document.getElementById('email-error');
        if (el) { el.textContent = msg; el.removeAttribute('hidden'); }
    }

    function clearEmailError() {
        const el = document.getElementById('email-error');
        if (el) { el.textContent = ''; el.setAttribute('hidden', ''); }
    }

    /* ── Check if email already exists in Supabase ── */
    async function checkEmailExists(email) {
        try {
            const res = await fetch(
                `${SUPABASE_URL}/rest/v1/form_submissions?email=eq.${encodeURIComponent(email)}&select=email`,
                {
                    headers: {
                        'apikey': SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    },
                }
            );
            if (!res.ok) return false;
            const data = await res.json();
            return data.length > 0;
        } catch {
            return false;
        }
    }

    /* ── Generate unique raffle number ── */
    async function generateRaffleNumber() {
        let existingNumbers = new Set();
        try {
            const res = await fetch(
                `${SUPABASE_URL}/rest/v1/form_submissions?select=raffle_number&raffle_number=not.is.null`,
                {
                    headers: {
                        'apikey': SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    },
                }
            );
            if (res.ok) {
                const data = await res.json();
                existingNumbers = new Set(data.map((r) => r.raffle_number));
            }
        } catch {
            // Continue with empty set
        }

        let number;
        do {
            number = Math.floor(Math.random() * 900000) + 100000;
        } while (existingNumbers.has(number));

        return number;
    }

    /* ── Step navigation ── */
    async function goToStep(index, direction) {
        if (index < 0 || index >= steps.length) return;

        const oldStep = steps[currentStep];
        const newStep = steps[index];
        const xOut = direction === 'forward' ? -40 : 40;
        const xIn = direction === 'forward' ? 40 : -40;

        // If going to reward step (2), generate raffle + submit
        if (index === 2 && !formSubmitted) {
            await submitForm();
        }

        // Animate out
        gsap.to(oldStep, {
            x: xOut,
            opacity: 0,
            duration: 0.3,
            ease: 'power2.in',
            onComplete: () => {
                oldStep.classList.remove('is-active');
                newStep.classList.add('is-active');

                if (index === 2) {
                    // Celebration entrance — special animation
                    animateCelebration(newStep);
                } else {
                    // Normal step entrance
                    gsap.fromTo(newStep,
                        { x: xIn, opacity: 0 },
                        { x: 0, opacity: 1, duration: 0.4, ease: 'power3.out' }
                    );

                    const children = newStep.querySelectorAll(
                        '.form-page__step-header, .form-page__field, .form-page__question, .form-page__step-actions'
                    );
                    gsap.fromTo(children,
                        { y: 20, opacity: 0 },
                        { y: 0, opacity: 1, duration: 0.45, stagger: 0.08, ease: 'power3.out', delay: 0.15 }
                    );
                }
            }
        });

        updateProgress(index);
        currentStep = index;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    /* ── Celebration animation (Step 3) ── */
    function animateCelebration(step) {
        const celebration = step.querySelector('.form-page__celebration');
        const checkEl = step.querySelector('.form-page__celebration-check');
        const raffleCard = step.querySelector('.form-page__raffle-card');
        const rewardActions = step.querySelector('.form-page__reward-actions');
        const h1 = celebration.querySelector('h1');
        const p = celebration.querySelector('p');

        // Reset & show step
        gsap.set(step, { x: 0, opacity: 1 });
        gsap.set([celebration, raffleCard, rewardActions].filter(Boolean), { opacity: 0 });

        // 1. Fade in celebration
        gsap.to(celebration, { opacity: 1, duration: 0.3, delay: 0.1 });

        // 2. Animate check circle
        checkEl.classList.add('is-animated');

        // 3. Stagger text
        gsap.fromTo([h1, p],
            { y: 20, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.5, stagger: 0.12, ease: 'power3.out', delay: 0.5 }
        );

        // 4. Launch confetti
        setTimeout(() => launchConfetti(), 600);

        // 5. Slide in raffle card
        if (raffleCard) {
            gsap.fromTo(raffleCard,
                { y: 40, opacity: 0, scale: 0.95 },
                { y: 0, opacity: 1, scale: 1, duration: 0.6, ease: 'power3.out', delay: 1.0 }
            );
        }

        // 6. Slide in action buttons
        if (rewardActions) {
            gsap.fromTo(rewardActions,
                { y: 30, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.5, ease: 'power3.out', delay: 1.4 }
            );
        }
    }

    /* ── Confetti ── */
    function launchConfetti() {
        const container = document.querySelector('.form-page__confetti');
        if (!container) return;

        const colors = ['#007481', '#9AC1DE', '#103B40', '#4A708C', '#00B4D8', '#FFD166'];
        const count = 50;

        for (let i = 0; i < count; i++) {
            const piece = document.createElement('div');
            piece.className = 'form-page__confetti-piece';
            piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            piece.style.left = Math.random() * 100 + '%';
            piece.style.width = (Math.random() * 8 + 5) + 'px';
            piece.style.height = (Math.random() * 8 + 5) + 'px';
            piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
            container.appendChild(piece);

            gsap.to(piece, {
                y: window.innerHeight + 100,
                x: (Math.random() - 0.5) * 300,
                rotation: Math.random() * 720 - 360,
                opacity: 1,
                duration: Math.random() * 2 + 1.5,
                delay: Math.random() * 0.4,
                ease: 'power1.out',
                onComplete: () => piece.remove(),
            });
        }
    }

    /* ── Progress update ── */
    function updateProgress(index) {
        progressSteps.forEach((step, i) => {
            step.classList.remove('is-active', 'is-completed');
            if (i < index) step.classList.add('is-completed');
            if (i === index) step.classList.add('is-active');
        });

        // Animate dots on completion
        progressSteps.forEach((step, i) => {
            if (i < index) {
                const dot = step.querySelector('.form-page__progress-step-dot');
                gsap.fromTo(dot,
                    { scale: 1.2 },
                    { scale: 1, duration: 0.35, ease: 'elastic.out(1, 0.5)' }
                );
            }
        });

        progressLineFills.forEach((fill, i) => {
            if (i < index) {
                fill.style.width = '100%';
            } else {
                fill.style.width = '0%';
            }
        });
    }

    /* ── Form submit (background) ── */
    async function submitForm() {
        if (formSubmitted) return;
        formSubmitted = true;

        // Generate unique raffle number
        const raffleNumber = await generateRaffleNumber();

        // Display raffle number in the UI immediately
        const raffleEl = document.getElementById('raffle-number');
        if (raffleEl) raffleEl.textContent = '#' + String(raffleNumber).padStart(6, '0');

        const formData = {
            name: document.querySelector('#field-name').value.trim(),
            email: document.querySelector('#field-email').value.trim(),
            q1_laudos_mes: document.querySelector('input[name="q1"]:checked')?.value || '',
            q2_protocolos_conitec: document.querySelector('input[name="q2"]:checked')?.value || '',
            q3_falta_ferramentas: document.querySelector('input[name="q3"]:checked')?.value || '',
            q4_importancia_ferramenta: document.querySelector('input[name="q4"]:checked')?.value || '',
            raffle_number: raffleNumber,
            submitted_at: new Date().toISOString(),
        };

        try {
            const requests = [];

            // n8n webhook — use no-cors to avoid preflight block
            requests.push(
                fetch(WEBHOOK_URL, {
                    method: 'POST',
                    mode: 'no-cors',
                    headers: { 'Content-Type': 'text/plain' },
                    body: JSON.stringify(formData),
                })
            );

            // Supabase REST API
            requests.push(
                fetch(`${SUPABASE_URL}/rest/v1/form_submissions`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': SUPABASE_ANON_KEY,
                        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                        'Prefer': 'return=minimal',
                    },
                    body: JSON.stringify(formData),
                })
            );

            await Promise.allSettled(requests);
        } catch (err) {
            // Silent fail — user already sees success
        }
    }

    /* ── Event Listeners ── */
    const formEl = document.getElementById('form-medicacerto');

    nextBtns.forEach((btn) => {
        // Skip submit button — handled by form submit event
        if (btn.type === 'submit') return;

        btn.addEventListener('click', async () => {
            if (!validateStep(currentStep)) return;

            const nextIndex = parseInt(btn.dataset.next, 10);

            // Email duplicate check before leaving step 0
            if (currentStep === 0) {
                const email = document.querySelector('#field-email').value.trim();

                // Loading state
                btn.style.pointerEvents = 'none';
                btn.style.opacity = '0.7';

                const exists = await checkEmailExists(email);

                btn.style.pointerEvents = '';
                btn.style.opacity = '';

                if (exists) {
                    showEmailError('Este e-mail já está cadastrado.');
                    shakeField(document.querySelector('#field-email'));
                    return;
                }

                clearEmailError();
            }

            goToStep(nextIndex, 'forward');
        });
    });

    /* ── Form submit (Finalizar button) ── */
    if (formEl) {
        formEl.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (!validateStep(currentStep)) return;

            const submitBtn = document.getElementById('btn-submit');
            if (submitBtn) {
                submitBtn.style.pointerEvents = 'none';
                submitBtn.style.opacity = '0.7';
            }

            const nextIndex = parseInt(submitBtn?.dataset.next, 10) || 2;
            await goToStep(nextIndex, 'forward');

            if (submitBtn) {
                submitBtn.style.pointerEvents = '';
                submitBtn.style.opacity = '';
            }
        });
    }

    backBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
            const backIndex = parseInt(btn.dataset.back, 10);
            goToStep(backIndex, 'backward');
        });
    });

    /* ── Prototype button ── */
    if (prototypeBtn) {
        prototypeBtn.addEventListener('click', () => {
            window.location.href = './prototype.html';
        });
    }

    /* ── Entrance animation for step 1 ── */
    const firstStep = steps[0];
    if (firstStep) {
        const children = firstStep.querySelectorAll(
            '.form-page__step-header, .form-page__field, .form-page__step-actions'
        );
        gsap.fromTo(children,
            { y: 25, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: 'power3.out', delay: 0.2 }
        );
    }

    /* ── Question answered feedback ── */
    document.querySelectorAll('.form-page__option input[type="radio"]').forEach((radio) => {
        radio.addEventListener('change', () => {
            // Bounce option
            const option = radio.closest('.form-page__option');
            gsap.fromTo(option, { scale: 0.98 }, { scale: 1, duration: 0.3, ease: 'elastic.out(1, 0.5)' });

            // Mark question as answered
            const question = radio.closest('.form-page__question');
            if (question && !question.classList.contains('is-answered')) {
                question.classList.add('is-answered');
            }
        });
    });

    document.querySelectorAll('.form-page__scale-item input[type="radio"]').forEach((radio) => {
        radio.addEventListener('change', () => {
            const item = radio.closest('.form-page__scale-item');
            gsap.fromTo(item, { scale: 0.9 }, { scale: 1, duration: 0.35, ease: 'elastic.out(1, 0.5)' });

            // Mark question as answered
            const question = radio.closest('.form-page__question');
            if (question && !question.classList.contains('is-answered')) {
                question.classList.add('is-answered');
            }
        });
    });

    /* ── Keyboard: Enter to advance ── */
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && currentStep === 0) {
            const activeEl = document.activeElement;
            if (activeEl && activeEl.tagName === 'INPUT') {
                e.preventDefault();
                if (validateStep(0)) goToStep(1, 'forward');
            }
        }
    });
});
