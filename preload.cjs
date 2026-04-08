const { contextBridge, ipcRenderer, webUtils } = require("electron");

contextBridge.exposeInMainWorld("electron", {
  setBrightness: (v) => ipcRenderer.send("set-brightness", v),
  setVolume: (v) => ipcRenderer.send("set-volume", v),
  setWifi: (v) => ipcRenderer.send("set-wifi", v),
  setBluetooth: (v) => ipcRenderer.send("set-bluetooth", v),
  resizeWindow: (size) => ipcRenderer.send("resize-window", size),
  setIgnoreMouse: (ignore) => ipcRenderer.send("set-ignore-mouse", ignore),
  setAlwaysOnTop: (enabled) => ipcRenderer.send("set-always-on-top", enabled),
  setFullScreen: (full) => ipcRenderer.send("set-fullscreen", full),
  openVideoWindow: (url) => ipcRenderer.send("open-video-window", url),
  closeVideoWindow: () => ipcRenderer.send("close-video-window"),
  getSystemInfo: () => ipcRenderer.invoke("get-system-info"),
  onUpdateVideoSrc: (callback) =>
    ipcRenderer.on("update-video-src", (event, url) => callback(url)),
  getPathForFile: (file) => webUtils?.getPathForFile(file) || file.path,
});
