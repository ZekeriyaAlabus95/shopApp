const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Example: Expose a method to get app version
  getVersion: () => ipcRenderer.invoke('get-version'),
  
  // Example: Expose a method to show message box
  showMessage: (title, message) => ipcRenderer.invoke('show-message', title, message),
  
  // Example: Expose a method to get platform info
  getPlatform: () => process.platform,
  
  // Example: Expose a method to open external URL
  openExternal: (url) => ipcRenderer.invoke('open-external', url)
});

// You can add more APIs here as needed for your shop app
// For example:
// - File system operations
// - Database connections
// - Hardware access (barcode scanners, printers)
// - System notifications
