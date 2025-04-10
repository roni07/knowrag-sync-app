/**
 * Created by WebStorm.
 * User: Mehedi Hasan
 * Date: 09 Mar 2025
 * Time: 12:04 PM
 * Email: mdmehedihasanroni28@gmail.com
 */

const {app, BrowserWindow, Tray, Menu, ipcMain, dialog} = require('electron');
const path = require('path');
const chokidar = require("chokidar");
const fs = require("fs").promises;
const {exec} = require("child_process");
const os = require("os");

let mainWindow;
let tray;

let config = {
    source: "",
    destination: "",
    password: "jb2023",
    autoSyncEnabled: false,
};

let watcher;

const userDataPath = app.getPath("userData");
const configFilePath = path.join(userDataPath, "rsync_config.json");

function normalizePath(p) {
    if (!p) return '';
    let normalized = path.normalize(p);
    normalized = normalized.replace(/^([A-Z]):/, '/mnt/$1').replace(/\\/g, '/');
    return normalized;
}

async function loadConfig() {
    try {
        const data = await fs.readFile(configFilePath, "utf8");
        console.log("default data", data);
        config = JSON.parse(data);
    } catch (error) {
        console.log(error)
        await saveConfig();
    }
}

async function saveConfig() {
    await fs.writeFile(configFilePath, JSON.stringify(config, null, 2));
}

function startWatcher() {
    if (watcher) watcher.close();
    if (!config.source) {
        console.log("No source directory set, watcher not started");
        return;
    }

    console.log("Starting watcher for source:", config.source);
    watcher = chokidar.watch(config.source, {
        ignored: /(^|[\/\\])\../, // Ignore dotfiles
        persistent: true,
        ignoreInitial: true, // Ignore initial scan of files
        awaitWriteFinish: {
            stabilityThreshold: 2000,
            pollInterval: 100,
        }, // Wait for file writes to finish
    });

    const debouncedSync = debounce(syncFolder, 1000);
    watcher
        .on("add", (path) => {
            console.log("File added:", path);
            debouncedSync();
        })
        .on("change", (path) => {
            console.log("File changed:", path);
            debouncedSync();
        })
        .on("unlink", (path) => {
            console.log("File deleted:", path);
            debouncedSync();
        })
        .on("addDir", (path) => {
            console.log("Directory added:", path);
            debouncedSync();
        })
        .on("unlinkDir", (path) => {
            console.log("Directory deleted:", path);
            debouncedSync();
        })
        .on("error", (error) => console.error("Watcher error:", error))
        .on("ready", () => console.log("Watcher is ready"));
}

// Debounce function to prevent rapid successive syncs
function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            console.log("Debounced sync triggered");
            func.apply(this, args);
        }, wait);
    };
}

function syncFolder() {

    const rsyncCommand = `sshpass -p '${config.password}' rsync -avz '${config.source}' ${config.destination}`;

    exec(rsyncCommand, (error, stdout, stderr) => {
        if (error) {
            console.error(`Sync failed: ${error.message}`);
            return;
        }
        if (stderr) console.error("Rsync Stderr:", stderr);
        console.log("Rsync Output:", stdout);
    });
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
        app.isQuitting = true;
        app.quit();
        // if (!app.isQuitting) {
        //     e.preventDefault();
        //     mainWindow.hide();
        // }
    });

    createTray();
}

function createTray() {

    const iconPath = path.join(app.getAppPath(), 'assets', 'icon.png');
    tray = new Tray(iconPath);

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

    let rsyncCommand;
    const testSource = "/mnt/c/Users/ZAAG SYS/Desktop/rsync-wind";

    if (os.platform() === 'win32') {
        rsyncCommand = `wsl sshpass -p '${config.password}' rsync -avz ${testSource} '${config.destination}'`;
        // rsyncCommand = `wsl sshpass -p '${config.password}' rsync -avz "'${normalizePath(config.source)}'" '${config.destination}'`;
        console.log("COMMAND", rsyncCommand)
    } else {
        rsyncCommand = `sshpass -p '${config.password}' rsync -avz '${config.source}' ${config.destination}`;
    }

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
    config = {...config, ...newConfig};
    saveConfig().then(() => {
        event.reply("config-saved", {success: true});
        // startWatcher(); // Restart watcher with new config
    }).catch(err => {
        event.reply("config-saved", {success: false, message: err.message});
    });
});

// Handle toggle switch for auto sync
ipcMain.on("toggle-auto-sync", (event, enabled) => {
    config.autoSyncEnabled = enabled;
    saveConfig().then(() => {
        event.reply("auto-sync-toggled", {success: true, enabled});
        if (enabled) startWatcher(); // Start watcher if enabled
        else if (watcher) watcher.close(); // Stop watcher if disabled
    }).catch(err => {
        event.reply("auto-sync-toggled", {success: false, message: err.message});
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