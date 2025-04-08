/**
 * Created by WebStorm.
 * User: Mehedi Hasan
 * Date: 09 Mar 2025
 * Time: 12:04 PM
 * Email: mdmehedihasanroni28@gmail.com
 */

const {app, BrowserWindow, Tray, Menu, ipcMain, dialog} = require('electron');
const path = require('path');
const fs = require("fs").promises;
const {exec} = require("child_process");

let mainWindow;
let tray;

let config = {
    source: "",
    destination: "",
    password: "",
    autoSyncEnabled: false,
};

const userDataPath = app.getPath("userData");
const configFilePath = path.join(userDataPath, "rsync_config.json");

async function loadConfig() {
    try {
        const data = await fs.readFile(configFilePath, "utf8");
        console.log("Load Config", data);
        config = JSON.parse(data);
    } catch (error) {
        console.log(error)
        await saveConfig();
    }
}

async function saveConfig() {
    await fs.writeFile(configFilePath, JSON.stringify(config, null, 2));
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 360,
        height: 540,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true,
            contextIsolation: false
        },
        icon: path.join(__dirname, 'assets/icon.png'), // Add your icon file here
        frame: false,
        titleBarStyle: "hidden",
        titleBarOverlay: false
    });

    mainWindow.loadFile('index.html');

    mainWindow.webContents.openDevTools();

    // Hide instead of closing
    mainWindow.on('close', (e) => {
        if (!app.isQuitting) {
            e.preventDefault();
            mainWindow.hide();
        }
    });

    createTray();
}

function createTray() {
    const iconPath = path.join(app.getAppPath(), 'assets', 'icon.png');
    tray = new Tray(iconPath);
    // tray = new Tray(path.join(__dirname, 'assets/icon.png')); // Tray icon

    const contextMenu = Menu.buildFromTemplate([
        {
            label: "Show App",
            click: () => mainWindow.show()
        },
        {
            label: "Hide App",
            click: () => console.log('Option 1 clicked')
        },
        {
            label: "Change Setting",
            click: () => console.log('Option 2 clicked')
        },
        {
            label: "Quit",
            click: () => {
                app.isQuitting = true;
                app.quit();
            }
        }
    ]);

    tray.setToolTip('KnowRag Sync');
    tray.setContextMenu(contextMenu);

    tray.on('click', () => {
        mainWindow.show();
    });
}

// Handle folder selection from renderer process
ipcMain.on("select-folder", async (event) => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ["openDirectory"], // Allow selecting a folder
    });

    if (!result.canceled && result.filePaths.length > 0) {
        event.reply("folder-selected", result.filePaths[0]);
    }
});

// Handle rsync transfer of folder
ipcMain.on("sync-folder", (event) => {
// ipcMain.on("sync-folder", (event, {folderPath, destination, password}) => {
    // Ensure the destination ends with a slash for rsync to treat it as a directory

    const rsyncCommand = `sshpass -p '${config.password}' rsync -avz '${config.source}' ${config.destination}`;

    exec(rsyncCommand, (error, stdout, stderr) => {
        if (error) {
            event.reply("sync-status", {success: false, message: `Sync failed: ${error.message}`});
            return;
        }
        if (stderr) {
            console.error("Rsync Stderr:", stderr);
        }
        console.log("Rsync Output:", stdout);
        event.reply("sync-status", {success: true, message: "Folder synced successfully!"});
    });
});

// Handle minimize to tray
ipcMain.on('minimize-to-tray', () => {
    mainWindow.hide();
});

// Handle initial configuration setup
ipcMain.on("set-config", (event, newConfig) => {
    config = { ...config, ...newConfig };
    saveConfig().then(() => {
        event.reply("config-saved", { success: true });
        // startWatcher(); // Restart watcher with new config
    }).catch(err => {
        event.reply("config-saved", { success: false, message: err.message });
    });
});

app.whenReady().then(async () => {
    await loadConfig();
    createWindow();
    // Send current config to renderer process
    mainWindow.webContents.on("did-finish-load", () => {
        mainWindow.webContents.send("config-loaded", config);
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});