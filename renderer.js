const { ipcRenderer } = require('electron');

let isSettingsPage = false;

// Get DOM elements
const pageContainer = document.querySelector('.page-container');
const settingsBtn = document.getElementById('settings-btn');
const trayBtn = document.getElementById('tray-btn');
const minimizeBtn = document.getElementById('minimize-btn');
const closeBtn = document.getElementById('close-btn');

// Toggle between pages
function togglePage() {
    isSettingsPage = !isSettingsPage;
    if (isSettingsPage) {
        pageContainer.classList.add('flipped');
    } else {
        pageContainer.classList.remove('flipped');
    }
}

// Event listeners
trayBtn.addEventListener('click', () => {
    ipcRenderer.send('minimize-to-tray');
});

minimizeBtn.addEventListener('click', () => {
    ipcRenderer.send('minimize-to-tray');
});

closeBtn.addEventListener('click', () => {
    window.close();
});

settingsBtn.addEventListener('click', togglePage);