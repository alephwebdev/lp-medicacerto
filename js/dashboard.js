/* ============================================
   MEDICA CERTO — Dashboard JS
   ============================================ */

'use strict';

document.addEventListener('DOMContentLoaded', async () => {

    /* ── Supabase config ── */
    const SUPABASE_URL = 'https://sflxtwjyrtpbvnfppamt.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNmbHh0d2p5cnRwYnZuZnBwYW10Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1NjMxMDcsImV4cCI6MjA5MjEzOTEwN30.XM_avfHn9gqYduGL9AU2nQxnKM8b2d5ubTFKwT0E1bY';

    /* ── Brand palette for charts ── */
    const COLORS = {
        teal500: '#007481',
        teal800: '#103B40',
        blue300: '#9AC1DE',
        blue600: '#4A708C',
        cyan: '#00B4D8',
        gold: '#FFD166',
        neutral200: '#EEEEEE',
        neutral400: '#BDBDBD',
        neutral600: '#757575',
    };

    const CHART_PALETTE = [
        COLORS.teal500,
        COLORS.blue300,
        COLORS.blue600,
        COLORS.cyan,
        COLORS.gold,
        COLORS.teal800,
    ];

    /* ── Chart.js global defaults ── */
    Chart.defaults.font.family = "'Instrument Sans', system-ui, sans-serif";
    Chart.defaults.font.size = 13;
    Chart.defaults.color = COLORS.neutral600;
    Chart.defaults.plugins.legend.display = false;
    Chart.defaults.plugins.tooltip.backgroundColor = COLORS.teal800;
    Chart.defaults.plugins.tooltip.cornerRadius = 8;
    Chart.defaults.plugins.tooltip.padding = 10;
    Chart.defaults.plugins.tooltip.titleFont = { weight: '600', size: 13 };
    Chart.defaults.plugins.tooltip.bodyFont = { size: 12 };

    /* ── DOM refs ── */
    const statusEl = document.getElementById('status-indicator');
    const kpiTotal = document.getElementById('kpi-total');
    const kpiToday = document.getElementById('kpi-today');
    const kpiNeed = document.getElementById('kpi-need');
    const kpiLast = document.getElementById('kpi-last');
    const tableBody = document.getElementById('table-body');
    const tableCount = document.getElementById('table-count');

    /* ── Fetch data from Supabase ── */
    let rows = [];

    try {
        const res = await fetch(
            `${SUPABASE_URL}/rest/v1/form_submissions?select=*&order=submitted_at.desc`,
            {
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                },
            }
        );

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        rows = await res.json();

        statusEl.classList.add('is-live');
        statusEl.querySelector('span:last-child').textContent = `Conectado · ${rows.length} registros`;
    } catch (err) {
        statusEl.classList.add('is-error');
        statusEl.querySelector('span:last-child').textContent = 'Erro ao conectar';
        tableBody.innerHTML = '<tr><td colspan="7" class="dash__table-empty">Erro ao carregar dados do Supabase</td></tr>';
        return;
    }

    if (rows.length === 0) {
        kpiTotal.textContent = '0';
        kpiToday.textContent = '0';
        kpiNeed.textContent = '—';
        kpiLast.textContent = 'Nenhuma';
        tableBody.innerHTML = '<tr><td colspan="7" class="dash__table-empty">Nenhuma resposta ainda</td></tr>';
        tableCount.textContent = '0 registros';
        return;
    }

    /* ── KPI Calculations ── */
    const total = rows.length;
    const todayStr = new Date().toISOString().slice(0, 10);
    const todayCount = rows.filter(r => r.submitted_at && r.submitted_at.slice(0, 10) === todayStr).length;

    // % who feel the need for the tool (Q3 = "Sim, com frequência" or "Às vezes")
    const needCount = rows.filter(r =>
        r.q3_falta_ferramentas === 'Sim, com frequência' ||
        r.q3_falta_ferramentas === 'Às vezes'
    ).length;
    const needPct = total > 0 ? Math.round((needCount / total) * 100) + '%' : '—';

    const lastDate = rows[0].submitted_at
        ? new Date(rows[0].submitted_at).toLocaleString('pt-BR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        })
        : '—';

    /* Animate KPIs */
    animateValue(kpiTotal, 0, total, 600);
    animateValue(kpiToday, 0, todayCount, 600);
    kpiNeed.textContent = needPct;
    kpiLast.textContent = lastDate;

    function animateValue(el, start, end, duration) {
        if (end === 0) { el.textContent = '0'; return; }
        const range = end - start;
        const startTime = performance.now();
        function tick(now) {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            el.textContent = Math.round(start + range * eased);
            if (progress < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
    }

    /* ── Helper: count occurrences ── */
    function countBy(field, labels) {
        const counts = {};
        labels.forEach(l => counts[l] = 0);
        rows.forEach(r => {
            const val = r[field];
            if (val in counts) counts[val]++;
        });
        return labels.map(l => counts[l]);
    }

    /* ── Q1 Chart: Doughnut ── */
    const q1Labels = ['Nenhum', 'Até 5', 'De 6 a 15', 'Mais de 15'];
    const q1Data = countBy('q1_laudos_mes', q1Labels);

    new Chart(document.getElementById('chart-q1'), {
        type: 'doughnut',
        data: {
            labels: q1Labels,
            datasets: [{
                data: q1Data,
                backgroundColor: CHART_PALETTE.slice(0, 4),
                borderWidth: 0,
                hoverOffset: 6,
            }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '62%',
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        padding: 16,
                        usePointStyle: true,
                        pointStyleWidth: 10,
                        font: { size: 12, weight: '500' },
                    },
                },
            },
        },
    });

    /* ── Q2 Chart: Horizontal bar ── */
    const q2Labels = ['Sim, totalmente', 'Sim, mas com dificuldades', 'Não, difícil acesso', 'Não, difícil acesso e compreensão'];
    const q2Data = countBy('q2_protocolos_conitec', q2Labels);

    new Chart(document.getElementById('chart-q2'), {
        type: 'bar',
        data: {
            labels: q2Labels,
            datasets: [{
                data: q2Data,
                backgroundColor: COLORS.teal500,
                borderRadius: 8,
                barThickness: 28,
            }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: { stepSize: 1, precision: 0 },
                    grid: { color: COLORS.neutral200 },
                },
                y: {
                    grid: { display: false },
                    ticks: {
                        font: { size: 12 },
                        callback: function (value) {
                            const label = this.getLabelForValue(value);
                            return label.length > 25 ? label.slice(0, 25) + '…' : label;
                        },
                    },
                },
            },
        },
    });

    /* ── Q3 Chart: Doughnut ── */
    const q3Labels = ['Sim, com frequência', 'Às vezes', 'Não sinto falta'];
    const q3Data = countBy('q3_falta_ferramentas', q3Labels);

    new Chart(document.getElementById('chart-q3'), {
        type: 'doughnut',
        data: {
            labels: q3Labels,
            datasets: [{
                data: q3Data,
                backgroundColor: [COLORS.teal500, COLORS.blue300, COLORS.neutral400],
                borderWidth: 0,
                hoverOffset: 6,
            }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '62%',
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        padding: 16,
                        usePointStyle: true,
                        pointStyleWidth: 10,
                        font: { size: 12, weight: '500' },
                    },
                },
            },
        },
    });

    /* ── Q4 Chart: Bar (scale 0-5) ── */
    const q4Labels = ['0', '1', '2', '3', '4', '5'];
    const q4Data = countBy('q4_importancia_ferramenta', q4Labels);

    new Chart(document.getElementById('chart-q4'), {
        type: 'bar',
        data: {
            labels: q4Labels,
            datasets: [{
                data: q4Data,
                backgroundColor: q4Labels.map((_, i) => {
                    const opacity = 0.3 + (i / 5) * 0.7;
                    return `rgba(0, 116, 129, ${opacity})`;
                }),
                borderRadius: 8,
                barThickness: 36,
            }],
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { stepSize: 1, precision: 0 },
                    grid: { color: COLORS.neutral200 },
                },
                x: {
                    grid: { display: false },
                },
            },
        },
    });


    /* ── Recent Submissions Table ── */
    const recent = rows.slice(0, 20);
    tableCount.textContent = `${total} registros`;

    tableBody.innerHTML = recent.map(r => {
        const date = r.submitted_at
            ? new Date(r.submitted_at).toLocaleString('pt-BR', {
                day: '2-digit', month: '2-digit',
                hour: '2-digit', minute: '2-digit',
            })
            : '—';

        const esc = (s) => {
            if (!s) return '—';
            const div = document.createElement('div');
            div.textContent = s;
            return div.innerHTML;
        };

        const maskName = (name) => {
            if (!name) return '—';
            const parts = name.trim().split(' ');
            if (parts.length === 1) {
                return parts[0].length <= 2 ? parts[0] : parts[0][0] + '****';
            }
            return parts[0] + ' ' + parts.slice(1).map(p => p[0] + '****').join(' ');
        };

        const maskEmail = (email) => {
            if (!email) return '—';
            const [local, domain] = email.split('@');
            if (!domain) return '****';
            const visible = local.slice(0, 3);
            return visible + '****@' + domain;
        };

        return `<tr>
            <td>${esc(maskName(r.name))}</td>
            <td>${esc(maskEmail(r.email))}</td>
            <td>${esc(r.q1_laudos_mes)}</td>
            <td>${esc(r.q2_protocolos_conitec)}</td>
            <td>${esc(r.q3_falta_ferramentas)}</td>
            <td>${esc(r.q4_importancia_ferramenta)}</td>
            <td>${date}</td>
        </tr>`;
    }).join('');

    /* ── RLS Note: Needs SELECT policy for anon ── */
    // If data doesn't load, run in Supabase SQL Editor:
    // CREATE POLICY "Allow anon select" ON form_submissions FOR SELECT TO anon USING (true);
});
