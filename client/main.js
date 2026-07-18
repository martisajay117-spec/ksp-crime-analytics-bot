const LANGUAGE_TEXT = {
  EN: {
    headerTitle: 'Department of Police - Crime Analytics',
    tabDashboard: 'Dashboard',
    tabRisk: 'Risk Analysis',
    tabProfiles: 'Suspect Profiles',
    labelTotalCases: 'Total Cases',
    labelActiveFIRs: 'Active FIRs',
    labelCategories: 'Crime Categories',
    labelMonthlyChange: 'Monthly Change',
    labelTrend: 'Monthly Trend',
    labelCategory: 'Category Distribution',
    labelAlert: 'Security Alert',
    alertTitle: 'High Risk Incident Detected',
    riskTitle: 'Risk Assessment',
    profilesTitle: 'Suspect Profiles',
    btnViewRisk: 'View Risk',
    btnOpenRisk: 'Open Risk Analysis',
    btnViewProfile: 'View Accused Profile',
  },
  KN: {
    headerTitle: 'ಪಾಲೀಸ್ ಇಲಾಖೆ - ಅಪರಾಧ ವಿಶ್ಲೇಷಣೆ',
    tabDashboard: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
    tabRisk: 'ರಿಸ್ಕ್ ವಿಶ್ಲೇಷಣೆ',
    tabProfiles: 'ಸಂದಿಗ್ಧ ವ್ಯಕ್ತಿಗಳು',
    labelTotalCases: 'ಒಟ್ಟು ಪ್ರಕರಣಗಳು',
    labelActiveFIRs: 'ಸಕ್ರಿಯ FIR ಗಳು',
    labelCategories: 'ಅಮಾನ್ಯ ವರ್ಗಗಳು',
    labelMonthlyChange: 'ತಿಂಗಳ ಬದಲಾವಣೆ',
    labelTrend: 'ತಿಂಗಳ ಪ್ರವೃತ್ತಿ',
    labelCategory: 'ವರ್ಗೀಕರಣ ವಿತರಣೆ',
    labelAlert: 'ಭದ್ರತಾ ಎಚ್ಚರಿಕೆ',
    alertTitle: 'ಅತ್ಯಂತ ಅಪಾಯಕಾರಿ ಘಟನೆ ಪತ್ತೆಯಾಯಿತು',
    riskTitle: 'ಅಪಾಯ ಮೌಲ್ಯಮಾಪನ',
    profilesTitle: 'ಸಂದಿಗ್ಧ ವ್ಯಕ್ತಿಗಳ ಪ್ರೊಫೈಲುಗಳು',
    btnViewRisk: 'ಅಪಾಯ ವೀಕ್ಷಿಸಿ',
    btnOpenRisk: 'ರಿಸ್ಕ್ ವಿಶ್ಲೇಷಣೆಯನ್ನು ತೆರೆಯಿರಿ',
    btnViewProfile: 'ಆರೋಪಿ ಪ್ರೊಫೈಲನ್ನು ವೀಕ್ಷಿಸಿ',
  }
};

const personProfiles = [
  {
    id: 1,
    name: 'Ramesh Naik',
    age: 38,
    photo: 'https://via.placeholder.com/220?text=Ramesh',
    aliases: ['R. Naik', 'Ramu'],
    history: ['2019: Property theft', '2021: Extortion', '2024: Vehicle theft ring'],
    notes: 'Under surveillance after repeated sightings near Mysuru Central.',
  },
  {
    id: 2,
    name: 'Anitha S.',
    age: 31,
    photo: 'https://via.placeholder.com/220?text=Anitha',
    aliases: ['Anu', 'S. Anitha'],
    history: ['2020: Fraud investigation', '2022: Wallet transfer network'],
    notes: 'Associated with high-value financial transactions across districts.',
  },
  {
    id: 3,
    name: 'Kiran Gowda',
    age: 29,
    photo: 'https://via.placeholder.com/220?text=Kiran',
    aliases: ['KG', 'K. Gowda'],
    history: ['2018: Vehicle theft', '2023: Assault case'],
    notes: 'Suspected leader of nighttime theft patrols.',
  }
];

const LOCAL_MOCK = {
  query: 'Show me active murder cases in Mysuru with CCTV reports',
  generated_zcql: 'SELECT * FROM CaseMaster WHERE PoliceStationID IN (SELECT UnitID FROM Unit WHERE DistrictID = 404) AND CaseStatusID = 1',
  data_source: 'Local Intelligence Engine (Mock)',
  summary: {
    totalCrimes: '4,213',
    activeFIRs: '842',
    crimeCategories: 12,
    monthlyChange: '+28%',
  },
  trend: {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
    values: [382, 410, 446, 393, 472, 505, 623],
  },
  categories: {
    labels: ['Theft', 'Assault', 'Robbery', 'Cyber', 'Financial'],
    values: [28, 21, 18, 13, 10],
  },
  hotspots: [
    { name: 'Nazarbad', level: 'Critical', score: 91, description: 'Marketplace cluster with rising repeat offenders.' },
    { name: 'Mysuru Central', level: 'High', score: 82, description: 'Frequent violent crimes and public transport risk.' },
    { name: 'VV Puram', level: 'Elevated', score: 74, description: 'Property offences and coordinated theft rings.' },
    { name: 'Chamundi Hills', level: 'Moderate', score: 61, description: 'Nighttime burglary patterns near tourist zones.' },
    { name: 'Hebbal', level: 'Watch', score: 52, description: 'Suspicious transaction cluster with local vendors.' },
  ],
  network: {
    central: 'Anand Kumar',
    links: [
      { label: 'Accused', target: 'Ramesh Naik' },
      { label: 'Victim', target: 'N. Shruthi' },
      { label: 'Bank', target: 'Acct *0029' },
      { label: 'Vehicle', target: 'KA-05 AB 1234' },
      { label: 'Phone', target: '+91 98450 88441' },
    ],
  },
};

const charts = { trend: null, category: null };
let currentLanguage = 'EN';

function setLanguage(lang) {
  currentLanguage = lang;
  const labels = LANGUAGE_TEXT[lang];
  document.getElementById('headerTitle').innerText = labels.headerTitle;
  document.getElementById('tabDashboardBtn').innerText = labels.tabDashboard;
  document.getElementById('tabRiskAnalysisBtn').innerText = labels.tabRisk;
  document.getElementById('tabSuspectProfilesBtn').innerText = labels.tabProfiles;
  document.getElementById('labelTotalCases').innerText = labels.labelTotalCases;
  document.getElementById('labelActiveFIRs').innerText = labels.labelActiveFIRs;
  document.getElementById('labelCategories').innerText = labels.labelCategories;
  document.getElementById('labelMonthlyChange').innerText = labels.labelMonthlyChange;
  document.getElementById('labelTrend').innerText = labels.labelTrend;
  document.getElementById('labelCategory').innerText = labels.labelCategory;
  document.getElementById('labelAlert').innerText = labels.labelAlert;
  document.getElementById('alertTitle').innerText = labels.alertTitle;
  document.getElementById('riskTitle').innerText = labels.riskTitle;
  document.getElementById('profilesTitle').innerText = labels.profilesTitle;
  document.querySelectorAll('.btn-primary').forEach(btn => btn.innerText = labels.btnViewRisk);
  document.querySelectorAll('.btn-secondary')[0].innerText = labels.btnOpenRisk;
  document.querySelectorAll('.btn-secondary')[1].innerText = labels.btnViewProfile;
  const enBtn = document.getElementById('langEnBtn');
  const knBtn = document.getElementById('langKnBtn');
  if (lang === 'EN') {
    enBtn.classList.add('bg-white', 'text-blue-900');
    enBtn.classList.remove('bg-blue-800', 'text-white');
    knBtn.classList.remove('bg-white', 'text-blue-900');
    knBtn.classList.add('bg-blue-800', 'text-white');
  } else {
    knBtn.classList.add('bg-white', 'text-blue-900');
    knBtn.classList.remove('bg-blue-800', 'text-white');
    enBtn.classList.remove('bg-white', 'text-blue-900');
    enBtn.classList.add('bg-blue-800', 'text-white');
  }
}

const tabMap = {
  dashboard: 'tabDashboard',
  'risk-analysis': 'tabRiskAnalysis',
  'suspect-profiles': 'tabSuspectProfiles',
};

function showTab(tabId) {
  const activeId = tabMap[tabId] || 'tabDashboard';
  document.querySelectorAll('.tab-content').forEach(section => {
    section.classList.toggle('hidden', section.id !== activeId);
  });
  document.querySelectorAll('.tab-btn').forEach(button => {
    button.classList.remove('bg-white', 'text-blue-900');
    button.classList.add('bg-blue-900', 'text-white');
  });
  const activeBtn = document.getElementById(`${activeId}Btn`);
  if (activeBtn) {
    activeBtn.classList.remove('bg-blue-900', 'text-white');
    activeBtn.classList.add('bg-white', 'text-blue-900');
  }
}

function showPersonDetails(personId) {
  const profile = personProfiles.find(item => item.id === personId);
  if (!profile) return;
  document.getElementById('modalName').innerText = profile.name;
  document.getElementById('modalAlias').innerText = `Aliases: ${profile.aliases.join(', ')}`;
  document.getElementById('modalAge').innerText = profile.age;
  document.getElementById('modalPhoto').src = profile.photo;
  document.getElementById('modalHistory').innerHTML = profile.history.map(record => `<li>${record}</li>`).join('');
  document.getElementById('modalNotes').innerText = profile.notes;
  document.getElementById('personModal').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('personModal').classList.add('hidden');
}

async function runAnalysis() {
  const query = document.getElementById('queryInput').value.trim();
  const button = document.getElementById('submitBtn');
  button.disabled = true;
  button.innerHTML = `<i class="fa-solid fa-spinner animate-spin"></i> Processing...`;
  try {
    const payload = query ? await fetchAnalytics(query) : normalizeDashboardPayload(LOCAL_MOCK, query);
    renderDashboard(payload);
    renderUI(payload.generated_zcql, payload.data_source);
  } catch (error) {
    console.warn('Analytics fetch failed, using local mock:', error.message);
    const fallbackPayload = normalizeDashboardPayload(LOCAL_MOCK, query);
    renderDashboard(fallbackPayload);
    renderUI(fallbackPayload.generated_zcql, fallbackPayload.data_source);
  } finally {
    button.disabled = false;
    button.innerHTML = `<i class="fa-solid fa-circle-play"></i> Execute Engine`;
  }
}

async function fetchAnalytics(query) {
  const localBaseUrl = 'http://localhost:5002';
  const remoteBaseUrl = 'https://new-project-60078355625.development.catalystserverless.in/server/detective_bot';
  const isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname) || window.location.protocol === 'file:';

  if (isLocal) {
    try {
      const response = await fetch(`${localBaseUrl}/predictive-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query }),
      });

      if (!response.ok) {
        throw new Error(`Local backend returned ${response.status}`);
      }

      const json = await response.json();
      return normalizeDashboardPayload(json, query);
    } catch (err) {
      console.warn('Local backend unavailable, falling back to mock:', err.message);
      return normalizeDashboardPayload(simulateQuery(query), query);
    }
  }

  const response = await fetch(`${remoteBaseUrl}/predictive-chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: query }),
  });

  if (!response.ok) throw new Error('Remote analytics endpoint failed');

  const json = await response.json();
  return normalizeDashboardPayload(json, query);
}

function normalizeDashboardPayload(payload, query = '') {
  const fallback = JSON.parse(JSON.stringify(LOCAL_MOCK));
  const response = payload || {};

  if (response.analytics) {
    return {
      ...response.analytics,
      generated_zcql: response.generated_zcql || response.query || query,
      data_source: response.data_source || 'Remote Analytics Engine',
      query: response.query || query,
    };
  }

  const matches = Array.isArray(response.matches) ? response.matches : [];
  const answer = response.answer || 'No answer returned.';
  const source = response.source || 'Remote Analytics Engine';

  return {
    ...fallback,
    query: response.query || query || fallback.query,
    generated_zcql: response.query || query || fallback.generated_zcql,
    data_source: source,
    summary: {
      totalCrimes: `${matches.length || 0}`,
      activeFIRs: `${Math.max(1, matches.length || 1)}`,
      crimeCategories: matches.length ? 1 : 0,
      monthlyChange: 'n/a',
    },
    trend: {
      labels: ['Matches', 'Insights'],
      values: [matches.length || 0, matches.length ? 1 : 0],
    },
    categories: {
      labels: [source || 'Result'],
      values: [matches.length || 0],
    },
    hotspots: matches.length ? [{
      name: source,
      level: 'Info',
      score: 78,
      description: answer,
    }] : fallback.hotspots,
    network: {
      central: source,
      links: [
        { label: 'Query', target: response.query || query || fallback.query },
        { label: 'Answer', target: answer },
      ],
    },
    answer,
    matches,
    source,
  };
}

function simulateQuery(query) {
  const payload = JSON.parse(JSON.stringify(LOCAL_MOCK));
  payload.query = query;
  payload.generated_zcql = query.toLowerCase().includes('mysuru')
    ? "SELECT * FROM CaseMaster WHERE PoliceStationID IN (SELECT UnitID FROM Unit WHERE DistrictID = 404) AND CaseType = 'Burglary'"
    : LOCAL_MOCK.generated_zcql;
  if (query.toLowerCase().includes('burglary')) {
    payload.summary.totalCrimes = '4,842';
    payload.summary.activeFIRs = '912';
    payload.summary.monthlyChange = '+33%';
    payload.trend.values = [415, 428, 462, 405, 482, 530, 650];
  }
  return payload;
}

function renderSuspectProfiles() {
  const list = document.getElementById('suspectList');
  if (!list) return;
  list.innerHTML = personProfiles.map(profile => `
    <button onclick="showPersonDetails(${profile.id})" class="profile-card">
      <p class="text-sm text-slate-500">Accused</p>
      <p class="mt-2 text-lg font-semibold text-slate-900">${profile.name}</p>
      <p class="mt-2 text-sm text-slate-600">Age ${profile.age} • ${profile.aliases[0]}</p>
    </button>
  `).join('');
}

function renderTrendChart(trend) {
  const ctx = document.getElementById('trendChart').getContext('2d');
  if (charts.trend) charts.trend.destroy();
  charts.trend = new Chart(ctx, {
    type: 'line',
    data: {
      labels: trend.labels,
      datasets: [{
        label: 'Reports',
        data: trend.values,
        borderColor: '#1d4ed8',
        backgroundColor: 'rgba(59, 130, 246, 0.18)',
        fill: true,
        tension: 0.35,
        pointRadius: 4,
        pointBackgroundColor: '#3b82f6',
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { color: '#64748b' } },
        y: { grid: { color: '#e2e8f0' }, ticks: { color: '#64748b' }, beginAtZero: true },
      },
    },
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
        backgroundColor: ['#2563eb', '#1d4ed8', '#3b82f6', '#0ea5e9', '#60a5fa'],
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { color: '#64748b' } },
        y: { grid: { color: '#e2e8f0' }, ticks: { color: '#64748b' }, beginAtZero: true },
      },
    },
  });
}

function renderHeatmap(hotspots) {
  const grid = document.getElementById('heatmapGrid');
  grid.innerHTML = hotspots.map(item => {
    const className = item.score >= 85 ? 'heatmap-high' : item.score >= 70 ? 'heatmap-medium' : 'heatmap-low';
    return `
      <div class="heatmap-cell ${className}">
        <div>
          <p class="text-xs uppercase tracking-wide text-slate-700">${item.name}</p>
          <p class="text-2xl font-semibold text-slate-900">${item.score}%</p>
          <p class="text-sm text-slate-700 mt-1">${item.level}</p>
        </div>
      </div>
    `;
  }).join('');
}

function renderNetworkGraph(network) {
  const container = document.getElementById('networkGraph');
  container.innerHTML = `
    <div class="network-node network-central">${network.central}</div>
    <div class="network-links mt-4">
      ${network.links.map(link => `
        <div class="network-link">
          <div class="network-label">${link.label}</div>
          <div class="network-node network-edge-node">${link.target}</div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderDashboard(payload) {
  const summary = payload.summary || LOCAL_MOCK.summary;
  document.getElementById('metricTotalCrimes').innerText = summary.totalCrimes;
  document.getElementById('metricActiveFIRs').innerText = summary.activeFIRs;
  document.getElementById('metricCategories').innerText = summary.crimeCategories;
  document.getElementById('metricMonthlyChange').innerText = summary.monthlyChange;
  renderTrendChart(payload.trend || LOCAL_MOCK.trend);
  renderCategoryChart(payload.categories || LOCAL_MOCK.categories);
  renderHeatmap(payload.hotspots || LOCAL_MOCK.hotspots);
  renderNetworkGraph(payload.network || LOCAL_MOCK.network);
  renderSuspectProfiles();
}

function renderUI(zcql, source) {
  document.getElementById('debugZcql').innerText = zcql;
  document.getElementById('debugSource').innerText = source;
}

function initDashboard() {
  showTab('dashboard');
  setLanguage('EN');
  renderTrendChart(LOCAL_MOCK.trend);
  renderCategoryChart(LOCAL_MOCK.categories);
  renderHeatmap(LOCAL_MOCK.hotspots);
  renderNetworkGraph(LOCAL_MOCK.network);
  renderSuspectProfiles();
  renderUI(LOCAL_MOCK.generated_zcql, LOCAL_MOCK.data_source);
}

window.addEventListener('DOMContentLoaded', initDashboard);
