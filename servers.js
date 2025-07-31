import { API_BASE_URL } from './config.js';

async function fetchServers() {
  const res = await fetch(`${API_BASE_URL}/api/admin/servers`);
  const { servers } = await res.json();
  const tbody = document.getElementById('serversTableBody');
  tbody.innerHTML = '';
  servers.forEach((srv, idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${idx + 1}</td>
      <td>${srv.name || '-'}</td>
      <td>${srv.id}</td>
      <td><a href="${srv.url}" target="_blank">${srv.url}</a></td>
      <td class="${srv.healthy ? 'status-active' : 'status-inactive'}">${srv.healthy ? 'Healthy' : 'Down'}</td>
      <td>${typeof srv.load === 'number' ? (srv.load * 100).toFixed(1) + '%' : '-'}</td>
      <td>${srv.userCount ?? '-'}</td>
      <td>${srv.lastSeen ? new Date(srv.lastSeen).toLocaleString() : '-'}</td>
    `;
    tbody.appendChild(tr);
  });
}

document.addEventListener('DOMContentLoaded', fetchServers);