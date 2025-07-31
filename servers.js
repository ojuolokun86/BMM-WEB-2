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

// Example server data (replace with your actual data source)
const servers = [
  {
    name: "Main Server",
    id: "srv-001",
    url: "https://server1.example.com",
    healthy: true,
    load: 0.23,
    userCount: 42,
    lastSeen: "2025-07-31 13:20"
  },
  // ...more servers
];

// Column definitions for labels and keys
const columns = [
  { label: "#", key: "index" },
  { label: "Name", key: "name" },
  { label: "ID", key: "id" },
  { label: "URL", key: "url" },
  { label: "Healthy", key: "healthy" },
  { label: "Load", key: "load" },
  { label: "User Count", key: "userCount" },
  { label: "Last Seen", key: "lastSeen" }
];

// Render function
function renderServersTable(servers) {
  const tbody = document.getElementById("serversTableBody");
  tbody.innerHTML = ""; // Clear existing rows

  servers.forEach((server, i) => {
    const tr = document.createElement("tr");
    columns.forEach(col => {
      const td = document.createElement("td");
      td.setAttribute("data-label", col.label);

      if (col.key === "index") {
        td.textContent = i + 1;
      } else if (col.key === "healthy") {
        // Add status dot and text
        const dot = document.createElement("span");
        dot.className = "status-dot " + (server.healthy === true ? "healthy" : server.healthy === false ? "unhealthy" : "unknown");
        td.appendChild(dot);
        td.appendChild(document.createTextNode(server.healthy === true ? "Yes" : server.healthy === false ? "No" : "Unknown"));
      } else {
        td.textContent = server[col.key];
      }

      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
}

// Example usage
renderServersTable(servers);