import { API_BASE_URL } from './config.js';

const email = sessionStorage.getItem('email');
const authId = sessionStorage.getItem('authId');
const name = email ? email.split('@')[0] : 'User';
const subLevel = sessionStorage.getItem('subscriptionLevel') || '-';
const daysLeft = sessionStorage.getItem('daysLeft') || '-';


document.getElementById('greet').textContent = name;
document.getElementById('userEmail').textContent = email || '-';
document.getElementById('userAuthId').textContent = authId || '-';
document.getElementById('userSubLevel').textContent = subLevel;
document.getElementById('userDaysLeft').textContent = daysLeft;
console.log(`User: ${name}, Email: ${email}, Auth ID: ${authId}, Subscription Level: ${subLevel}, Days Left: ${daysLeft}`);

document.getElementById('deployBtn').onclick = () => {
  window.location.href = 'deploy.html';
};

async function loadBots() {
  if (!authId) return;
  const botListContainer = document.getElementById('botListContainer');
  botListContainer.innerHTML = `<p class="placeholder">Loading bots...</p>`;

  try {
    const res = await fetch(`${API_BASE_URL}/api/bots?authId=${encodeURIComponent(authId)}`);
    const data = await res.json();
    if (data.success && data.bots && data.bots.length) {
      botListContainer.innerHTML =
        `<ul class="bot-list">` +
        data.bots.map(bot =>
          `<li>
            <a class="bot-link" href="bot.html?phone=${encodeURIComponent(bot.phone_number)}&authId=${encodeURIComponent(authId)}">
              <span class="bot-number">${bot.phone_number}</span>
            </a>
          </li>`
        ).join('') +
        `</ul>`;
    } else {
      botListContainer.innerHTML = `<p class="placeholder"><em>No bots found.</em></p>`;
    }
  } catch (err) {
    botListContainer.innerHTML = `<p class="placeholder"><em>Error loading bots.</em></p>`;
  }
}

loadBots();
async function fetchUserIP() {
  try {
    const res = await fetch('https://api.ipify.org?format=json');
    const data = await res.json();
    const ipSpan = document.getElementById('userIP');
    ipSpan.textContent = data.ip;
  } catch (err) {
    console.error('Failed to fetch IP:', err);
    document.getElementById('userIP').textContent = 'Unavailable';
  }
}

fetchUserIP();
function getUserLocation() {
  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        document.getElementById('location').textContent =
          `Lat: ${latitude.toFixed(4)}, Lon: ${longitude.toFixed(4)}`;
        showMap(latitude, longitude);
      },
      async () => {
        // Fallback to IP-based location
        try {
          const res = await fetch("https://ipapi.co/json");
          const data = await res.json();
          document.getElementById('location').textContent =
            `City: ${data.city}, Country: ${data.country_name}`;
          document.getElementById('locationMap').innerHTML = '';
        } catch {
          document.getElementById('location').textContent = 'Location unavailable';
          document.getElementById('locationMap').innerHTML = '';
        }
      }
    );
  } else {
    document.getElementById('location').textContent = 'Location not supported';
    document.getElementById('locationMap').innerHTML = '';
  }
}

function showMap(latitude, longitude) {
  const mapDiv = document.getElementById('locationMap');
  mapDiv.innerHTML = `
    <iframe
      width="100%"
      height="180"
      frameborder="0"
      style="border-radius:12px;box-shadow:0 2px 8px #3be8b022;"
      src="https://www.openstreetmap.org/export/embed.html?bbox=${longitude-0.01}%2C${latitude-0.01}%2C${longitude+0.01}%2C${latitude+0.01}&layer=mapnik&marker=${latitude}%2C${longitude}"
      allowfullscreen
      loading="lazy"
    ></iframe>
  `;
}

function updateBatteryBar(level, charging) {
  const batteryBar = document.getElementById('batteryBar');
  const percent = Math.round(level * 100);
  batteryBar.innerHTML = `
    <div class="battery-outer">
      <div class="battery-inner" style="width:${percent}%;background:${charging ? '#43e97b' : '#ffd700'}"></div>
      <span class="battery-label">${percent}% ${charging ? '⚡' : ''}</span>
    </div>
  `;
}

async function getBatteryInfo() {
  if (navigator.getBattery) {
    try {
      const battery = await navigator.getBattery();
      updateBatteryBar(battery.level, battery.charging);
      battery.addEventListener('levelchange', () => updateBatteryBar(battery.level, battery.charging));
      battery.addEventListener('chargingchange', () => updateBatteryBar(battery.level, battery.charging));
    } catch {
      document.getElementById('batteryBar').innerHTML = '<span>Battery info error</span>';
    }
  } else {
    document.getElementById('batteryBar').innerHTML = '<span>Battery info not supported</span>';
  }
}

function getSystemInfo() {
  const platform = navigator.platform || 'Unknown';
  const browser = navigator.userAgent.match(/(Firefox|OPR|Edg|Chrome|Safari)/)?.[0] || 'Unknown';
  const language = navigator.language || 'Unknown';

  document.getElementById('systemInfo').innerHTML = `
    <div class="sysinfo-row"><span>🖥️ OS:</span> <strong>${platform}</strong></div>
    <div class="sysinfo-row"><span>🌐 Browser:</span> <strong>${browser}</strong></div>
    <div class="sysinfo-row"><span>🌎 Language:</span> <strong>${language}</strong></div>
  `;
}

getSystemInfo();
getBatteryInfo();
getUserLocation();
