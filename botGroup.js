import { API_BASE_URL } from './config.js';

function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

const authId = getQueryParam('authId');
const phone = getQueryParam('phone');
const groupsDiv = document.getElementById('groupsList');
const backLink = document.getElementById('backToBot');
backLink.href = `bot.html?authId=${encodeURIComponent(authId)}&phone=${encodeURIComponent(phone)}`;

async function loadGroupsAndSettings() {
  groupsDiv.innerHTML = `<em>Loading groups...</em>`;
  try {
    const res = await fetch(`${API_BASE_URL}/api/bot-groups?authId=${encodeURIComponent(authId)}&phoneNumber=${encodeURIComponent(phone)}`);
    const data = await res.json();
    if (!data.success || !data.groups.length) {
      groupsDiv.innerHTML = `<em>No groups found.</em>`;
      return;
    }
    // For each group, fetch group settings (now via new route)
    const groupSettings = await Promise.all(data.groups.map(async g => {
      const resp = await fetch(`${API_BASE_URL}/api/group-settings?authId=${encodeURIComponent(authId)}&phoneNumber=${encodeURIComponent(phone)}&groupId=${encodeURIComponent(g.id)}`);
      const s = await resp.json();
      return {
        ...g,
        antilink: s.success ? s.settings.antilink.mode : 'unknown',
        antidelete: s.success && s.settings.antidelete ? s.settings.antidelete : { mode: 'off', excluded: false }
      };
    }));

    groupsDiv.innerHTML = `
      <ul class="group-list">
        ${groupSettings.map(g => `
          <li>
            <strong>${g.name}</strong> <br>
            <span style="font-size:0.95em;color:#ffd700;">ID: ${g.id}</span><br>
            <span>Antilink: <b>${g.antilink}</b></span>
            <button class="antilink-btn" data-groupid="${g.id}">Toggle Antilink</button>
            <br>
            <span>Antidelete: <b>${g.antidelete.mode}</b> ${g.antidelete.excluded ? '(Excluded)' : ''}</span>
            <div style="margin-top:4px;">
              <select class="antidelete-mode" data-groupid="${g.id}">
                <option value="off"${g.antidelete.mode === 'off' ? ' selected' : ''}>Off</option>
                <option value="chat"${g.antidelete.mode === 'chat' ? ' selected' : ''}>Chat Only</option>
                <option value="group"${g.antidelete.mode === 'group' ? ' selected' : ''}>Group Only</option>
                <option value="both"${g.antidelete.mode === 'both' ? ' selected' : ''}>Both</option>
              </select>
              <button class="antidelete-save" data-groupid="${g.id}">Save</button>
              <button class="antidelete-exclude" data-groupid="${g.id}" style="margin-left:8px;">
                ${g.antidelete.excluded ? 'Include' : 'Exclude'}
              </button>
            </div>
          </li>
        `).join('')}
      </ul>
    `;

    // Antilink toggle
    document.querySelectorAll('.antilink-btn').forEach(btn => {
      btn.onclick = async () => {
        const groupId = btn.getAttribute('data-groupid');
        btn.disabled = true;
        btn.textContent = 'Toggling...';
        const res = await fetch(`${API_BASE_URL}/api/set-antilink`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ authId, phoneNumber: phone, groupId })
        });
        const data = await res.json();
        alert(data.message || (data.success ? 'Antilink toggled!' : 'Failed'));
        loadGroupsAndSettings();
      };
    });

    // Antidelete mode save
    document.querySelectorAll('.antidelete-save').forEach(btn => {
      btn.onclick = async () => {
        const groupId = btn.getAttribute('data-groupid');
        const select = document.querySelector(`.antidelete-mode[data-groupid="${groupId}"]`);
        const mode = select.value;
        btn.disabled = true;
        btn.textContent = 'Saving...';
        const res = await fetch(`${API_BASE_URL}/api/set-antidelete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ authId, phoneNumber: phone, groupId, mode })
        });
        const data = await res.json();
        alert(data.message || (data.success ? 'Antidelete updated!' : 'Failed'));
        loadGroupsAndSettings();
      };
    });

    // Antidelete exclude/include
    document.querySelectorAll('.antidelete-exclude').forEach(btn => {
      btn.onclick = async () => {
        const groupId = btn.getAttribute('data-groupid');
        const isExcluded = btn.textContent.trim().toLowerCase() === 'include';
        btn.disabled = true;
        btn.textContent = isExcluded ? 'Including...' : 'Excluding...';
        const res = await fetch(`${API_BASE_URL}/api/set-antidelete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ authId, phoneNumber: phone, groupId, excluded: !isExcluded })
        });
        const data = await res.json();
        alert(data.message || (data.success ? 'Antidelete updated!' : 'Failed'));
        loadGroupsAndSettings();
      };
    });

  } catch {
    groupsDiv.innerHTML = `<em>Error loading groups.</em>`;
  }
}

loadGroupsAndSettings();