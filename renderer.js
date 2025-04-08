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
        ipcRenderer.send("toggle-auto-sync", true);
        ipcRenderer.send("sync-folder");
    } else {
        syncSwitchLabel.textContent = "Disconnected";
        ipcRenderer.send("toggle-auto-sync", false);
    }
});

function showToast(message, type = "info") {
    // Remove existing toast if any
    const existingToast = document.getElementById("toast");
    if (existingToast) {
        existingToast.remove();
    }

    // Create toast element
    const toast = document.createElement("div");
    toast.id = "toast";
    toast.className = `toast ${type}`;
    toast.textContent = message;

    // Add to document
    document.body.appendChild(toast);

    // Show toast with animation
    setTimeout(() => toast.classList.add("show"), 10);

    // Auto hide after 3 seconds
    setTimeout(() => {
        toast.classList.remove("show");
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

/*Folder Selection*/
document.getElementById("selectFolder").addEventListener("click", () => {
    ipcRenderer.send("select-folder");
});

document.getElementById("changeFolder").addEventListener("click", () => {
    ipcRenderer.send("select-folder");
});

document.getElementById("saveConfig").addEventListener("click", () => {

    const destination = document.getElementById("serverAddress").value;
    const source = document.getElementById("selectedFolder").dataset.path;
    // const password = document.getElementById("passwordInput").value;

    if (!source || !destination) {
        // if (!source || !destination || !password) {
        // document.getElementById("syncStatus").textContent = "Please select a folder, enter a destination";
        showToast("Please select source and destination", "error");
        return;
    }

    const config = {
        source, destination
    }

    ipcRenderer.send("set-config", config);
    showToast("Configuration saved", "success");

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

    if (config.autoSyncEnabled) {
        toggle.classList.add("active");
        toggle.classList.remove("inactive");
        syncSwitchLabel.textContent = "Connected";
    } else {
        toggle.classList.add("inactive");
        toggle.classList.remove("active");
        syncSwitchLabel.textContent = "Disconnected";
    }

});
