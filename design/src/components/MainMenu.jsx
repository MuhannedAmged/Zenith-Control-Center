import { useState } from "react";
import { Menu, X } from "lucide-react";
import { MenuActions } from "./MenuActions";
import { DeviceSettings } from "./DeviceSettings";
import { MusicSettings } from "./MusicSettings";
import { TimeSettings } from "./TimeSettings";
import { VideoSettings } from "./VideoSettings";
import { AppSettings } from "./AppSettings";
import { WeatherSettings } from "./WeatherSettings";
import { NoteSettings } from "./NoteSettings";
import { AnimatePresence, motion } from "framer-motion";

const PebbleMenu = () => {
  const [isActive, setIsActive] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);
  const [visitedMenus, setVisitedMenus] = useState(new Set());

  const handleSetActiveMenu = (menuId) => {
    setActiveMenu(menuId);
    if (menuId !== null) {
      setVisitedMenus((prev) => {
        const next = new Set(prev);
        next.add(menuId);
        return next;
      });
    }
  };

  const toggleMenu = () => {
    if (isActive) {
      handleSetActiveMenu(null);
    }
    setIsActive(!isActive);
  };

  return (
    <div className="relative translate-y-[-3px] flex flex-col items-center w-fit">
      <div className="cursor-pointer" onClick={toggleMenu}>
        <div className="relative z-50">
          <svg width="0" height="0" className="absolute">
            <defs>
              <clipPath
                id="pebble-rounded-360"
                clipPathUnits="objectBoundingBox"
              >
                <path
                  d="M 0.2 0.1 
                        C 0.05 0.1, 0.05 0.2, 0.1 0.3
                        L 0.4 0.9
                        C 0.45 1, 0.55 1, 0.6 0.9
                        L 0.9 0.3
                        C 0.95 0.2, 0.95 0.1, 0.8 0.1
                        Z"
                />
              </clipPath>
            </defs>
          </svg>

          <div
            style={{ clipPath: "url(#pebble-rounded-360)" }}
            className="w-[45px] h-[30px] bg-glass flex justify-center items-start pt-[6.5px] cursor-pointer clickable"
          >
            <button
              className="w-4 h-4 flex items-center justify-center text-(--text-primary) transition-all cursor-pointer"
              aria-label="Toggle Menu"
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={isActive ? "close" : "open"}
                  initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.2 }}
                >
                  {isActive ? (
                    <X size={15} strokeWidth={2.5} />
                  ) : (
                    <Menu size={15} strokeWidth={2.5} />
                  )}
                </motion.div>
              </AnimatePresence>
            </button>
          </div>
        </div>
      </div>

      <div className="w-full flex flex-col items-center">
        <AnimatePresence>
          {isActive && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full flex flex-col items-center"
            >
              <MenuActions activeMenu={activeMenu} setActiveMenu={handleSetActiveMenu} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* PERSISTENT ZENITH VIEWPORT: Tabs stay mounted once visited to preserve state/music/timers */}
        <div className={`relative w-full ${!isActive ? "hidden" : "block"}`}>
          {visitedMenus.has(1) && (
            <div style={{ display: activeMenu === 1 ? "block" : "none" }}>
              <DeviceSettings isVisible={isActive && activeMenu === 1} />
            </div>
          )}
          {visitedMenus.has(2) && (
            <div style={{ display: activeMenu === 2 ? "block" : "none" }}>
              <WeatherSettings isVisible={isActive && activeMenu === 2} />
            </div>
          )}
          {visitedMenus.has(3) && (
            <div style={{ display: activeMenu === 3 ? "block" : "none" }}>
              <MusicSettings isVisible={isActive && activeMenu === 3} />
            </div>
          )}
          {visitedMenus.has(4) && (
            <div style={{ display: activeMenu === 4 ? "block" : "none" }}>
              <NoteSettings isVisible={isActive && activeMenu === 4} />
            </div>
          )}
          {visitedMenus.has(5) && (
            <div style={{ display: activeMenu === 5 ? "block" : "none" }}>
              <VideoSettings isVisible={isActive && activeMenu === 5} />
            </div>
          )}
          {visitedMenus.has(6) && (
            <div style={{ display: activeMenu === 6 ? "block" : "none" }}>
              <TimeSettings isVisible={isActive && activeMenu === 6} />
            </div>
          )}
          {visitedMenus.has(7) && (
            <div style={{ display: activeMenu === 7 ? "block" : "none" }}>
              <AppSettings isVisible={isActive && activeMenu === 7} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PebbleMenu;
