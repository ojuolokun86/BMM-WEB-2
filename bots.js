import { API_BASE_URL } from './config.js';


async function fetchAllBots() {
    const res = await fetch(`${API_BASE_URL}/api/admin/bots`);
    const { bots } = await res.json();
    const tbody = document.getElementById('botsTableBody');
    tbody.innerHTML = '';
    bots.forEach((bot, idx) => {
      const tr = document.createElement('tr');
     // In bots.js, update the status cell:
        tr.innerHTML = `
        <td>${idx + 1}</td>
        <td>${bot.user_auth_id}</td>
        <td class="status-${(bot.status || 'unknown').toLowerCase()}">${bot.status || 'unknown'}</td>
        <td>${bot.server_id || '-'}</td>
        <td>${bot.created_at ? new Date(bot.created_at).toLocaleString() : '-'}</td>
        `;
      tbody.appendChild(tr);
    });
  }
  
  // Call this when the Bots tab/page is loaded
  document.addEventListener('DOMContentLoaded', fetchAllBots);