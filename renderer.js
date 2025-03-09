/**
 * Created by WebStorm.
 * User: Mehedi Hasan
 * Date: 09 Mar 2025
 * Time: 12:10 PM
 * Email: mdmehedihasanroni28@gmail.com
 */

const { ipcRenderer } = require('electron');

document.getElementById('tray-btn').addEventListener('click', () => {
    ipcRenderer.send('minimize-to-tray');
});

document.getElementById('minimize-btn').addEventListener('click', () => {
    ipcRenderer.send('minimize-to-tray');
});

document.getElementById('close-btn').addEventListener('click', () => {
    window.close();
});

document.getElementById('settings-btn').addEventListener('click', () => {
    // Add settings functionality here
    alert('Settings clicked');
});
