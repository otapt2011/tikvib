// Admin Dashboard
let currentAdminTab = 'overview';
const loadedTabs = { overview: false, videoSpikes: false };

function showTabLoading(tabId, show) {
  const el = document.getElementById(tabId + 'Loading');
  if (!el) return;
  show ? el.classList.remove('hidden') : el.classList.add('hidden');
}

function showTabError(tabId, msg) {
  const errEl = document.getElementById(tabId + 'Error');
  if (errEl) {
    errEl.textContent = msg;
    errEl.classList.remove('hidden');
  } else {
    const tbody = document.getElementById(tabId + 'TableBody');
    if (tbody) tbody.innerHTML = `<tr><td colspan="10" style="color:#c00;text-align:center;">${msg}</td></tr>`;
  }
}

function hideTabError(tabId) {
  const errEl = document.getElementById(tabId + 'Error');
  if (errEl) errEl.classList.add('hidden');
}

async function populateAdminUserSelects() {
  if (!App.authToken) return;
  try {
    const rows = await fetchViewRows('profiles', '', 'username', 1000);
    const usernames = rows.map(r => r.username);
    ['dailyUserSelect', 'timelineUserSelect'].forEach(id => {
      const sel = document.getElementById(id);
      if (!sel) return;
      sel.innerHTML = '<option value="">Select a user</option>';
      usernames.forEach(name => {
        const opt = document.createElement('option');
        opt.value = name;
        opt.textContent = name;
        sel.appendChild(opt);
      });
    });
  } catch (e) { /* ignore */ }
}

async function loadTabData(tabName) {
  switch (tabName) {
    case 'overview':        return loadOverview();
    case 'dailyTotals':     populateAdminUserSelects(); break;
    case 'profileTimeline': populateAdminUserSelects(); break;
    case 'videoSpikes':     return loadVideoSpikes();
  }
}

// ---------- Overview ----------
async function loadOverview() {
  if (loadedTabs.overview) return;
  const tabId = 'overview';
  showTabLoading(tabId, true);
  hideTabError(tabId);
  const table = App.adminTable;
  const tbody = App.adminTableBody;
  if (!table || !tbody) { showTabError(tabId, 'Table not found'); showTabLoading(tabId, false); return; }
  table.classList.add('hidden');
  tbody.innerHTML = '';
  try {
    const rows = await fetchViewRows('admin_dashboard', '', 'profile_last_scraped DESC', 100);
    const formatOverviewNumber = (val) => {
      if (!val) return '0';
      if (typeof val === 'string' && /[^\d.]/.test(val)) return val;
      const num = parseInt(val, 10);
      return isNaN(num) ? '0' : num.toLocaleString();
    };
    rows.forEach(row => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><div class="avatar-cell"><img src="${row.avatar || ''}" alt="${row.username}"><span>${row.username}</span></div></td>
        <td class="metric">${formatOverviewNumber(row.total_videos)}</td>
        <td class="metric">${formatOverviewNumber(row.total_likes)}</td>
        <td class="metric">${formatOverviewNumber(row.total_views)}</td>
        <td class="metric">${formatOverviewNumber(row.total_comments)}</td>
        <td class="metric">${formatOverviewNumber(row.total_shares)}</td>
        <td class="metric">${formatOverviewNumber(row.total_collections)}</td>
        <td>${row.last_successful_scrape || 'N/A'}</td>
        <td class="metric" style="color:#2ecc71">${row.total_successful_scrapes}</td>
        <td class="metric" style="color:#e74c3c">${row.total_failed_scrapes}</td>`;
      tbody.appendChild(tr);
    });
    table.classList.remove('hidden');
    loadedTabs.overview = true;
  } catch (err) {
    showTabError(tabId, err.message);
  } finally {
    showTabLoading(tabId, false);
  }
}

// ---------- Daily Totals ----------
document.getElementById('dailyLoadBtn').addEventListener('click', async () => {
  const username = document.getElementById('dailyUserSelect').value;
  if (!username) return;
  const tabId = 'daily';
  showTabLoading(tabId, true);
  hideTabError(tabId);
  const table = document.getElementById('dailyTable');
  const tbody = document.getElementById('dailyTableBody');
  if (!table || !tbody) { showTabError(tabId, 'Table not found'); showTabLoading(tabId, false); return; }
  table.classList.add('hidden');
  tbody.innerHTML = '';
  try {
    const rows = await fetchViewRows(
      'daily_profile_latest_stats',
      `username = '${username.replace(/'/g, "''")}'`,
      'scrape_date DESC',
      30
    );
    rows.forEach(row => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${row.scrape_date}</td>
        <td class="metric">${row.followers || '0'}</td>
        <td class="metric">${row.following || '0'}</td>
        <td class="metric">${row.likes || '0'}</td>`;
      tbody.appendChild(tr);
    });
    table.classList.remove('hidden');
  } catch (err) {
    showTabError(tabId, err.message);
  } finally {
    showTabLoading(tabId, false);
  }
});

// ---------- Profile Timeline ----------
document.getElementById('timelineLoadBtn').addEventListener('click', async () => {
  const username = document.getElementById('timelineUserSelect').value;
  if (!username) return;
  const tabId = 'timeline';
  showTabLoading(tabId, true);
  hideTabError(tabId);
  const table = document.getElementById('timelineTable');
  const tbody = document.getElementById('timelineTableBody');
  if (!table || !tbody) { showTabError(tabId, 'Table not found'); showTabLoading(tabId, false); return; }
  table.classList.add('hidden');
  tbody.innerHTML = '';
  try {
    const rows = await fetchViewRows(
      'profile_timeline_safe',
      `username = '${username.replace(/'/g, "''")}'`,
      '',
      50
    );
    rows.forEach(row => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${row.scrape_time}</td>
        <td class="metric">${row.followers || '0'}</td>
        <td class="metric">${row.following || '0'}</td>
        <td class="metric">${row.likes || '0'}</td>`;
      tbody.appendChild(tr);
    });
    table.classList.remove('hidden');
  } catch (err) {
    showTabError(tabId, err.message);
  } finally {
    showTabLoading(tabId, false);
  }
});

// ---------- Video Spikes ----------
// ---------- Video Spikes ----------
async function loadVideoSpikes() {
  if (loadedTabs.videoSpikes) return;
  const tabId = 'videoSpikes';
  showTabLoading(tabId, true);
  hideTabError(tabId);
  const table = document.getElementById('videoSpikesTable');
  const tbody = document.getElementById('videoSpikesTableBody');
  if (!table || !tbody) { showTabError(tabId, 'Table not found'); showTabLoading(tabId, false); return; }
  table.classList.add('hidden');
  tbody.innerHTML = '';
  try {
    const rows = await fetchViewRows('video_spikes_safe', '', '', 30);
    const formatNumber = (n) => {
      const num = parseInt(n, 10);
      if (isNaN(num)) return '0';
      if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
      if (num >= 1_000) return (num / 1_000).toFixed(1) + 'k';
      return num.toLocaleString();
    };
    rows.forEach(row => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${row.username}</td>
        <td>${row.video_id}</td>
        <td class="metric">${formatNumber(row.views)}</td>
        <td class="metric">${formatNumber(row.comments)}</td>
        <td class="metric">${formatNumber(row.shares)}</td>
        <td>${row.posted || '—'}</td>`;
      tbody.appendChild(tr);
    });
    table.classList.remove('hidden');
    loadedTabs.videoSpikes = true;
  } catch (err) {
    showTabError(tabId, err.message);
  } finally {
    showTabLoading(tabId, false);
  }
}

// Tab switching and modal open
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.modal-tabs .tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = tab.dataset.tab;
      if (currentAdminTab === tabName) return;
      document.querySelectorAll('.modal-tabs .tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      document.getElementById(`tab-${tabName}`).classList.add('active');
      currentAdminTab = tabName;
      loadTabData(tabName);
    });
  });

  App.adminBtn.addEventListener('click', async () => {
    if (!App.authToken || !(await verifyToken(App.authToken))) {
      try { await authenticate(); } catch { return; }
    }
    App.adminModal.classList.remove('hidden');
    loadedTabs.overview = false;
    loadedTabs.videoSpikes = false;
    document.querySelectorAll('.modal-tabs .tab').forEach(t => t.classList.remove('active'));
    document.querySelector('.tab[data-tab="overview"]').classList.add('active');
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.getElementById('tab-overview').classList.add('active');
    currentAdminTab = 'overview';
    loadTabData('overview');
  });

  App.adminModalClose.addEventListener('click', () => App.adminModal.classList.add('hidden'));
  const modalCard = App.adminModal.querySelector('.modal-card');
  App.adminModal.addEventListener('click', (e) => {
    if (modalCard && !modalCard.contains(e.target)) {
      App.adminModal.classList.add('hidden');
    }
  });
});
