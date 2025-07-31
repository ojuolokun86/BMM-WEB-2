import { API_BASE_URL } from './config.js';

const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    // Remove any admin token/session (customize as needed)
    localStorage.removeItem('adminToken');
    sessionStorage.removeItem('adminToken');
    window.location.href = 'index.html';
  });
}

// Delete user functionality
const deleteForm = document.getElementById('deleteUserForm');
const resultDiv = document.getElementById('deleteUserResult');

if (deleteForm) {
  deleteForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const authId = deleteForm.authId.value.trim();
    if (!authId) {
      resultDiv.textContent = 'Auth ID is required.';
      resultDiv.style.color = 'red';
      return;
    }
    if (!confirm(`Are you sure you want to delete user ${authId} and all their data? This cannot be undone!`)) return;
    resultDiv.textContent = 'Deleting...';
    resultDiv.style.color = '';
    try {
      // Call backend DELETE endpoint (adjust API_BASE_URL if needed)
      const endpoint = `${API_BASE_URL}/api/admin/user/${encodeURIComponent(authId)}`;
      const res = await fetch(endpoint, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok && data.success) {
        resultDiv.textContent = data.message || 'User deleted successfully.';
        resultDiv.style.color = 'limegreen';
      } else {
        resultDiv.textContent = data.message || 'Failed to delete user.';
        resultDiv.style.color = 'red';
      }
    } catch (err) {
      resultDiv.textContent = 'Error deleting user. Please check your network or try again.';
      resultDiv.style.color = 'red';
    }
  });
}

const backBtn = document.getElementById('backToDashboardBtn');
if (backBtn) {
  backBtn.addEventListener('click', () => {
    window.location.href = 'adminPage.html'; // or your main dashboard page
  });
}