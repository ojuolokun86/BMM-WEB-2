import { API_BASE_URL } from './config.js';

async function fetchSubscriptions() {
  const res = await fetch(`${API_BASE_URL}/api/admin/subscriptions`);
  console.log('🌐 Fetching subscriptions...');
  const { subscriptions } = await res.json();
  const tbody = document.getElementById('subsTableBody');
  console.log('🌐 Fetching subscriptions...', subscriptions);
  tbody.innerHTML = '';
  subscriptions.forEach((sub, idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${idx + 1}</td>
      <td>${sub.user_auth_id}</td>
      <td>${sub.subscription_level}</td>
      <td>${sub.expiration_date ? new Date(sub.expiration_date).toLocaleDateString() : '-'}</td>
      <td>${sub.created_at ? new Date(sub.created_at).toLocaleDateString() : '-'}</td>
    `;
    tbody.appendChild(tr);
  });
}

document.getElementById('subscribeForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const user_auth_id = form.user_auth_id.value.trim();
  const plan = form.plan.value;
  const duration_days = parseInt(form.duration_days.value, 10);

  if (!user_auth_id || !plan || !duration_days) {
    alert('All fields are required.');
    return;
  }

  const res = await fetch(`${API_BASE_URL}/api/admin/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_auth_id, plan, duration_days })
  });
  const data = await res.json();
  if (data.success) {
    alert('Subscription updated!');
    fetchSubscriptions();
    form.reset();
  } else {
    alert('Error: ' + (data.message || 'Could not subscribe user.'));
  }
});

document.addEventListener('DOMContentLoaded', fetchSubscriptions);