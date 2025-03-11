const { app, BrowserWindow, Tray, Menu, ipcMain } = require('electron');
const path = require('path');

let mainWindow;
let tray;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        frame: false,
        transparent: true,
        titleBarStyle: 'hidden',
        titleBarOverlay: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true,
            contextIsolation: false
        },
        icon: path.join(__dirname, 'assets/icon.ico')
    });

    mainWindow.loadFile('index.html');

    mainWindow.on('close', (e) => {
        if (!app.isQuitting) {
            e.preventDefault();
            mainWindow.hide();
        }
    });

    createTray();
}

function createTray() {
    const iconPath = path.join(app.getAppPath(), 'assets', 'icon.ico');
    tray = new Tray(iconPath);

    const contextMenu = Menu.buildFromTemplate([
        { label: 'Open App', click: () => mainWindow.show() },
        { label: 'Option 1', click: () => console.log('Option 1 clicked') },
        { label: 'Option 2', click: () => console.log('Option 2 clicked') },
        { label: 'Option 3', click: () => console.log('Option 3 clicked') },
        { label: 'Quit', click: () => { app.isQuitting = true; app.quit(); } }
    ]);

    tray.setToolTip('KnowRag Sync App');
    tray.setContextMenu(contextMenu);

    tray.on('click', () => {
        mainWindow.show();
    });
}

ipcMain.on('minimize-to-tray', () => {
    mainWindow.hide();
});

Menu.setApplicationMenu(null);

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