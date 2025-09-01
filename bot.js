import { API_BASE_URL } from './config.js';

function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

const phone = getQueryParam('phone');
const authId = getQueryParam('authId');
const botInfoDiv = document.getElementById('botInfo');

function renderSettingsView(settings, editable = false) {
  if (!settings) return `<em>Could not load settings.</em>`;

  let antideleteInfo = '';
  if (!editable && settings.antidelete) {
    antideleteInfo = `
      <div class="bot-info-row">
        <strong>Antidelete Mode:</strong>
        <span>${settings.antidelete.mode.charAt(0).toUpperCase() + settings.antidelete.mode.slice(1)}</span>
      </div>
    `;
  }

  // Add Status View Mode and Command React in read-only mode
  let extraInfo = '';
  if (!editable) {
    extraInfo += `
      <div class="bot-info-row">
        <strong>Status View Mode:</strong>
        <span>${
          settings.statusView === 0 ? 'Off' :
          settings.statusView === 1 ? 'View Only' :
          settings.statusView === 2 ? 'View & React' : '-'
        }</span>
      </div>
      <div class="bot-info-row">
        <strong>Command React:</strong>
        <span>${settings.commandReact ? 'Enabled' : 'Disabled'}</span>
      </div>
    `;
  }

  let antideleteEdit = '';
  if (editable && settings.antidelete) {
    antideleteEdit = `
      <div class="bot-info-row">
        <strong>Antidelete:</strong>
        <span>
          <select id="antideleteModeSelect">
            <option value="off"${settings.antidelete.mode === 'off' ? ' selected' : ''}>Off</option>
            <option value="chat"${settings.antidelete.mode === 'chat' ? ' selected' : ''}>Chat Only</option>
            <option value="group"${settings.antidelete.mode === 'group' ? ' selected' : ''}>Group Only</option>
            <option value="both"${settings.antidelete.mode === 'both' ? ' selected' : ''}>Both</option>
          </select>
          <button id="saveAntideleteBtn" class="primary-btn" style="margin-left:8px;">Save</button>
        </span>
        <span id="antideleteMsg" style="margin-left:10px;"></span>
      </div>
    `;
  }

  return `
    <div class="bot-settings-view">
      <div class="bot-info-section">
        <div class="bot-info-row"><strong>Owner Name:</strong> <span>${settings.ownerName || '-'}</span></div>
        <div class="bot-info-row"><strong>Bot LID:</strong> <span>${settings.botLid || '-'}</span></div>
        <div class="bot-info-row"><strong>Mode:</strong> <span>${settings.mode}</span></div>
        <div class="bot-info-row"><strong>Prefix:</strong> <span>${settings.prefix}</span></div>
        ${antideleteInfo}
        ${extraInfo}
      </div>
      ${antideleteEdit}
      ${!editable ? `
        <div class="bot-actions-row">
          <button id="editSettingsBtn" class="primary-btn">Edit Settings</button>
          <button id="restartBotBtn" class="primary-btn">Restart Bot</button>
          <button id="deleteBotBtn" class="danger-btn">Delete Bot</button>
          <button id="viewGroupsBtn" class="primary-btn">View Groups</button>
        </div>
      ` : `
        <form id="settingsForm" class="bot-settings-form">
          <div class="bot-info-row">
            <strong>Mode:</strong>
            <select name="mode" id="modeSelect" required>
              <option value="private"${settings.mode === 'private' ? ' selected' : ''}>Private</option>
              <option value="public"${settings.mode === 'public' ? ' selected' : ''}>Public</option>
              <option value="admin"${settings.mode === 'admin' ? ' selected' : ''}>Admin</option>
            </select>
          </div>
          <div class="bot-info-row">
            <strong>Prefix:</strong>
            <input type="text" name="prefix" id="prefixInput" maxlength="3" minlength="1" pattern=".{1,3}" value="${settings.prefix || '.'}" style="width:50px;text-align:center;" required>
          </div>
          <div class="bot-settings-actions">
            <button type="submit" class="primary-btn">Save</button>
            <button type="button" id="cancelEditBtn" class="primary-btn" style="background:#232946;color:#ffd700;border:1.5px solid #ffd700;margin-left:10px;">Cancel</button>
            <span id="settingsMsg" style="margin-left:10px;"></span>
          </div>
        </form>
      `}
    </div>
  `;
}

let currentSettings = null;

function loadSettings() {
  const settingsDiv = document.getElementById('botSettings');
  settingsDiv.innerHTML = `<em>Loading settings...</em>`;
  fetch(`${API_BASE_URL}/api/bot-settings?authId=${encodeURIComponent(authId)}&phoneNumber=${encodeURIComponent(phone)}`)
    .then(res => res.json())
    .then(data => {
      if (data.success && data.settings) {
        currentSettings = data.settings;
        settingsDiv.innerHTML = renderSettingsView(currentSettings, false);
        setupEditButton();

        // Safely assign click event
        const viewGroupsBtn = document.getElementById('viewGroupsBtn');
        if (viewGroupsBtn) {
          viewGroupsBtn.onclick = () => {
            window.location.href = `botGroups.html?authId=${encodeURIComponent(authId)}&phone=${encodeURIComponent(phone)}`;
          };
        }
      } else {
        settingsDiv.innerHTML = `<em>Could not load settings.</em>`;
      }
    })
    .catch(() => {
      settingsDiv.innerHTML = `<em>Could not load settings.</em>`;
    });
}

function setupEditButton() {
  const editBtn = document.getElementById('editSettingsBtn');
  if (editBtn) {
    editBtn.onclick = () => {
      document.getElementById('botSettings').innerHTML = renderSettingsView(currentSettings, true);
      setupFormHandlers();
      setupAntideleteHandlers();
      setTimeout(() => {
        document.getElementById('modeSelect').focus();
      }, 100);
    };
  }
}

function setupFormHandlers() {
  const form = document.getElementById('settingsForm');
  const cancelBtn = document.getElementById('cancelEditBtn');
  if (form) {
    form.onsubmit = function(e) {
      e.preventDefault();
      const mode = document.getElementById('modeSelect').value;
      const prefix = document.getElementById('prefixInput').value.trim();
      const msgSpan = document.getElementById('settingsMsg');
      if (!prefix || prefix.length > 3 || prefix.length < 1) {
        msgSpan.textContent = '❌ Prefix must be 1-3 characters.';
        msgSpan.style.color = 'red';
        return;
      }
      fetch(`${API_BASE_URL}/api/bot-settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authId, phoneNumber: phone, mode, prefix })
      })
      .then(res => res.json())
      .then(resp => {
        msgSpan.textContent = resp.success ? '✅ Saved!' : '❌ ' + (resp.message || 'Failed');
        msgSpan.style.color = resp.success ? 'green' : 'red';
        if (resp.success) {
          setTimeout(() => {
            loadSettings();
          }, 800);
        }
      })
      .catch(() => {
        msgSpan.textContent = '❌ Network error';
        msgSpan.style.color = 'red';
      });
    };
  }
  if (cancelBtn) {
    cancelBtn.onclick = () => {
      loadSettings();
    };
  }
}

function setupAntideleteHandlers() {
  const modeSelect = document.getElementById('antideleteModeSelect');
  const saveBtn = document.getElementById('saveAntideleteBtn');
  const msgSpan = document.getElementById('antideleteMsg');

  if (saveBtn && modeSelect) {
    saveBtn.onclick = async () => {
      saveBtn.disabled = true;
      msgSpan.textContent = 'Saving...';
      const mode = modeSelect.value;
      const res = await fetch(`${API_BASE_URL}/api/set-antidelete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authId, phoneNumber: phone, mode })
      });
      const data = await res.json();
      msgSpan.textContent = data.success ? '✅ Saved!' : '❌ ' + (data.message || 'Failed');
      saveBtn.disabled = false;
      if (data.success) setTimeout(loadSettings, 800);
    };
  }
}

// Remove excluded logic from bot.js

if (phone && authId) {
  botInfoDiv.innerHTML = `
    <div class="bot-info-row"><strong>Phone Number:</strong> <span class="bot-number">${phone}</span></div>
    <div class="bot-info-row"><strong>Auth ID:</strong> <span class="bot-authid">${authId}</span></div>
    <div id="botSettings"></div>
  `;
  loadSettings();
} else {
  botInfoDiv.innerHTML = `<em>Bot info not found.</em>`;
}


