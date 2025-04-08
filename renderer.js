/**
 * Created by WebStorm.
 * User: Mehedi Hasan
 * Date: 09 Mar 2025
 * Time: 12:10 PM
 * Email: mdmehedihasanroni28@gmail.com
 */

const {ipcRenderer} = require('electron');

let isSettingsPage = false;

// Get DOM elements
const pageContainer = document.querySelector('.page-container');
const settingsBtn = document.getElementById('settings-btn');
const minimizeBtn = document.getElementById('minimize-btn');
const closeBtn = document.getElementById('close-btn');

const toggle = document.getElementById("toggleSwitch");
const syncSwitchLabel = document.getElementById("syncSwitchLabel");

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
// trayBtn.addEventListener('click', () => {
//     ipcRenderer.send('minimize-to-tray');
// });

minimizeBtn.addEventListener('click', () => {
    ipcRenderer.send('minimize-to-tray');
});

closeBtn.addEventListener('click', () => {
    window.close();
});

settingsBtn.addEventListener('click', togglePage);

toggle.addEventListener("click", () => {
    toggle.classList.toggle("active");
    toggle.classList.toggle("inactive");

    if (toggle.classList.contains("active")) {
        syncSwitchLabel.textContent = "Connected";
        ipcRenderer.send("sync-folder");
    } else {
        syncSwitchLabel.textContent = "Disconnected";
    }
});

/*Folder Selection*/
document.getElementById("selectFolder").addEventListener("click", () => {
    ipcRenderer.send("select-folder");
});

document.getElementById("changeFolder").addEventListener("click", () => {
    ipcRenderer.send("select-folder");
});

ipcRenderer.on("folder-selected", (event, folderPath) => {

    const folderSelector = document.getElementById("selectFolder");
    const selectedFolder = document.getElementById("selectedFolder");
    const changeFolder = document.getElementById("changeFolder");

    folderSelector.classList.add("hidden");
    selectedFolder.classList.remove("hidden");
    selectedFolder.textContent = folderPath;
    selectedFolder.dataset.path = folderPath;
    changeFolder.classList.remove("hidden");

});

ipcRenderer.on("config-loaded", (event, config) => {

    const folderSelector = document.getElementById("selectFolder");
    const selectedFolder = document.getElementById("selectedFolder");
    const changeFolder = document.getElementById("changeFolder");

    if(config?.source) {
        folderSelector.classList.add("hidden");
        selectedFolder.classList.remove("hidden");
        changeFolder.classList.remove("hidden");
        selectedFolder.textContent = `${config.source}`;
        selectedFolder.dataset.path = config.source;
    } else {
        folderSelector.classList.remove("hidden");
        selectedFolder.classList.add("hidden");
        selectedFolder.dataset.path = "";
        changeFolder.classList.add("hidden");
    }

    document.getElementById("serverAddress").value = config.destination || "";
    document.getElementById("passwordInput").value = config.password || "";
    syncSwitchLabel.textContent = config.autoSyncEnabled ? "Connected" : "Disconnected";
    toggle.classList.add(config.autoSyncEnabled ? "active" : "inactive");

});

document.getElementById("saveConfig").addEventListener("click", () => {
    const source = document.getElementById("selectedFolder").dataset.path;
    const destination = document.getElementById("serverAddress").value;
    const password = document.getElementById("passwordInput").value;

    if (!source || !destination || !password) {
        document.getElementById("syncStatus").textContent = "Please select a folder, enter a destination, and provide a password.";
        return;
    }

    const config = {
        source, destination, password
    }

    ipcRenderer.send("set-config", config);
    // ipcRenderer.send("sync-folder", { folderPath, destination, password });
});

ipcRenderer.on("sync-status", (event, status) => {
    document.getElementById("syncStatus").textContent = status.message;
});