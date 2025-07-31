import { API_BASE_URL } from './config.js';

async function fetchAllUsers() {
    const res = await fetch(`${API_BASE_URL}/api/admin/users-info`);
    const data = await res.json();
    const tbody = document.getElementById('userListContainer');
    const userCountSpan = document.getElementById('userCount');
    if (!data.success || !data.users.length) {
        tbody.innerHTML = '<tr><td colspan="5">No users found.</td></tr>';
        userCountSpan.textContent = '(0 users)';
        return;
    }
    // Set the user count
    userCountSpan.textContent = `(${data.users.length} users)`;

    tbody.innerHTML = data.users.map(u => `
        <tr>
            <td>
                <a href="#" class="user-link" data-authid="${u.auth_id}">
                    <strong>${u.email}</strong>
                </a>
            </td>
            <td>${u.auth_id}</td>
            <td>
                <span style="color:#ffd700;">${u.subscription_level}</span>
            </td>
            <td>
                <span style="color:#7fff7f;">${u.days_left}</span>
            </td>
            <td>
                <button class="view-user-btn" data-authid="${u.auth_id}">View</button>
            </td>
        </tr>
    `).join('');

    document.querySelectorAll('.user-link, .view-user-btn').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const authId = link.getAttribute('data-authid');
            window.location.href = `adminUserInfo.html?authId=${encodeURIComponent(authId)}`;
        });
    });
}

document.addEventListener('DOMContentLoaded', fetchAllUsers);