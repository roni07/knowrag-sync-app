/**
 * Created by WebStorm.
 * User: Mehedi Hasan
 * Date: 09 Mar 2025
 * Time: 12:04 PM
 * Email: mdmehedihasanroni28@gmail.com
 */

const { app, BrowserWindow, Tray, Menu, ipcMain } = require('electron');
const path = require('path');

let mainWindow;
let tray;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true,
            contextIsolation: false
        },
        icon: path.join(__dirname, 'assets/icon.ico'), // Add your icon file here
        frame: false,
        titleBarStyle: "hidden",
        titleBarOverlay: false
    });

    mainWindow.loadFile('index.html');

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
    tray = new Tray(path.join(__dirname, 'assets/icon.ico')); // Tray icon

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

// Handle minimize to tray
ipcMain.on('minimize-to-tray', () => {
    mainWindow.hide();
});

app.whenReady().then(() => {
    createWindow();
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