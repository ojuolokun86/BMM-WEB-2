import { API_BASE_URL } from './config.js';

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const res = await fetch(`${API_BASE_URL}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  document.getElementById('loginMessage').textContent = data.message;
  if (data.success) {
    // Store user info for dashboard
    sessionStorage.setItem('email', email);
    sessionStorage.setItem('authId', data.auth_id || data.authId);
    sessionStorage.setItem('subscriptionLevel', data.subscription_level || 'N/A');
    sessionStorage.setItem('daysLeft', data.days_left || 'N/A');
    sessionStorage.setItem('role', data.role || 'user');
    if (data.role === 'admin') {
      window.location.href = '/adminPage.html'; // Redirect to admin dashboard
    } else {
      window.location.href = '/dashboard.html';
    }
  } else {
    if (data.error) {
      console.error('Login error:', data.error);
      const msgSpan = document.getElementById('loginMessage');
      msgSpan.textContent = data.error;
    }
  }
});