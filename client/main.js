const LOCAL_MOCK = {
    query: "Show me active murder cases in Mysuru with CCTV reports",
    generated_zcql: "SELECT * FROM CaseMaster WHERE PoliceStationID IN (SELECT UnitID FROM Unit WHERE DistrictID = 404) AND CaseStatusID = 1",
    data_source: "Local Intelligence Engine (Mock)",
    summary: {
        totalCrimes: "4,213",
        activeFIRs: "842",
        crimeCategories: 12,
        monthlyChange: "+28%"
    },
    trend: {
        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"],
        values: [382, 410, 446, 393, 472, 505, 623]
    },
    categories: {
        labels: ["Theft", "Assault", "Robbery", "Cyber", "Financial"],
        values: [28, 21, 18, 13, 10]
    },
    hotspots: [
        { name: "Nazarbad", level: "Critical", score: 91, description: "Marketplace cluster with rising repeat offenders." },
        { name: "Mysuru Central", level: "High", score: 82, description: "Frequent violent crimes and public transport risk." },
        { name: "VV Puram", level: "Elevated", score: 74, description: "Property offences and coordinated theft rings." },
        { name: "Chamundi Hills", level: "Moderate", score: 61, description: "Nighttime burglary patterns near tourist zones." },
        { name: "Hebbal", level: "Watch", score: 52, description: "Suspicious transaction cluster with local vendors." }
    ],
    network: {
        central: "Anand Kumar",
        links: [
            { label: "Accused", target: "Ramesh Naik" },
            { label: "Victim", target: "N. Shruthi" },
            { label: "Bank", target: "Acct *0029" },
            { label: "Vehicle", target: "KA-05 AB 1234" },
            { label: "Phone", target: "+91 98450 88441" }
        ]
    },
    offender: {
        riskScore: 92,
        repeatOffender: true,
        mostCommonCrime: "Vehicle Theft",
        mostActiveArea: "Bengaluru East",
        associatedPersons: 14,
        knownVehicles: 5,
        previousFIRs: 18,
        summary: "High risk profile with multiple repeat offenses, gang connections and emerging hotspot activity."
    },
    forecast: {
        division: "North Division",
        probability: 82,
        interval: "Next 7 Days",
        prediction: "Hotspots and burglary risk are rising along transit corridors.",
        recommendation: "Deploy rapid response teams to Nazarbad and Mysuru Central"
    },
    finance: {
        trail: ["Acct *8841 (Anand K.)", "M-Wallet Gateway", "UPI", "Acct *0029 (Ramesh N.)"],
        value: "₹45,000.00",
        pattern: "Layered micro-transfers across wallet and UPI nodes"
    },
    explainable: {
        score: 92,
        reasons: ["18 previous FIRs", "Same modus operandi", "Linked to 4 gangs", "Active in 3 districts"],
        evidence: ["FIR: 2024-122", "FIR: 2023-817", "FIR: 2022-448"]
    },
    caseSummary: {
        victim: "N. Shruthi",
        incident: "Burglary",
        suspects: 3,
        relatedFIRs: 7,
        recommended: "Check Vehicle KA-05 AB 1234",
        confidence: "91%"
    },
    conversation: {
        user: "Show all burglary cases near Mysuru in last 6 months.",
        ai: "Found 84 cases. Top hotspot: Nazarbad. Repeat offenders: 12. Would you like network analysis?"
    }
};

const charts = { trend: null, category: null };

async function runAnalysis() {
    const query = document.getElementById('queryInput').value.trim();
    const btn = document.getElementById('submitBtn');

    btn.disabled = true;
    btn.innerHTML = `<i class="fa-solid fa-spinner animate-spin"></i> Processing Pipeline...`;

    try {
        if (!query) throw new Error('Please enter a valid query.');

        const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname) || window.location.protocol === 'file:';
        const payload = isLocal ? simulateQuery(query) : await fetchRemoteAnalytics(query);
        renderDashboard(payload);
        renderUI(payload.generated_zcql, payload.data_source);
    } catch (error) {
        console.warn('Local fallback engaged:', error.message);
        const payload = simulateQuery(query || LOCAL_MOCK.query);
        renderDashboard(payload);
        renderUI(payload.generated_zcql, payload.data_source);
    } finally {
        btn.disabled = false;
        btn.innerHTML = `<i class="fa-solid fa-circle-play"></i> Execute Engine`;
    }
}

function startVoiceRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        alert('Voice recognition is not available in this browser.');
        return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        document.getElementById('queryInput').value = transcript;
        runAnalysis();
    };

    recognition.onerror = () => {
        alert('Voice interaction could not start. Please type your query instead.');
    };

    recognition.start();
}

async function fetchRemoteAnalytics(query) {
    const baseUrl = 'https://new-project-60078355625.development.catalystserverless.in';
    const response = await fetch(`${baseUrl}/server/detective_bot/?question=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error('Remote analytics endpoint failed');
    const json = await response.json();
    if (json.analytics) {
        return {
            ...json.analytics,
            generated_zcql: json.generated_zcql || '',
            data_source: json.data_source || 'Remote Analytics Engine'
        };
    }
    return json;
}

function simulateQuery(query) {
    const payload = JSON.parse(JSON.stringify(LOCAL_MOCK));
    payload.query = query;
    payload.generated_zcql = query.toLowerCase().includes('mysuru')
        ? "SELECT * FROM CaseMaster WHERE PoliceStationID IN (SELECT UnitID FROM Unit WHERE DistrictID = 404) AND CaseType = 'Burglary'"
        : LOCAL_MOCK.generated_zcql;

    if (query.toLowerCase().includes('burglary')) {
        payload.summary.totalCrimes = "4,842";
        payload.summary.activeFIRs = "912";
        payload.summary.monthlyChange = "+33%";
        payload.forecast.probability = 87;
        payload.conversation.ai = "Found 84 burglary cases. Top hotspot: Nazarbad. Repeat offenders: 12. Would you like network analysis?";
        payload.explainable.reasons = ["12 burglary FIRs", "Repeat location pattern", "Known offenders in area", "Vehicle linkage confirmed"];
    }
    return payload;
}

function renderDashboard(data) {
    updateSummary(data.summary);
    renderTrendChart(data.trend);
    renderCategoryChart(data.categories);
    renderHeatmap(data.hotspots);
    renderNetworkGraph(data.network);
    renderOffenderProfile(data.offender);
    renderForecast(data.forecast);
    renderFinanceTrail(data.finance);
    renderExplainable(data.explainable);
    renderCaseSummary(data.caseSummary);
    renderConversationExample(data.conversation);
}

function updateSummary(summary) {
    document.getElementById('metricTotalCrimes').innerText = summary.totalCrimes;
    document.getElementById('metricActiveFIRs').innerText = summary.activeFIRs;
    document.getElementById('metricCategories').innerText = summary.crimeCategories;
}

function renderTrendChart(trend) {
    const ctx = document.getElementById('trendChart').getContext('2d');
    if (charts.trend) charts.trend.destroy();
    charts.trend = new Chart(ctx, {
        type: 'line',
        data: {
            labels: trend.labels,
            datasets: [{
                label: 'Crime reports',
                data: trend.values,
                borderColor: '#38bdf8',
                backgroundColor: 'rgba(56, 189, 248, 0.18)',
                fill: true,
                tension: 0.35,
                pointRadius: 4,
                pointBackgroundColor: '#7dd3fc'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { display: false }, ticks: { color: '#94a3b8' } },
                y: { grid: { color: 'rgba(148, 163, 184, 0.2)' }, ticks: { color: '#94a3b8' }, beginAtZero: true }
            }
        }
    });
}

function renderCategoryChart(categories) {
    const ctx = document.getElementById('categoryChart').getContext('2d');
    if (charts.category) charts.category.destroy();
    charts.category = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: categories.labels,
            datasets: [{
                label: 'Cases',
                data: categories.values,
                backgroundColor: ['#fb7185', '#fcd34d', '#60a5fa', '#34d399', '#a78bfa']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { grid: { display: false }, ticks: { color: '#94a3b8' } },
                y: { grid: { color: 'rgba(148, 163, 184, 0.2)' }, ticks: { color: '#94a3b8' }, beginAtZero: true }
            }
        }
    });
}

function renderHeatmap(hotspots) {
    const grid = document.getElementById('heatmapGrid');
    grid.innerHTML = hotspots.map(item => {
        const className = item.score >= 85 ? 'heatmap-high' : item.score >= 70 ? 'heatmap-medium' : 'heatmap-low';
        return `
            <div class="heatmap-cell ${className}">
                <div>
                    <span class="text-[10px] uppercase tracking-wider text-slate-300">${item.name}</span>
                    <p class="text-xl font-bold text-white">${item.score}%</p>
                    <p class="text-[11px] text-slate-200 mt-1">${item.level}</p>
                </div>
            </div>
        `;
    }).join('');
}

function renderNetworkGraph(network) {
    const container = document.getElementById('networkGraph');
    container.innerHTML = `
        <div class="network-node network-central">${network.central}</div>
        <div class="network-links">
            ${network.links.map(link => `
                <div class="network-link">
                    <div class="network-label">${link.label}</div>
                    <div class="network-node network-edge-node">${link.target}</div>
                </div>
            `).join('')}
        </div>
    `;
}

function renderOffenderProfile(profile) {
    document.getElementById('offenderProfile').innerHTML = `
        <div class="rounded-2xl bg-slate-950 border border-slate-800 p-4">
            <div class="flex items-center justify-between gap-4">
                <div>
                    <span class="text-[10px] uppercase tracking-wider text-slate-500">Risk Score</span>
                    <p class="text-4xl font-bold text-red-400">${profile.riskScore}%</p>
                </div>
                <span class="px-3 py-1 rounded-full bg-red-500/10 text-red-300 text-[10px] uppercase tracking-wider">${profile.repeatOffender ? 'Repeat Offender' : 'New Case'}</span>
            </div>
            <p class="text-slate-400 text-sm mt-4">${profile.summary}</p>
        </div>
        <div class="grid grid-cols-2 gap-3 text-[11px] text-slate-300">
            <div class="bg-slate-950 border border-slate-800 rounded-xl p-3"><span class="block text-slate-500">Most Common Crime</span><strong>${profile.mostCommonCrime}</strong></div>
            <div class="bg-slate-950 border border-slate-800 rounded-xl p-3"><span class="block text-slate-500">Most Active Area</span><strong>${profile.mostActiveArea}</strong></div>
            <div class="bg-slate-950 border border-slate-800 rounded-xl p-3"><span class="block text-slate-500">Associated Persons</span><strong>${profile.associatedPersons}</strong></div>
            <div class="bg-slate-950 border border-slate-800 rounded-xl p-3"><span class="block text-slate-500">Previous FIRs</span><strong>${profile.previousFIRs}</strong></div>
        </div>
    `;
}

function renderForecast(forecast) {
    document.getElementById('forecastPanel').innerHTML = `
        <div class="rounded-2xl bg-slate-950 border border-slate-800 p-5 space-y-4">
            <div class="flex items-center justify-between gap-3">
                <div>
                    <span class="text-[10px] uppercase tracking-wider text-slate-500">Division</span>
                    <p class="text-lg font-bold text-white">${forecast.division}</p>
                </div>
                <div class="text-right">
                    <span class="text-[10px] uppercase tracking-wider text-slate-500">Probability</span>
                    <p class="text-3xl font-bold text-emerald-400">${forecast.probability}%</p>
                </div>
            </div>
            <p class="text-slate-300 text-sm">${forecast.prediction}</p>
            <div class="rounded-xl bg-slate-900 border border-slate-800 p-4 text-[11px] text-slate-300">
                <span class="block text-slate-400 uppercase tracking-wider text-[10px]">Recommendation</span>
                <p class="mt-2">${forecast.recommendation}</p>
            </div>
        </div>
    `;
}

function renderFinanceTrail(finance) {
    document.getElementById('financialTrail').innerHTML = `
        <div class="space-y-3">
            <div class="rounded-2xl bg-slate-950 border border-slate-800 p-4">
                <div class="text-[10px] uppercase tracking-wider text-slate-500">Suspicious value</div>
                <div class="text-2xl font-bold text-emerald-400 mt-2">${finance.value}</div>
                <p class="text-slate-400 text-sm mt-2">${finance.pattern}</p>
            </div>
            <div class="space-y-2">
                ${finance.trail.map((node, index) => `
                    <div class="flex items-center gap-3">
                        <div class="h-9 w-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 text-xs">${index + 1}</div>
                        <div class="flex-1 bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm text-slate-200">${node}</div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function renderExplainable(explainable) {
    document.getElementById('explainableAi').innerHTML = `
        <div class="grid gap-4">
            <div class="rounded-2xl bg-slate-950 border border-slate-800 p-4">
                <div class="flex items-center justify-between gap-4">
                    <div><span class="text-[10px] uppercase tracking-wider text-slate-500">Risk Score</span><p class="text-3xl font-bold text-red-400">${explainable.score}%</p></div>
                    <span class="text-[10px] uppercase tracking-wider text-slate-500">Reason set</span>
                </div>
            </div>
            <div class="grid gap-3">
                ${explainable.reasons.map(reason => `<div class="rounded-xl bg-slate-950 border border-slate-800 p-3 text-sm text-slate-200">✓ ${reason}</div>`).join('')}
            </div>
            <div class="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-sm text-slate-200">
                <span class="text-[10px] uppercase tracking-wider text-slate-500">Evidence</span>
                <ul class="mt-2 space-y-2">
                    ${explainable.evidence.map(item => `<li class="flex items-center gap-2"><span class="inline-block h-2 w-2 rounded-full bg-emerald-400"></span>${item}</li>`).join('')}
                </ul>
            </div>
        </div>
    `;
}

function renderCaseSummary(summary) {
    document.getElementById('caseSummary').innerHTML = `
        <div class="rounded-2xl bg-slate-950 border border-slate-800 p-5 space-y-4">
            <div>
                <p class="text-[10px] uppercase tracking-wider text-slate-500">Victim</p>
                <p class="text-lg font-bold text-white">${summary.victim}</p>
            </div>
            <div class="grid grid-cols-2 gap-3 text-sm text-slate-300">
                <div class="bg-slate-900 rounded-2xl p-3"><span class="block text-slate-500">Incident</span>${summary.incident}</div>
                <div class="bg-slate-900 rounded-2xl p-3"><span class="block text-slate-500">Suspects</span>${summary.suspects}</div>
                <div class="bg-slate-900 rounded-2xl p-3"><span class="block text-slate-500">Related FIRs</span>${summary.relatedFIRs}</div>
                <div class="bg-slate-900 rounded-2xl p-3"><span class="block text-slate-500">Confidence</span>${summary.confidence}</div>
            </div>
            <div class="rounded-xl bg-slate-900 border border-slate-800 p-4 text-sm text-slate-200">
                <span class="text-[10px] uppercase tracking-wider text-slate-500">Recommended Next Step</span>
                <p class="mt-2">${summary.recommended}</p>
            </div>
        </div>
    `;
}

function renderConversationExample(conversation) {
    document.getElementById('resultsWrapper').innerHTML = `
        <div class="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div class="text-xs uppercase tracking-wider text-slate-400">Conversational AI</div>
            <div class="space-y-4">
                <div class="rounded-2xl bg-slate-950 border border-slate-800 p-4">
                    <div class="text-[10px] uppercase tracking-wider text-slate-500">User</div>
                    <p class="mt-2 text-slate-100">${conversation.user}</p>
                </div>
                <div class="rounded-2xl bg-slate-950 border border-slate-800 p-4">
                    <div class="text-[10px] uppercase tracking-wider text-slate-500">AI</div>
                    <p class="mt-2 text-slate-100">${conversation.ai}</p>
                </div>
            </div>
        </div>
    `;
}

function renderUI(zcql, source) {
    document.getElementById('debugZcql').innerText = zcql;
    document.getElementById('debugSource').innerText = source;
    document.getElementById('recordCount').innerText = `4 Analytical Vectors Mapped`;
}

function initDashboard() {
    renderDashboard(LOCAL_MOCK);
    renderUI(LOCAL_MOCK.generated_zcql, LOCAL_MOCK.data_source);
}

window.addEventListener('DOMContentLoaded', initDashboard);
