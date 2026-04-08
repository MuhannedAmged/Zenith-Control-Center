import { useEffect, useRef, useState } from "react";
import PebbleMenu from "./components/MainMenu";
import { VideoSettings } from "./components/VideoSettings";

// Helper: Simple throttle
const throttle = (func, delay) => {
  let inThrottle;
  return (...args) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), delay);
    }
  };
};

function App() {
  const lastStateRef = useRef(null);

  // Detect separate video window mode
  const queryParams = new URLSearchParams(window.location.search);
  const isVideoMode = queryParams.get("mode") === "fullscreen";
  const initialUrl = queryParams.get("src");

  // Zero-Lag Click-Through Handlers
  const handleUIEnter = () => {
    if (window.electron?.setIgnoreMouse) {
      window.electron.setIgnoreMouse(false);
    }
  };

  const handleUILeave = () => {
    if (window.electron?.setIgnoreMouse && !isVideoMode) {
      window.electron.setIgnoreMouse(true);
    }
  };

  // Startup Hydration: Apply saved settings
  useEffect(() => {
    const opacity = localStorage.getItem("ui-opacity") || 80;
    const blur = localStorage.getItem("ui-blur") || 20;
    const stayOnTop = localStorage.getItem("ui-stayOnTop") !== "false";
    const theme = localStorage.getItem("ui-theme") || "dark";

    document.documentElement.style.setProperty(
      "--glass-opacity",
      opacity / 100,
    );
    document.documentElement.style.setProperty("--glass-blur", `${blur}px`);

    // Apply theme on startup
    if (theme === "light") {
      document.documentElement.classList.add("light-mode");
    } else {
      document.documentElement.classList.remove("light-mode");
    }

    if (window.electron?.setAlwaysOnTop) {
      window.electron.setAlwaysOnTop(stayOnTop);
    }
  }, []);

  useEffect(() => {
    if (window.electron?.setIgnoreMouse && !isVideoMode) {
      window.electron.setIgnoreMouse(true);
    }
  }, [isVideoMode]);

  if (isVideoMode) {
    return (
      <div className="w-screen h-screen bg-black relative overflow-hidden flex flex-col items-center">
        <VideoSettings standaloneUrl={initialUrl} />
        {/* Mirror the Pebble Master Controller as a Fullscreen Overlay */}
        <div
          onMouseEnter={handleUIEnter}
          onMouseLeave={handleUILeave}
          className="absolute bottom-12 z-20000 scale-110 drop-shadow-[0_25px_50px_rgba(0,0,0,0.8)]"
        >
          <PebbleMenu />
        </div>
      </div>
    );
  }

  return (
    <div
      onMouseEnter={handleUIEnter}
      onMouseLeave={handleUILeave}
      className="w-fit mx-auto min-w-px min-h-px bg-transparent"
    >
      <PebbleMenu />
    </div>
  );
}

export default App;
