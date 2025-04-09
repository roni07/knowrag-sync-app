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
        showToast("Auto sync off", "info");
    }
});

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

// ipcRenderer.on("sync-status", (event, status) => {
//     if (status.success) {
//         showToast("Sync completed successfully", "success");
//     } else {
//         showToast(status.message, "error");
//         console.log(status.message);
//     }
// });

ipcRenderer.on("sync-status", (event, status) => {
    if (status.success) {
        showToast("Sync completed successfully", "success");
    } else {
        // Format error message for better user experience
        let userFriendlyMessage = "Sync failed";

        if (status.message) {
            // Handle specific rsync error patterns
            if (status.message.includes("No route to host")) {
                userFriendlyMessage = "Cannot reach the server - Check network connection";
            } else if (status.message.includes("Connection refused")) {
                userFriendlyMessage = "Server refused connection - Check if SSH is running";
            } else if (status.message.includes("Permission denied")) {
                userFriendlyMessage = "Access denied - Check your credentials";
            } else if (status.message.includes("No such file or directory")) {
                userFriendlyMessage = "Source or destination path doesn't exist";
            } else if (status.message.includes("Host key verification failed")) {
                userFriendlyMessage = "SSH security verification failed";
            } else if (status.message.includes("connection unexpectedly closed")) {
                userFriendlyMessage = "Connection lost during transfer";
            } else if (status.message.includes("Operation timed out")) {
                userFriendlyMessage = "Connection timed out - Server may be unresponsive";
            } else {
                // Generic fallback for other errors
                userFriendlyMessage = "Sync failed - Check server address and credentials";
            }
        }

        showToast(userFriendlyMessage, "error");

        // Log the full error for debugging
        console.error("Full sync error:", status.message);
    }
});