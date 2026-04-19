/* ============================================
   MEDICA CERTO — Prototype Search Engine
   ============================================ */

(function () {
    'use strict';

    /* ── DOM refs ── */
    const searchInput = document.getElementById('proto-search');
    const clearBtn = document.getElementById('proto-clear');
    const statsEl = document.getElementById('proto-stats');
    const cardsEl = document.getElementById('proto-cards');
    const emptyEl = document.getElementById('proto-empty');
    const noResultsEl = document.getElementById('proto-no-results');

    /* ── State ── */
    let data = [];
    let searchIndex = [];       // flattened index for fast matching
    let debounceTimer = null;

    /* ── Load data ── */
    fetch('./data/medicamentos.json')
        .then(r => r.json())
        .then(raw => {
            data = raw;
            buildIndex(raw);
            searchInput.focus();
        })
        .catch(() => {
            statsEl.textContent = 'Erro ao carregar dados.';
        });

    /**
     * Build a flat search index so every diretriz can be found
     * by its name, any CID code, or any CID description.
     */
    function buildIndex(items) {
        searchIndex = items.map((item, i) => {
            const cidTexts = item.cids
                .filter(c => c.code !== 'Não preconiza')
                .map(c => `${c.code} ${c.desc}`.toLowerCase());
            return {
                idx: i,
                diretriz: item.diretriz.toLowerCase(),
                cidTexts,
                all: [item.diretriz.toLowerCase(), ...cidTexts].join(' ')
            };
        });
    }

    /* ── Normalize string (remove accents) ── */
    function normalize(str) {
        return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    }

    /* ── Search logic ── */
    function search(query) {
        const q = normalize(query.trim());
        if (!q) {
            showEmpty();
            return;
        }

        const tokens = q.split(/\s+/).filter(Boolean);

        const scored = [];
        for (const entry of searchIndex) {
            const normalizedAll = normalize(entry.all);

            // every token must appear somewhere
            let matchAll = true;
            for (const t of tokens) {
                if (!normalizedAll.includes(t)) {
                    matchAll = false;
                    break;
                }
            }
            if (!matchAll) continue;

            // score: prefer diretriz match > CID code exact > CID desc
            let score = 0;
            const normalizedDir = normalize(entry.diretriz);
            if (normalizedDir.includes(q)) score += 100;
            for (const t of tokens) {
                if (normalizedDir.includes(t)) score += 10;
            }
            for (const cid of entry.cidTexts) {
                const normalizedCid = normalize(cid);
                if (normalizedCid.includes(q)) score += 50;
            }

            scored.push({ entry, score });
        }

        scored.sort((a, b) => b.score - a.score);

        if (scored.length === 0) {
            showNoResults();
            return;
        }

        renderResults(scored.map(s => s.entry), q, tokens);
    }

    /* ── Render ── */
    function renderResults(entries, query, tokens) {
        emptyEl.hidden = true;
        noResultsEl.hidden = true;
        cardsEl.innerHTML = '';

        statsEl.textContent = `${entries.length} diretriz${entries.length !== 1 ? 'es' : ''} encontrada${entries.length !== 1 ? 's' : ''}`;

        const fragment = document.createDocumentFragment();

        for (const entry of entries) {
            const item = data[entry.idx];
            fragment.appendChild(buildCard(item, query, tokens));
        }

        cardsEl.appendChild(fragment);

        // GSAP entrance animation
        if (typeof gsap !== 'undefined') {
            gsap.from('.proto__card', {
                y: 20,
                opacity: 0,
                duration: 0.4,
                stagger: 0.06,
                ease: 'power2.out',
                clearProps: 'all'
            });
        }
    }

    function buildCard(item, query, tokens) {
        const card = document.createElement('div');
        card.className = 'proto__card';

        // Filter CIDs that are actual medical codes
        const realCids = item.cids.filter(c => c.code !== 'Não preconiza');
        const realMeds = item.medicamentos.filter(m =>
            m !== 'Não preconiza medicamentos' &&
            m !== 'Conforme autonomia do serviço' &&
            m !== 'Consultar PCDT' &&
            m !== 'Não preconiza'
        );

        // Check which CIDs match the search
        const matchedCidCodes = new Set();
        for (const cid of realCids) {
            const cidStr = normalize(`${cid.code} ${cid.desc}`);
            for (const t of tokens) {
                if (cidStr.includes(t)) {
                    matchedCidCodes.add(cid.code);
                    break;
                }
            }
        }

        card.innerHTML = `
            <div class="proto__card-header">
                <div class="proto__card-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M8 2v4" /><path d="M16 2v4" />
                        <rect width="18" x="3" y="4" height="18" rx="2" />
                        <path d="M3 10h18" />
                        <path d="M8 14h.01" /><path d="M12 14h.01" /><path d="M16 14h.01" />
                        <path d="M8 18h.01" /><path d="M12 18h.01" />
                    </svg>
                </div>
                <div class="proto__card-title">
                    <h2>${escapeHtml(item.diretriz)}</h2>
                    ${item.portaria ? `<span>${escapeHtml(item.portaria)}</span>` : ''}
                </div>
            </div>

            ${realCids.length > 0 ? `
            <div class="proto__card-cids">
                <h3>CIDs relacionados</h3>
                <div class="proto__card-cid-list">
                    ${realCids.map(c => `
                        <div class="proto__card-cid${matchedCidCodes.has(c.code) ? ' is-match' : ''}">
                            <code>${escapeHtml(c.code)}</code>
                            <span>${escapeHtml(c.desc)}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}

            ${realMeds.length > 0 ? `
            <div class="proto__card-meds">
                <h3>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z" />
                        <path d="m8.5 8.5 7 7" />
                    </svg>
                    Medicamentos (${realMeds.length})
                </h3>
                <div class="proto__card-med-list">
                    ${realMeds.map(m => `<div class="proto__card-med">${escapeHtml(m)}</div>`).join('')}
                </div>
            </div>
            ` : `
            <div class="proto__card-meds">
                <h3>Medicamentos</h3>
                <p style="font-size:14px;color:var(--color-text-muted);">${escapeHtml(item.medicamentos[0] || 'Não preconiza medicamentos')}</p>
            </div>
            `}
        `;

        return card;
    }

    /* ── State helpers ── */
    function showEmpty() {
        cardsEl.innerHTML = '';
        emptyEl.hidden = false;
        noResultsEl.hidden = true;
        statsEl.textContent = '';
    }

    function showNoResults() {
        cardsEl.innerHTML = '';
        emptyEl.hidden = true;
        noResultsEl.hidden = false;
        statsEl.textContent = '0 resultados';
    }

    /* ── Utility ── */
    function escapeHtml(str) {
        const el = document.createElement('span');
        el.textContent = str;
        return el.innerHTML;
    }

    /* ── Events ── */
    searchInput.addEventListener('input', () => {
        const val = searchInput.value;
        clearBtn.hidden = val.length === 0;

        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => search(val), 150);
    });

    clearBtn.addEventListener('click', () => {
        searchInput.value = '';
        clearBtn.hidden = true;
        showEmpty();
        searchInput.focus();
    });

    // Enter key also triggers immediate search
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            clearTimeout(debounceTimer);
            search(searchInput.value);
        }
    });

})();
