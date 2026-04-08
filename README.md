# Zenith Control Center

A floating, transparent, modern UI control center for Windows. Zenith acts as a system overlay to control music, video, Wi-Fi, bluetooth, volume, and more, seamlessly integrating with your desktop aesthetics.

## Features
- **Transparent & Frameless Interface:** A sleek module-based UI that hovers elegantly above your active windows.
- **System Interactions:** Control the volume, screen brightness, Wi-Fi connectivity, and Bluetooth state.
- **Dark & Light Modes:** Built-in seamless support for switching between dark and light themes without reloading.
- **Glassmorphism OS Tray Menu:** A completely customized system tray menu with rapid controls like Quick Hide / Quit.
- **Always on Top (Non-Intrusive):** Sits reliably on top of other applications while yielding perfectly to DWM overlays like the Windows virtual keyboard.

## Installation
You can build the executable setup yourself.

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development environment:
   ```bash
   npm run dev
   ```
4. Build the executable (`dist_app` or `build_output`):
   ```bash
   npm run build
   ```

## Tech Stack
- Frontend: React, Vite, Tailwind CSS, Framer Motion
- Backend/Wrapper: Electron, Node.js + IPC (System Information, node-wifi, brightness, loudness)
