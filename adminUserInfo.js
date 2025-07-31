import { API_BASE_URL } from './config.js';

// Get authId from query string
const urlParams = new URLSearchParams(window.location.search);
const authId = urlParams.get('authId');
const container = document.getElementById('userBotsContainer');

if (!authId) {
  container.innerHTML = '<p>No user selected.</p>';
} else {
  fetchBotsForUser(authId);
}

async function fetchBotsForUser(authId) {
  container.innerHTML = '<p>Loading bots...</p>';
  const res = await fetch(`${API_BASE_URL}/api/admin/bots/${encodeURIComponent(authId)}`);
  const data = await res.json();
  if (!data.success) {
    container.innerHTML = `<p>Error: ${data.message}</p>`;
    return;
  }
  if (!data.bots || data.bots.length === 0) {
    container.innerHTML = '<p>No bots found for this user.</p>';
    return;
  }
  container.innerHTML = `
    <h3>Bots for Auth ID: ${authId}</h3>
    <ul class="user-list">
      ${data.bots.map(bot => `
        <li>
          <span class="bot-number">${bot.phone_number}</span>
          <button class="restart-btn" data-phone="${bot.phone_number}">Restart</button>
          <button class="delete-btn" data-phone="${bot.phone_number}">Delete</button>
        </li>
      `).join('')}
    </ul>
  `;

  // Add event listeners for restart and delete buttons
  document.querySelectorAll('.restart-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const phoneNumber = btn.getAttribute('data-phone');
      if (!confirm(`Restart bot ${phoneNumber}?`)) return;
      btn.disabled = true;
      btn.textContent = 'Restarting...';
      const res = await fetch(`${API_BASE_URL}/api/bot/restart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authId, phoneNumber })
      });
      const data = await res.json();
      alert(data.message || 'Restarted!');
      btn.disabled = false;
      btn.textContent = 'Restart';
    });
  });

  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const phoneNumber = btn.getAttribute('data-phone');
      if (!confirm(`Delete bot ${phoneNumber}? This cannot be undone.`)) return;
      btn.disabled = true;
      btn.textContent = 'Deleting...';
      const res = await fetch(`${API_BASE_URL}/api/bot`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authId, phoneNumber })
      });
      const data = await res.json();
      alert(data.message || 'Deleted!');
      if (data.success) {
        // Remove the bot from the list
        btn.closest('li').remove();
      } else {
        btn.disabled = false;
        btn.textContent = 'Delete';
      }
    });
  });
}