import { API_BASE_URL, SOCKET_BASE_URL } from './config.js';
import { parsePhoneNumberFromString } from 'https://esm.sh/libphonenumber-js@1.10.24';


let lastFormattedNumber = null;
let lastAuthId = null;

// === COUNTRY DROPDOWN LOGIC ===
async function populateCountryDropdown() {
  const container = document.getElementById('countryDropdown');
  const toggle = document.getElementById('dropdownToggle');
  const searchInput = document.getElementById('countrySearch');
  const list = document.getElementById('dropdownList');
  const hiddenInput = document.getElementById('countryCode');

  let countryItems = [];

  try {
    let response = await fetch('https://restcountries.com/v3.1/all?fields=name,cca2,idd,flags');
    let countries;
    if (response.ok) {
      countries = await response.json();
      console.log('Fetched countries from API:', countries.length);
    } else {
      response = await fetch('countries.json');
      if (!response.ok) throw new Error('Both remote and local country list failed');
      countries = await response.json();
      console.log('Fetched countries from local JSON:', countries.length);
    }

    countries.sort((a, b) => a.name.common.localeCompare(b.name.common));

    countryItems = countries.filter(country =>
      country.idd && country.idd.root && country.idd.suffixes && country.idd.suffixes.length > 0
    ).map(country => {
      const code = country.cca2;
      const name = country.name.common;
      const callingCode = country.idd.root + country.idd.suffixes[0];
      const flagUrl = country.flags.png;

      const li = document.createElement('li');
      li.innerHTML = `<img src="${flagUrl}" alt="${name}" width="24" height="16"> ${name} (${callingCode})`;
      li.addEventListener('click', (event) => {
        event.stopPropagation();
        toggle.innerHTML = `<img src="${flagUrl}" alt="${name}" width="24" height="16"> ${name} (${callingCode})`;
        list.classList.remove('show');
        hiddenInput.value = code;
        searchInput.value = '';
        filterCountries('');
        console.log('Country selected:', name, code);
      });
      return { element: li, name: name.toLowerCase() };
    });

    function filterCountries(searchValue) {
      // Remove all country <li> except the search box
      list.querySelectorAll('li:not(.search-box)').forEach(li => li.remove());
      countryItems
        .filter(item => item.name.includes(searchValue))
        .forEach(item => list.appendChild(item.element));
    }

    // Render all countries initially
    filterCountries('');
    console.log('Dropdown initialized with countries:', countryItems.length);

    searchInput.addEventListener('input', () => {
      filterCountries(searchInput.value.toLowerCase());
    });

    toggle.addEventListener('click', (event) => {
      event.stopPropagation();
      list.classList.toggle('show');
      if (list.classList.contains('show')) {
        searchInput.focus();
      }
      console.log('Dropdown toggled:', list.classList.contains('show'));
    });

    list.addEventListener('click', (event) => {
      event.stopPropagation();
    });

    document.addEventListener('click', (e) => {
      if (
        !container.contains(e.target) &&
        e.target !== toggle
      ) {
        list.classList.remove('show');
      }
    });

  } catch (err) {
    console.error('❌ Failed to load country list:', err);
  }
}

// === PAIRING METHOD UI ===
document.querySelectorAll('.pairing-method-card').forEach(card => {
  card.addEventListener('click', () => {
    document.querySelectorAll('.pairing-method-card').forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');
    card.querySelector('input').checked = true;
  });
});

// === DEPLOY FORM SUBMIT ===
document.getElementById('deployForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const country = document.getElementById('countryCode').value; // ISO code, e.g. 'NG'
  let phoneNumberInput = document.getElementById('phoneNumber').value.trim();
  const pairingMethod = document.querySelector('input[name="pairingMethod"]:checked').value;
  const authId = sessionStorage.getItem('authId');
  const deployMessage = document.getElementById('deployStatus');
  const qrCodeContainer = document.getElementById('qrPairingArea');
  deployMessage.textContent = '';
  qrCodeContainer.innerHTML = '';

  // Validate
  if (!authId) {
    deployMessage.textContent = '❌ Auth ID missing. Please log in again.';
    return;
  }
  if (!country || !phoneNumberInput) {
    deployMessage.textContent = '❌ Please select country and enter phone number.';
    return;
  }

  // Format and validate phone number
  let phoneNumber;
  try {
    if (!phoneNumberInput.startsWith('+')) {
      phoneNumber = parsePhoneNumberFromString(phoneNumberInput, country);
    } else {
      phoneNumber = parsePhoneNumberFromString(phoneNumberInput);
    }
  } catch (err) {
    deployMessage.textContent = '❌ Invalid phone number format.';
    return;
  }

  if (!phoneNumber || !phoneNumber.isValid()) {
    deployMessage.textContent = '❌ Please enter a valid phone number for the selected country.';
    return;
  }

  // Format to E.164 and remove the +
  const formattedNumber = phoneNumber.number.replace(/^\+/, '');
  lastFormattedNumber = formattedNumber;
  lastAuthId = authId;
  socket.emit('join-session-room', { authId, phoneNumber: formattedNumber });
  try {
    console.log('Deploying bot with:', { authId, phoneNumber: formattedNumber, pairingMethod });
    const subscriptionLevel = sessionStorage.getItem('subscriptionLevel');
      const daysLeft = sessionStorage.getItem('daysLeft');

      const res = await fetch(`${API_BASE_URL}/api/deploy-bot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authId,
          phoneNumber: formattedNumber,
          pairingMethod,
          subscriptionLevel,
          daysLeft
        })
      });
        const data = await res.json();

    if (!res.ok) {
      // Socket already handled it
      if (!data.handledViaSocket && data.message) {
        deployMessage.textContent = `❌ ${data.message}`;
        deployMessage.style.color = 'red';
      }
      return; // 🔁 Don't run anything else
    }

    // ✅ Only run this on success:
    deployMessage.textContent = data.message || 'Deployment started! Watch for QR or pairing code below.';
    deployMessage.style.color = 'green';

// If the backend confirms the bot is connected, redirect to dashboard after a short delay
if (data.success && (data.message?.toLowerCase().includes('connected') || data.message?.toLowerCase().includes('complete'))) {
  setTimeout(() => {
    window.location.href = 'dashboard.html';
  }, 2000); // 2 seconds delay for user to see the message
}

  } catch (error) {
    deployMessage.textContent = '❌ An error occurred. Please try again later.';
    console.error('Error deploying bot:', error);
  }
});

// === SOCKET.IO CONNECTION ===
const socket = io(SOCKET_BASE_URL);

socket.on('connect', () => {
  console.log('🔌 Socket.IO connected:', socket.id);
  // Optionally, register session here if you want to auto-reconnect
  if (lastAuthId && lastFormattedNumber) {
    socket.emit('register-bot-session', { authId: lastAuthId, phoneNumber: lastFormattedNumber });
  }
});
socket.on('status', (data) => {
  console.log('📥 Status update:', data);
  const deployMessage = document.getElementById('deployStatus');
  if (data?.error) {
    deployMessage.textContent = `❌ ${data.message}`;
    deployMessage.style.color = 'red'; // Optional
  } else if (data?.message) {
    deployMessage.textContent = data.message;
  }
});
socket.on('qr', (data) => {
  console.log('[FRONTEND] Received QR code:', data);
  const qrCodeContainer = document.getElementById('qrPairingArea');
  const deployMessage = document.getElementById('deployStatus');
  qrCodeContainer.innerHTML = '';
  const img = document.createElement('img');
  img.src = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(data.qr)}&size=250x250`;
  img.alt = 'QR Code';
  qrCodeContainer.appendChild(img);
  deployMessage.textContent = '📱 Scan the QR code with WhatsApp!';
});

socket.on('pairingCode', (data) => {
  console.log('[FRONTEND] Received pairing code:', data);
  const qrCodeContainer = document.getElementById('qrPairingArea');
  const deployMessage = document.getElementById('deployStatus');
  // Format code: group by 4, join with spaces
  const formatted = data.code.replace(/-/g, ' ').replace(/(.{4})/g, '$1 ').trim();
  qrCodeContainer.innerHTML = `
    <div class="pairing-note">
      <strong>BMM Bot Pairing</strong><br>
      <span>Connect to your phone with this code:</span>
    </div>
    <div class="pairing-code-glow">${formatted}</div>
  `;
  deployMessage.textContent = '🔑 Enter this pairing code in WhatsApp!';
});

socket.on('registration-status', (data) => {
  const qrCodeContainer = document.getElementById('qrPairingArea');
  const deployMessage = document.getElementById('deployStatus');
  if (data.status === 'registered') {
    deployMessage.textContent = '✅ Registration complete, bot started!';
    qrCodeContainer.innerHTML = '';
    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 2000); // Redirect after 2 seconds
  } else if (data.status === 'registration_failed') {
    deployMessage.textContent = '❌ Registration failed. Please try again.';
    qrCodeContainer.innerHTML = '';
  } else {
    deployMessage.textContent = data.status;
  }
});

document.addEventListener('DOMContentLoaded', () => {
  populateCountryDropdown();
});