import { memo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Settings,
  Cpu,
  Database,
  Eye,
  Monitor,
  Shield,
  Info,
  ChevronRight,
  ExternalLink,
  RefreshCw,
  Zap,
} from "lucide-react";

export const AppSettings = memo(() => {
  const [cpuUsage, setCpuUsage] = useState(12);
  const [ramUsage, setRamUsage] = useState(45);

  // Settings with Persistence
  const [opacity, setOpacity] = useState(
    () => Number(localStorage.getItem("ui-opacity")) || 80,
  );
  const [blur, setBlur] = useState(
    () => Number(localStorage.getItem("ui-blur")) || 20,
  );
  const [stayOnTop, setStayOnTop] = useState(
    () => localStorage.getItem("ui-stayOnTop") !== "false",
  );
  const [autoHide, setAutoHide] = useState(
    () => localStorage.getItem("ui-autoHide") === "true",
  );
  const [theme, setTheme] = useState(
    () => localStorage.getItem("ui-theme") || "dark",
  );

  // Load and Apply Initial Visuals
  useEffect(() => {
    document.documentElement.style.setProperty(
      "--glass-opacity",
      opacity / 100,
    );
    document.documentElement.style.setProperty("--glass-blur", `${blur}px`);
    
    // Apply theme class
    if (theme === "light") {
      document.documentElement.classList.add("light-mode");
    } else {
      document.documentElement.classList.remove("light-mode");
    }
  }, [theme]);

  // Simulated System Stats
  useEffect(() => {
    const interval = setInterval(() => {
      setCpuUsage((prev) =>
        Math.min(Math.max(prev + (Math.random() * 4 - 2), 5), 35),
      );
      setRamUsage((prev) =>
        Math.min(Math.max(prev + (Math.random() * 2 - 1), 40), 55),
      );
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Update Settings
  const updateOpacity = (val) => {
    setOpacity(val);
    localStorage.setItem("ui-opacity", val);
    document.documentElement.style.setProperty("--glass-opacity", val / 100);
  };

  const updateBlur = (val) => {
    setBlur(val);
    localStorage.setItem("ui-blur", val);
    document.documentElement.style.setProperty("--glass-blur", `${val}px`);
  };

  const toggleStayOnTop = () => {
    const newState = !stayOnTop;
    setStayOnTop(newState);
    localStorage.setItem("ui-stayOnTop", newState);
    if (window.electron?.setAlwaysOnTop) {
      window.electron.setAlwaysOnTop(newState);
    }
  };

  const toggleAutoHide = () => {
    const newState = !autoHide;
    setAutoHide(newState);
    localStorage.setItem("ui-autoHide", newState);
  };

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("ui-theme", newTheme);
  };

  // Range Slider Background Utility
  const getRangeBackground = (value, min, max) => {
    const percentage = ((value - min) / (max - min)) * 100;
    // Use blue accent color for the fill to ensure consistent branding in both modes
    return `linear-gradient(to right, var(--accent-color) ${percentage}%, rgba(150, 150, 150, 0.1) ${percentage}%)`;
  };

  const sections = [
    {
      id: "system",
      title: "System Performance",
      icon: <Cpu size={14} className="text-(--accent-color)" />,
      content: (
        <div className="flex flex-col gap-4 mt-2">
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-(--text-secondary)">
              <span className="flex items-center gap-1">
                <Cpu size={10} /> Processor Load
              </span>
              <span className="text-(--accent-color) tabular-nums">
                {Math.round(cpuUsage)}%
              </span>
            </div>
            <div className="h-1 w-full bg-(--btn-bg) rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-(--accent-color) shadow-(--shadow-glass)"
                animate={{ width: `${cpuUsage}%` }}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-(--text-secondary)">
              <span className="flex items-center gap-1">
                <Database size={10} /> Memory Usage
              </span>
              <span className="text-(--accent-color) tabular-nums">
                {Math.round(ramUsage)}%
              </span>
            </div>
            <div className="h-1 w-full bg-(--btn-bg) rounded-full overflow-hidden">
              <motion.div
                // Keeping a slightly different blue here for visual distinction as requested initially
                className="h-full bg-blue-400 shadow-(--shadow-glass)"
                animate={{ width: `${ramUsage}%` }}
              />
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "appearance",
      title: "UI Customization",
      icon: <Eye size={14} className="text-blue-400" />,
      content: (
        <div className="flex flex-col gap-4 mt-2">
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-white/40">
              <span>Glass Opacity</span>
              <span className="text-white tabular-nums">{opacity}%</span>
            </div>
            <input
              type="range"
              min="20"
              max="100"
              value={opacity}
              onChange={(e) => updateOpacity(Number(e.target.value))}
              style={{ background: getRangeBackground(opacity, 20, 100) }}
              className="w-full"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-white/40">
              <span>Blur Intensity</span>
              <span className="text-white tabular-nums">{blur}px</span>
            </div>
            <input
              type="range"
              min="0"
              max="60"
              value={blur}
              onChange={(e) => updateBlur(Number(e.target.value))}
              style={{ background: getRangeBackground(blur, 0, 60) }}
              className="w-full"
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] font-bold">Theme Mode</span>
              <span className="text-[8px] opacity-30 font-black uppercase tracking-widest">
                {theme === "dark" ? "Classic Zenith" : "Zenith Light"}
              </span>
            </div>
            <button
              onClick={toggleTheme}
              className={`w-12 h-6 rounded-full relative transition-all border ${theme === "light" ? "bg-white border-slate-200 shadow-sm" : "bg-white/5 border-white/10"}`}
            >
              <motion.div
                className={`absolute top-0.5 left-0.5 w-4.5 h-4.5 rounded-full flex items-center justify-center ${theme === "light" ? "bg-blue-600 text-white" : "bg-white text-black"}`}
                animate={{ x: theme === "light" ? 22 : 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              >
                {theme === "light" ? <Zap size={10} fill="currentColor" /> : <div className="w-2 h-2 bg-black rounded-full" />}
              </motion.div>
            </button>
          </div>
        </div>
      ),
    },
    {
      id: "behavior",
      title: "App Behavior",
      icon: <Monitor size={14} className="text-(--accent-color)" />,
      content: (
        <div className="flex flex-col gap-2 mt-2">
          <div className="flex items-center justify-between p-3 bg-(--btn-bg) rounded-xl border border-(--glass-border)">
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] font-bold">Always On Top</span>
              <span className="text-[8px] text-(--text-secondary) font-black uppercase tracking-widest">
                Pin to workspace
              </span>
            </div>
            <button
              onClick={toggleStayOnTop}
              className={`w-8 h-4 rounded-full relative transition-colors ${stayOnTop ? "bg-(--accent-color)" : "bg-(--glass-border)"}`}
            >
              <motion.div
                className="absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full shadow-sm"
                animate={{ x: stayOnTop ? 16 : 0 }}
              />
            </button>
          </div>
          <div className="flex items-center justify-between p-3 bg-(--btn-bg) rounded-xl border border-(--glass-border)">
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] font-bold">Auto-Hide Menu</span>
              <span className="text-[8px] text-(--text-secondary) font-black uppercase tracking-widest">
                Efficiency mode
              </span>
            </div>
            <button
              onClick={toggleAutoHide}
              className={`w-8 h-4 rounded-full relative transition-colors ${autoHide ? "bg-(--accent-color)" : "bg-(--glass-border)"}`}
            >
              <motion.div
                className="absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full shadow-sm"
                animate={{ x: autoHide ? 16 : 0 }}
              />
            </button>
          </div>
        </div>
      ),
    },
  ];

  return (
    <motion.div
      className="bg-glass w-72 p-5 rounded-3xl relative z-50 border border-(--glass-border) mt-2 clickable max-h-[450px] no-scrollbar overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      initial={{ opacity: 0, y: -30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -30, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
    >
      <div className="flex flex-col gap-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-(--glass-border) pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/20 rounded-2xl border border-(--glass-border)">
              <Settings size={18} className="text-(--accent-color)" />
            </div>
            <div className="flex flex-col">
              <h2 className="text-[15px] font-black tracking-tight">
                Settings
              </h2>
              <span className="text-[8px] font-bold text-(--accent-color) uppercase tracking-[0.2em] opacity-80">
                v1.0.0-Stable
              </span>
            </div>
          </div>
          <button className="p-2 hover:bg-(--btn-bg) rounded-full transition-colors text-(--text-secondary)">
            <RefreshCw size={14} />
          </button>
        </div>

        {/* Action Sections */}
        <div className="flex flex-col gap-8">
          {sections.map((section) => (
            <div key={section.id} className="flex flex-col gap-3">
              <div className="flex items-center gap-2 group cursor-default">
                {section.icon}
                <span className="text-[10px] font-black uppercase tracking-[0.15em] opacity-40 group-hover:opacity-100 transition-opacity">
                  {section.title}
                </span>
                <div className="h-px grow bg-linear-to-r from-(--glass-border) to-transparent" />
              </div>
              {section.content}
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
});
