import { API_BASE_URL } from './config.js';

document.getElementById('viewAllUsersBtn').onclick = function() {
    window.location.href = 'user.html';
};

const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
  logoutBtn.onclick = function() {
    sessionStorage.clear();
    window.location.href = 'index.html';
  };
}


async function fetchServers() {
    const tbody = document.getElementById('servers-table-body');
    if (!tbody) return; // guard against missing element
  
    tbody.innerHTML = '<tr><td colspan="6">Loading...</td></tr>';
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/servers`);
      const data = await res.json();
  
      if (!data.servers || !data.servers.length) {
        tbody.innerHTML = '<tr><td colspan="6">No servers found.</td></tr>';
        return;
      }
  
      tbody.innerHTML = '';
      data.servers.forEach(server => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${server.id}</td>
          <td>${server.url}</td>
          <td>${server.healthy ? '🟢 Alive' : '🔴 Dead'}</td>
          <td>${server.userCount}</td>
          <td>${server.uptime !== null ? formatUptime(server.uptime) : '-'}</td>
          <td>${server.lastSeen ? new Date(server.lastSeen).toLocaleString() : '-'}</td>
        `;
        tbody.appendChild(tr);
      });
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="6" style="color:red;">Error loading servers</td></tr>`;
    }
  }
  
  function formatUptime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}h ${m}m ${s}s`;
  }
  
  document.addEventListener('DOMContentLoaded', () => {
    fetchServers();
    setInterval(fetchServers, 5000); // Refresh every 5s
  });

 // Manual Subscription Logic
document.getElementById('manual-subscribe-btn').onclick = async function() {
    const authIdInput = document.getElementById('manual-auth-id');
    const planSelect = document.getElementById('manual-plan');
    const resultDiv = document.getElementById('manual-subscribe-result');

    let user_auth_id = authIdInput.value.trim();
    let plan = planSelect.value;
    if (!user_auth_id) {
        resultDiv.style.color = 'red';
        resultDiv.textContent = 'Please enter a valid Auth ID.';
        return;
    }
    // Map 'free' to 'trier' for DB
    if (plan === 'free') plan = 'trier';
    const duration_days = 30; // or let admin pick

    try {
        const res = await fetch(`${API_BASE_URL}/api/admin/subscribe`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_auth_id, plan, duration_days })
        });
        const data = await res.json();
        if (data.success) {
            resultDiv.style.color = '#0f0';
            resultDiv.textContent = `Subscribed Auth ID ${user_auth_id} to ${plan} successfully!`;
        } else {
            resultDiv.style.color = 'red';
            resultDiv.textContent = data.error || 'Subscription failed.';
        }
    } catch (err) {
        resultDiv.style.color = 'red';
        resultDiv.textContent = 'Error: ' + err.message;
    }
};

// adminPage.js (add at the top or after DOMContentLoaded)

// Demo stats
async function loadDashboardStats() {
    const res = await fetch(`${API_BASE_URL}/api/admin/dashboard-stats`);
    const stats = await res.json();
    console.log(stats);
  
    document.getElementById('totalUsersStat').textContent = stats.totalUsers;
    document.getElementById('activeSessionsStat').textContent = stats.activeSessions;
    document.getElementById('failedLoginsStat').textContent = stats.failedLogins;
    
    const healthy = stats.healthyServers ?? 0;
    const total = stats.totalServers ?? 0;
    document.getElementById('healthyServersStat').textContent = `${healthy}/${total}`;
    // Subscription breakdown chart
    const subChart = Chart.getChart('subscriptionChart');
    if (subChart) subChart.destroy();
    new Chart(document.getElementById('subscriptionChart').getContext('2d'), {
      type: 'doughnut',
      data: {
        labels: ['Free', 'Basic', 'Gold', 'Premium'],
        datasets: [{
          data: [
            stats.subscriptionBreakdown.free,
            stats.subscriptionBreakdown.basic,
            stats.subscriptionBreakdown.gold,
            stats.subscriptionBreakdown.premium
          ],
          backgroundColor: ['#5cc3ff', '#ffb347', '#ffd700', '#43e97b']
        }]
      },
      options: { plugins: { legend: { position: 'bottom' } } }
    });
  
    // Usage chart
if (stats.usageOverTime && Array.isArray(stats.usageOverTime.labels)) {
    const usageChart = Chart.getChart('usageChart');
    if (usageChart) usageChart.destroy();
    new Chart(document.getElementById('usageChart').getContext('2d'), {
      type: 'line',
      data: {
        labels: stats.usageOverTime.labels,
        datasets: [{
          label: 'Sessions',
          data: stats.usageOverTime.sessions,
          borderColor: '#43e97b',
          backgroundColor: 'rgba(67,233,123,0.1)',
          tension: 0.4,
          fill: true
        }]
      },
      options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
    });
  } else {
    // Optionally show a message or skip rendering the chart
    document.getElementById('usageChart').parentNode.innerHTML = '<div style="color:#fff;padding:1em;">No usage data</div>';
  }
  
    // Server load chart
   // Server load chart
if (stats.serverLoad && Array.isArray(stats.serverLoad.labels)) {
    const loadChart = Chart.getChart('serverLoadChart');
    if (loadChart) loadChart.destroy();
    new Chart(document.getElementById('serverLoadChart').getContext('2d'), {
      type: 'line',
      data: {
        labels: stats.serverLoad.labels,
        datasets: [{
          label: 'Server Load',
          data: stats.serverLoad.load,
          borderColor: '#5cc3ff',
          backgroundColor: 'rgba(92,195,255,0.1)',
          tension: 0.4,
          fill: true
        }]
      },
      options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
    });
  } else {
    document.getElementById('serverLoadChart').parentNode.innerHTML = '<div style="color:#fff;padding:1em;">No server load data</div>';
  }
  
    // Recent users table
    const usersTable = document.getElementById('recentUsersTableBody');
    usersTable.innerHTML = '';
    stats.recentUsers.forEach(u => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${u.email}</td><td>${u.plan}</td><td>${new Date(u.dateJoined).toLocaleDateString()}</td>`;
      usersTable.appendChild(tr);
    });
  
    // Recent bot activity table
    const botTable = document.getElementById('recentBotActivityTableBody');
botTable.innerHTML = '';
if (Array.isArray(stats.recentBotActivity)) {
  stats.recentBotActivity.forEach(a => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${a.user}</td><td>${a.bot}</td><td>${a.action}</td><td>${new Date(a.time).toLocaleString()}</td>`;
    botTable.appendChild(tr);
  });
} else {
  // Optionally, show a message if no data
  const tr = document.createElement('tr');
  tr.innerHTML = `<td colspan="4" style="color:#fff;">No bot activity data</td>`;
  botTable.appendChild(tr);
}
  
    // Recent failed logins table
    const failedLoginsTable = document.getElementById('failedLoginsTableBody');
    failedLoginsTable.innerHTML = '';
    stats.recentFailedLogins.forEach(f => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${f.user}</td><td>${new Date(f.time).toLocaleString()}</td><td>${f.reason}</td>`;
      failedLoginsTable.appendChild(tr);
    });
  }
  
  document.addEventListener('DOMContentLoaded', loadDashboardStats);