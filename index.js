import { app, BrowserWindow, screen, ipcMain, Tray, Menu, nativeImage } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import { exec } from "child_process";
const isDev = !app.isPackaged;
import wifi from "node-wifi";
import loudness from "loudness";
import brightness from "brightness";

// Initialize WiFi
wifi.init({ iface: null });

// ─── Chromium GPU / Compositor Optimizations ─────────────────────────────────
// These must be set BEFORE app.whenReady() or they are ignored.
//
// Problem: A transparent + alwaysOnTop Electron window forces Windows DWM into
// a full-desktop compositing pass on every frame. Combined with setIgnoreMouseEvents
// IPC calls this creates the stuttering felt when the virtual keyboard opens.
//
// Fix: Tell Chromium to use a software-composited overlay layer and disable
// unnecessary GPU features that are irrelevant for a small floating widget.
app.commandLine.appendSwitch("enable-features", "UseSkiaRenderer");
app.commandLine.appendSwitch("disable-features", "CalculateNativeWinOcclusion");
// CalculateNativeWinOcclusion: Chromium checks window occlusion every frame to
// decide whether to throttle rendering. On Windows, this check itself acquires
// DWM locks and can cause contention when system overlays (virtual keyboard)
// are composited. Disabling it keeps our rAF loop running at full speed.
app.commandLine.appendSwitch("disable-renderer-backgrounding");
// Prevents Chromium from reducing timer resolution when the window is not focused,
// which would slow down the click-through state machine rAF loop.
app.commandLine.appendSwitch("force-device-scale-factor", "1.16");
// Prevents unexpected DPI-scaling reflows that could trigger the resize loop.

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── IPC State Cache ──────────────────────────────────────────────────────────
// Declare outside createWindow so handlers are registered ONCE at process level.
// Registering inside createWindow causes duplicate listeners on Electron hot-reload.
let lastIgnoreState = null;

function createWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth } = primaryDisplay.workAreaSize;

  const windowWidth = 600;
  const windowHeight = 600;

  const xPosition = Math.floor(screenWidth / 2 - windowWidth / 2);
  const yPosition = 0;

  const win = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    x: xPosition,
    y: yPosition,
    frame: false,
    // 'screen-saver' level stays above system overlays (taskbar, Start menu)
    // but critically does NOT conflict with the Windows virtual keyboard DWM layer
    // unlike plain `true` which can cause compositor contention and input lag.
    alwaysOnTop: true,
    type: "toolbar", // Reduces DWM compositing overhead on Windows
    transparent: true,
    hasShadow: false,
    resizable: true, // Must be true for dynamic resize to work
    skipTaskbar: true, // Keeps taskbar clean for an overlay widget
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.cjs"),
      // Prevents Chromium throttling animations/timers when window loses focus.
      // Without this, the rAF loop in App.jsx slows to ~1fps when virtual keyboard
      // or other system overlays steal window focus.
      backgroundThrottling: false,
    },
  });

  // Use 'screen-saver' level so we sit above standard windows but yield to
  // true system overlays (touch keyboard, UAC prompts, etc.) — eliminating
  // the DWM compositor conflict that causes the virtual keyboard lag.
  win.setAlwaysOnTop(true, "screen-saver");

  // Load the app
  if (isDev) {
    win.loadURL("http://localhost:5173");
  } else {
    win.loadFile(path.join(__dirname, "design/dist/index.html"));
  }

  // IPC handlers are registered below at module level, outside createWindow,
  // to avoid duplicating listeners if createWindow is ever called again (macOS activate).
}

app.whenReady().then(() => {
  createWindow();

  // ─── System Tray (Hidden Icons) ─────────────────────────────────────────────
  // Show the app icon in the Windows system tray (notification area / hidden icons).
  // Users right-click the icon to quit since the main window has no OS chrome.
  const iconPath = path.join(__dirname, "tray-icon.png");
  const trayIcon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
  const tray = new Tray(trayIcon);

  tray.setToolTip("Zenith Control Center");

  // Build the right-click context menu
  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Zenith Control Center",
      enabled: false, // title row — not clickable
    },
    { type: "separator" },
    {
      label: "Show",
      click: () => {
        const wins = BrowserWindow.getAllWindows();
        if (wins.length > 0) {
          wins[0].show();
          wins[0].focus();
        } else {
          createWindow();
        }
      },
    },
    {
      label: "Quit",
      click: () => {
        tray.destroy();
        app.quit();
      },
    },
  ]);

  // Left-click toggles show/hide; right-click shows menu
  tray.on("click", () => {
    const wins = BrowserWindow.getAllWindows();
    if (wins.length > 0) {
      const win = wins[0];
      win.isVisible() ? win.hide() : win.show();
    }
  });

  tray.setContextMenu(contextMenu);

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Do NOT quit when all windows close — the tray keeps the app alive.
// The only exit point is Tray → Quit.
app.on("window-all-closed", () => {
  // On macOS it is conventional to keep the app running until explicit quit.
  // On Windows, since we have a tray, we also stay alive.
  // No-op intentionally.
});

// ─── Window Behavior IPC Handlers ────────────────────────────────────────────
// Registered HERE (module level) so they are bound once per process.
// If these lived inside createWindow(), every macOS 'activate' call that
// triggers createWindow() would ADD another duplicate listener — causing
// IPC spam and compounding the lag issue.

// Click-Through: state-cached so setIgnoreMouseEvents is only called on change.
// The renderer-side state machine (App.jsx) already deduplicates, but we add a
// second layer here in case multiple windows send conflicting messages.
ipcMain.on("set-ignore-mouse", (event, ignore) => {
  const browserWindow = BrowserWindow.fromWebContents(event.sender);
  if (!browserWindow || browserWindow.isDestroyed()) return;
  if (ignore !== lastIgnoreState) {
    // { forward: true } is required so that even in click-through mode, Electron
    // still forwards mouse events to the renderer — this keeps the rAF loop alive
    // so state can flip back to interactive when the cursor re-enters a .clickable zone.
    browserWindow.setIgnoreMouseEvents(ignore, { forward: true });
    lastIgnoreState = ignore;
  }
});

// Always-on-top: 'screen-saver' level sits above standard app windows but
// yields to true system overlays (touch keyboard, UAC). This removes the DWM
// compositor contention that causes stutter when the virtual keyboard opens.
ipcMain.on("set-always-on-top", (event, enabled) => {
  const browserWindow = BrowserWindow.fromWebContents(event.sender);
  if (!browserWindow || browserWindow.isDestroyed()) return;
  browserWindow.setAlwaysOnTop(enabled, "screen-saver");
});

// Auto-Resize: 2px threshold prevents the feedback loop:
//   setSize → layout reflow → ResizeObserver fires → resize-window IPC → setSize …
ipcMain.on("resize-window", (event, { width, height }) => {
  const browserWindow = BrowserWindow.fromWebContents(event.sender);
  if (!browserWindow || browserWindow.isDestroyed()) return;
  const [currentW, currentH] = browserWindow.getSize();
  if (Math.abs(currentW - width) > 2 || Math.abs(currentH - height) > 2) {
    browserWindow.setSize(width, height);
  }
});

// Handle brightness control (Native Library)
ipcMain.on("set-brightness", (event, value) => {
  brightness
    .set(value / 100)
    .catch((err) => console.error("Brightness set error:", err));
});

// Handle volume control (Native Library)
ipcMain.on("set-volume", (event, value) => {
  loudness
    .setVolume(value)
    .catch((err) => console.error("Volume set error:", err));
});

// Handle Wi-Fi Control (Library API)
ipcMain.on("set-wifi", (event, enabled) => {
  // node-wifi doesn't have a reliable cross-platform 'disabled' at JS level for admin interfaces,
  // so we'll use the library's internal approach or the existing netsh wrapper where it's clearer.
  const status = enabled ? "enabled" : "disabled";
  const command = `netsh interface set interface "Wi-Fi" admin=${status}`;
  exec(command);
});

// Handle Fullscreen
ipcMain.on("set-fullscreen", (event, enabled) => {
  const browserWindow = BrowserWindow.fromWebContents(event.sender);
  if (!browserWindow || browserWindow.isDestroyed()) return;

  // Transparent/Frameless windows require resizable:true to enter fullscreen safely
  browserWindow.setResizable(enabled);
  browserWindow.setFullScreen(enabled);

  // Revert resizable to false if we just came out of fullscreen
  if (!enabled) {
    browserWindow.setResizable(false);
  }
});

// Handle Bluetooth Control
ipcMain.on("set-bluetooth", (event, enabled) => {
  // Using PnpDevice to find Bluetooth and toggle state
  const command = `powershell "Get-PnpDevice | Where-Object {$_.Class -eq 'Bluetooth'} | ${enabled ? "Enable-PnpDevice" : "Disable-PnpDevice"} -Confirm:$false"`;
  exec(command);
});

// --- Performance Optimized System Info Fetching ---
let systemInfoCache = null;
let lastCacheUpdate = 0;
const CACHE_TTL = 5000; // 5 Seconds cache for heavy hardware scans

const withTimeout = (promise, ms, fallback) => {
  return Promise.race([
    promise,
    new Promise((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
};

ipcMain.handle("get-system-info", async () => {
  const now = Date.now();
  if (systemInfoCache && now - lastCacheUpdate < CACHE_TTL) {
    return systemInfoCache;
  }

  try {
    const fetchBrightness = withTimeout(brightness.get(), 500, 0.5);
    const fetchVolume = withTimeout(loudness.getVolume(), 500, 50);
    const fetchWifi = withTimeout(
      new Promise((resolve) =>
        wifi.getCurrentConnections((err, conn) => resolve(conn || [])),
      ),
      1500,
      [],
    );
    // systeminformation's bluetooth scanner uses wmic which is deprecated on Win11 and throws ENOENT.
    // Replace with a simple promise returning an empty array to prevent complete crash.
    const fetchBt = Promise.resolve([]);

    const [bright, vol, connections, btDevices] = await Promise.all([
      fetchBrightness,
      fetchVolume,
      fetchWifi,
      fetchBt,
    ]);

    const activeWifi = connections[0]?.ssid || "Disconnected";
    // We can't reliably read live BT devices without a native module or slow powershell scan,
    // so just return a standard placeholder to prevent UI errors.
    const activeBt = "System BT";

    systemInfoCache = {
      brightness: Math.round(bright * 100),
      volume: vol,
      wifi: activeWifi,
      bluetooth: activeBt,
    };
    lastCacheUpdate = now;
    return systemInfoCache;
  } catch (error) {
    console.error("System info error:", error);
    return (
      systemInfoCache || {
        brightness: 50,
        volume: 50,
        wifi: "Loading...",
        bluetooth: "Off",
      }
    );
  }
});

let videoWindow = null;

ipcMain.on("open-video-window", (event, url) => {
  if (videoWindow) {
    videoWindow.show();
    videoWindow.webContents.send("update-video-src", url);
    return;
  }

  videoWindow = new BrowserWindow({
    fullscreen: true,
    frame: false,
    backgroundColor: "#000000",
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      webSecurity: false, // Allow local video file loading
      preload: path.join(__dirname, "preload.cjs"),
    },
  });

  const baseUrl = isDev
    ? "http://localhost:5173"
    : `file://${path.join(__dirname, "design/dist/index.html")}`;
  videoWindow.loadURL(
    `${baseUrl}?mode=fullscreen&src=${encodeURIComponent(url)}`,
  );

  videoWindow.on("closed", () => {
    videoWindow = null;
  });
});

ipcMain.on("close-video-window", () => {
  if (videoWindow) {
    videoWindow.close();
  }
});
