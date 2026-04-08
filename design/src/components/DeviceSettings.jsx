import { motion } from "framer-motion";
import {
  Sun,
  Volume2,
  Wifi,
  Bluetooth,
  Zap,
  Battery,
} from "lucide-react";
import { memo, useState, useEffect, useRef } from "react";

export const DeviceSettings = memo(() => {
  const [brightness, setBrightnessValue] = useState(50);
  const [volume, setVolumeValue] = useState(65);
  const debounceTimerRef = useRef(null);

  const debounceIPC = (fn, delay = 50) => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(fn, delay);
  };

  const getRangeBackground = (value) => {
    return `linear-gradient(to right, var(--accent-color) ${value}%, var(--range-track) ${value}%)`;
  };
  const [wifi, setWifi] = useState(true);
  const [wifiName, setWifiName] = useState("Loading...");
  const [bluetooth, setBluetooth] = useState(true);
  const [btDevice, setBtDevice] = useState("Loading...");

  const [nightLight, setNightLight] = useState(false);
  const [powerMode, setPowerMode] = useState("Balanced");
  const [timeout, setTimeoutValue] = useState(10);
  const [battery, setBattery] = useState({ level: 0, charging: false });

  useEffect(() => {
    // Initial hardware lookup
    if (window.electron?.getSystemInfo) {
      window.electron.getSystemInfo().then((info) => {
        if (info) {
          setBrightnessValue(info.brightness || 50);
          setVolumeValue(info.volume || 50);
          setWifiName(info.wifi || "Disconnected");
          setBtDevice(info.bluetooth || "Off");
        }
      });
    }

    let batteryInstance = null;
    const updateStats = (bat) => {
      setBattery({
        level: Math.round(bat.level * 100),
        charging: bat.charging,
      });
    };

    if (navigator.getBattery) {
      navigator.getBattery().then((bat) => {
        batteryInstance = bat;
        updateStats(bat);
        bat.addEventListener("levelchange", () => updateStats(bat));
        bat.addEventListener("chargingchange", () => updateStats(bat));
      });
    }

    return () => {
      if (batteryInstance) {
        batteryInstance.removeEventListener("levelchange", () =>
          updateStats(batteryInstance),
        );
        batteryInstance.removeEventListener("chargingchange", () =>
          updateStats(batteryInstance),
        );
      }
    };
  }, []);

  const handleBrightnessChange = (e) => {
    const value = parseInt(e.target.value);
    setBrightnessValue(value);
    debounceIPC(() => {
      if (window.electron?.setBrightness) window.electron.setBrightness(value);
    }, 50);
  };

  const handleVolumeChange = (e) => {
    const value = parseInt(e.target.value);
    setVolumeValue(value);
    debounceIPC(() => {
      if (window.electron?.setVolume) window.electron.setVolume(value);
    }, 50);
  };

  const handleWifiToggle = () => {
    const newVal = !wifi;
    setWifi(newVal);
    if (window.electron?.setWifi) window.electron.setWifi(newVal);
  };

  const handleBluetoothToggle = () => {
    const newVal = !bluetooth;
    setBluetooth(newVal);
    if (window.electron?.setBluetooth) window.electron.setBluetooth(newVal);
  };

  const powerModes = ["Eco", "Balanced", "Performance"];

  return (
    <motion.div
      className="bg-glass w-72 p-5 rounded-3xl relative z-50 border border-(--glass-border) mt-2 clickable"
      initial={{ opacity: 0, y: -30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -30, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
    >
      <div className="flex flex-col gap-6">
        {/* Top Badges */}
        <div className="flex justify-between items-center px-1">
          <div className="flex items-center gap-2 bg-(--btn-bg) px-3 py-1.5 rounded-full border border-(--glass-border) shrink-0">
            <Battery
              size={14}
              className={battery.level < 20 ? "text-(--text-secondary)" : "text-(--accent-color)"}
            />
            <span className="text-[11px] font-bold">{battery.level || 0}%</span>
          </div>
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border shrink-0 ${battery.charging ? "bg-blue-500/20 border-blue-400/20" : "bg-(--btn-bg) border-(--glass-border)"}`}
          >
            <Zap
              size={14}
              className={
                battery.charging
                  ? "text-(--accent-color) animate-pulse"
                  : "text-(--text-secondary)"
              }
            />
            <span className="text-[11px] font-bold">
              {battery.charging ? "Charging" : "Discharging"}
            </span>
          </div>
        </div>

        {/* Sliders Area */}
        <div className="flex flex-col gap-5 px-1">
          {/* Brightness */}
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center opacity-70">
              <div className="flex items-center gap-2">
                <Sun size={14} strokeWidth={2.5} />
                <span className="text-[10px] uppercase tracking-widest font-bold">
                  Brightness
                </span>
              </div>
              <span className="text-[10px] font-bold">{brightness}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={brightness}
              onChange={handleBrightnessChange}
              style={{ background: getRangeBackground(brightness) }}
              className="w-full"
            />
          </div>

          {/* Volume */}
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center opacity-70">
              <div className="flex items-center gap-2">
                <Volume2 size={14} strokeWidth={2.5} />
                <span className="text-[10px] uppercase tracking-widest font-bold">
                  Volume
                </span>
              </div>
              <span className="text-[10px] font-bold">{volume}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={handleVolumeChange}
              style={{ background: getRangeBackground(volume) }}
              className="w-full"
            />
          </div>
        </div>

        {/* Toggles & Selection */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-3 bg-(--btn-bg) p-4 rounded-2xl border border-(--glass-border)">
            <div className="flex items-center gap-2 opacity-60">
              <Wifi size={14} />
              <span className="text-[10px] font-bold uppercase">Wi-Fi</span>
            </div>
            <button
              onClick={handleWifiToggle}
              className={`text-[11px] font-bold py-1.5 rounded-lg transition-all ${wifi ? "bg-(--accent-color) text-white shadow-(--shadow-glass)" : "bg-(--btn-bg) hover:bg-(--btn-bg-hover) text-(--text-secondary)"}`}
            >
              {wifi ? wifiName : "Disabled"}
            </button>
          </div>
          <div className="flex flex-col gap-3 bg-(--btn-bg) p-4 rounded-2xl border border-(--glass-border)">
            <div className="flex items-center gap-2 opacity-60">
              <Bluetooth size={14} />
              <span className="text-[10px] font-bold uppercase">Bluetooth</span>
            </div>
            <button
              onClick={handleBluetoothToggle}
              className={`text-[11px] font-bold py-1.5 rounded-lg transition-all ${bluetooth ? "bg-(--accent-color) text-white shadow-(--shadow-glass)" : "bg-(--btn-bg) hover:bg-(--btn-bg-hover) text-(--text-secondary)"}`}
            >
              {bluetooth ? btDevice : "Off"}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
});
