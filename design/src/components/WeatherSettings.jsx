import { memo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Cloud,
  CloudRain,
  CloudLightning,
  Sun,
  CloudSun,
  Droplets,
  Wind,
  Navigation,
  RefreshCw,
} from "lucide-react";

export const WeatherSettings = memo(({ isVisible }) => {
  const [weather, setWeather] = useState(() => {
    const saved = localStorage.getItem("zenith-weather-cache");
    return saved ? JSON.parse(saved) : null;
  });
  const [location, setLocation] = useState(() => {
    const saved = localStorage.getItem("zenith-location-cache");
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(!weather);

  useEffect(() => {
    if (weather) localStorage.setItem("zenith-weather-cache", JSON.stringify(weather));
    if (location) localStorage.setItem("zenith-location-cache", JSON.stringify(location));
  }, [weather, location]);
  const [error, setError] = useState(null);

  const fetchWeatherData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Get Location via IP (No permissions needed)
      const locRes = await fetch("http://ip-api.com/json/");
      const locData = await locRes.json();

      if (locData.status !== "success") throw new Error("Location failed");
      setLocation(locData);

      // 2. Get Weather via Open-Meteo
      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${locData.lat}&longitude=${locData.lon}&current_weather=true&hourly=relative_humidity_2m,windspeed_10m`,
      );
      const weatherData = await weatherRes.json();
      setWeather(weatherData.current_weather);
    } catch (err) {
      setError("Failed to load weather");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isVisible) {
      fetchWeatherData();
    }
  }, [isVisible]);

  const getWeatherIcon = (code) => {
    if (code === 0) return <Sun className="text-yellow-400" />;
    if (code <= 3) return <CloudSun className="text-blue-300" />;
    if (code <= 48) return <Cloud className="text-gray-400" />;
    if (code <= 67) return <CloudRain className="text-blue-400" />;
    if (code <= 99) return <CloudLightning className="text-purple-400" />;
    return <CloudSun className="text-blue-300" />;
  };

  const getWeatherLabel = (code) => {
    if (code === 0) return "Clear Sky";
    if (code <= 3) return "Partly Cloudy";
    if (code <= 48) return "Overcast";
    if (code <= 67) return "Rainy";
    if (code <= 99) return "Stormy";
    return "Cloudy";
  };

  return (
    <motion.div
      className="bg-glass text-(--text-primary) w-72 p-5 rounded-3xl relative z-50 border border-(--glass-border) mt-2 clickable overflow-hidden"
      initial={{ opacity: 0, y: -30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -30, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
    >
      <div className="flex flex-col gap-5">
        {/* Header: Location & Refresh */}
        <div className="flex justify-between items-center px-1">
          <div className="flex items-center gap-2">
            <Navigation size={14} className="text-(--accent-color)" />
            <span className="text-[12px] font-bold tracking-wider truncate max-w-[150px]">
              {location
                ? `${location.city}, ${location.countryCode}`
                : "Detecting..."}
            </span>
          </div>
          <button
            onClick={fetchWeatherData}
            disabled={loading}
            className={`p-2 rounded-full hover:bg-(--btn-bg-hover) transition-all ${loading ? "animate-spin opacity-50" : ""}`}
          >
            <RefreshCw size={14} />
          </button>
        </div>

        {/* Main Weather Display */}
        {loading && !weather ? (
          <div className="py-10 flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 border-4 border-(--glass-border) border-t-(--accent-color) rounded-full animate-spin" />
            <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-(--text-secondary)">
              Fetching local data
            </span>
          </div>
        ) : error ? (
          <div className="py-10 text-center">
            <span className="text-red-400 text-[11px] font-bold">{error}</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 py-2">
            <div className="relative">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-(--text-primary) drop-shadow-[0_0_25px_rgba(255,255,255,0.3)]"
              >
                {getWeatherIcon(weather.weathercode)}
              </motion.div>
            </div>

            <div className="flex flex-col items-center">
              <div className="flex items-start">
                <span className="text-5xl font-bold tracking-tighter tabular-nums leading-none">
                  {Math.round(weather.temperature)}
                </span>
                <span className="text-xl font-bold ml-1 mt-1">°</span>
                <span className="text-xl font-bold opacity-30 ml-2 mt-1 italic tracking-tighter shrink-0">
                  CELSIUS
                </span>
              </div>
              <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-(--text-secondary) mt-2">
                {getWeatherLabel(weather.weathercode)}
              </span>
            </div>

            {/* Weather Details (Badges) */}
            <div className="grid grid-cols-2 gap-2 w-full mt-2">
              <div className="flex items-center gap-3 bg-(--btn-bg) rounded-2xl p-3 border border-(--glass-border) hover:bg-(--btn-bg-hover) transition-colors">
                <Wind size={16} className="text-(--accent-color) shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-(--text-secondary) tracking-widest uppercase">
                    Wind Speed
                  </span>
                  <span className="text-[12px] font-bold tabular-nums">
                    {weather.windspeed}{" "}
                    <span className="text-[8px] opacity-50">km/h</span>
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-(--btn-bg) rounded-2xl p-3 border border-(--glass-border) hover:bg-(--btn-bg-hover) transition-colors">
                <Droplets size={16} className="text-(--accent-color) shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-(--text-secondary) tracking-widest uppercase">
                    Condition
                  </span>
                  <span className="text-[10px] font-bold truncate">
                    Balanced
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
});
