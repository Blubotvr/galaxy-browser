const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('galaxy', {
  homeUrl: () => ipcRenderer.invoke('home-url'),
  loadConfig: () => ipcRenderer.invoke('cfg-load'),
  saveConfig: (c) => ipcRenderer.invoke('cfg-save', c),
  addMusic: () => ipcRenderer.invoke('music-add'),
  vpnStatus: () => ipcRenderer.invoke('vpn-status'),
  vpnToggle: () => ipcRenderer.invoke('vpn-toggle'),
  onStatus: (fn) => ipcRenderer.on('status', (_e, m) => fn(m)),
  onStatus: (fn) => ipcRenderer.on('status', (_e, m) => fn(m)),
  onOpenTab: (fn) => ipcRenderer.on('open-tab', (_e, url) => fn(url)),
});
