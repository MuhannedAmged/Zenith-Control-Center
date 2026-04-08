import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Timer,
  Play,
  Pause,
  RotateCcw,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { memo, useState, useEffect, useRef } from "react";

export const TimeSettings = memo(() => {
  const [time, setTime] = useState(new Date());
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [timerMode, setTimerMode] = useState("duration"); // 'duration' or 'target'
  const [timerDuration, setTimerDuration] = useState(60); // seconds
  const [targetTime, setTargetTime] = useState("12:00");
  const [remainingTime, setRemainingTime] = useState(60);

  const timerRef = useRef(null);

  useEffect(() => {
    const clockTimer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(clockTimer);
  }, []);

  // Timer Logic
  useEffect(() => {
    if (isTimerActive) {
      timerRef.current = setInterval(() => {
        if (timerMode === "duration") {
          setRemainingTime((prev) => {
            if (prev <= 1) {
              sendNotification(
                "Timer Expired",
                "Your custom timer has finished!",
              );
              setIsTimerActive(false);
              return 0;
            }
            return prev - 1;
          });
        } else {
          // Target Time mode
          const now = new Date();
          const [h, m] = targetTime.split(":").map(Number);
          const target = new Date();
          target.setHours(h, m, 0, 0);

          if (now >= target && now < new Date(target.getTime() + 2000)) {
            sendNotification("Target Reached", `It's now ${targetTime}!`);
            setIsTimerActive(false);
          }
        }
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isTimerActive, timerMode, targetTime]);

  const sendNotification = (title, body) => {
    if (Notification.permission === "granted") {
      new Notification(title, { body, icon: "/icon.png" });
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          new Notification(title, { body });
        }
      });
    }
  };

  const startTimer = () => {
    if (timerMode === "duration") setRemainingTime(timerDuration);
    setIsTimerActive(true);
  };

  const formatRemaining = (s) => {
    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const alarms = [
    { id: 1, time: "07:30", label: "Morning Routine", active: true },
    { id: 2, time: "18:00", label: "Workout", active: false },
  ];

  return (
    <motion.div
      className="bg-glass text-(--text-primary) w-72 p-5 rounded-3xl relative z-50 border border-(--glass-border) mt-2 clickable"
      initial={{ opacity: 0, y: -30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -30, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
    >
      <div className="flex flex-col gap-6">
        {/* Main Clock */}
        <div className="flex flex-col items-center gap-1 py-1">
          <div className="text-[32px] font-bold tracking-tighter tabular-nums drop-shadow-2xl">
            {time.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            })}
            <span className="text-[14px] text-(--text-secondary) ml-1 font-medium tracking-normal align-top">
              {time.getSeconds().toString().padStart(2, "0")}s
            </span>
          </div>
          <div className="text-[10px] uppercase font-bold text-(--text-secondary) tracking-widest flex items-center gap-1">
            <Calendar size={10} className="text-(--accent-color)" />
            {time.toLocaleDateString([], {
              weekday: "short",
              month: "short",
              day: "numeric",
            })}
          </div>
        </div>

        {/* Timer Control Panel (New) */}
        <div className="flex flex-col gap-3 bg-(--btn-bg) p-4 rounded-2xl border border-(--glass-border) overflow-hidden relative">
          <div className="flex justify-between items-center mb-1">
            <div className="flex items-center gap-2">
              <Timer size={14} className="text-(--accent-color)" />
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">
                Smart Timer
              </span>
            </div>
            <div className="flex bg-(--btn-bg) rounded-lg p-0.5">
              <button
                onClick={() => {
                  setTimerMode("duration");
                  setIsTimerActive(false);
                }}
                className={`px-2 py-1 text-[8px] font-bold rounded-md transition-all ${timerMode === "duration" ? "bg-(--text-primary) text-(--bg-color)" : "opacity-40"}`}
              >
                DUR
              </button>
              <button
                onClick={() => {
                  setTimerMode("target");
                  setIsTimerActive(false);
                }}
                className={`px-2 text-(--text-primary) py-1 text-[8px] font-bold rounded-md transition-all ${timerMode === "target" ? "bg-(--text-primary) text-(--bg-color)" : "opacity-40"}`}
              >
                SET
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between py-2">
            {timerMode === "duration" ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <div className="flex flex-col">
                    <input
                      type="number"
                      min="0"
                      max="24"
                      value={Math.floor(timerDuration / 3600)}
                      onChange={(e) => {
                        const h = parseInt(e.target.value || 0);
                        const m = Math.floor((timerDuration % 3600) / 60);
                        setTimerDuration(h * 3600 + m * 60);
                      }}
                      className="bg-transparent text-[24px] font-black w-10 outline-none border-b border-(--glass-border) hover:border-(--text-secondary) transition-colors tabular-nums no-spinner"
                    />
                    <span className="text-[7px] font-black opacity-30 uppercase mt-1">
                      Hrs
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <button
                      onClick={() => {
                        const h = Math.floor(timerDuration / 3600);
                        const m = Math.floor((timerDuration % 3600) / 60);
                        if (h < 24) setTimerDuration((h + 1) * 3600 + m * 60);
                      }}
                      className="p-1 hover:text-(--text-primary) text-(--text-secondary) transition-colors"
                    >
                      <ChevronUp size={12} />
                    </button>
                    <button
                      onClick={() => {
                        const h = Math.floor(timerDuration / 3600);
                        const m = Math.floor((timerDuration % 3600) / 60);
                        if (h > 0) setTimerDuration((h - 1) * 3600 + m * 60);
                      }}
                      className="p-1 hover:text-(--text-primary) text-(--text-secondary) transition-colors"
                    >
                      <ChevronDown size={12} />
                    </button>
                  </div>
                </div>

                <span className="text-[20px] font-bold opacity-20 mb-2">:</span>

                <div className="flex items-center gap-1.5">
                  <div className="flex flex-col">
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={Math.floor((timerDuration % 3600) / 60)}
                      onChange={(e) => {
                        const h = Math.floor(timerDuration / 3600);
                        const m = parseInt(e.target.value || 0);
                        setTimerDuration(h * 3600 + m * 60);
                      }}
                      className="bg-transparent text-[24px] font-black w-10 outline-none border-b border-(--glass-border) hover:border-(--text-secondary) transition-colors tabular-nums no-spinner"
                    />
                    <span className="text-[7px] font-black opacity-30 uppercase mt-1">
                      Mins
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <button
                      onClick={() => {
                        const h = Math.floor(timerDuration / 3600);
                        const m = Math.floor((timerDuration % 3600) / 60);
                        if (m < 59) setTimerDuration(h * 3600 + (m + 1) * 60);
                        else if (h < 24) setTimerDuration((h + 1) * 3600); // Wrap around
                      }}
                      className="p-1 hover:text-(--text-primary) text-(--text-secondary) transition-colors"
                    >
                      <ChevronUp size={12} />
                    </button>
                    <button
                      onClick={() => {
                        const h = Math.floor(timerDuration / 3600);
                        const m = Math.floor((timerDuration % 3600) / 60);
                        if (m > 0) setTimerDuration(h * 3600 + (m - 1) * 60);
                      }}
                      className="p-1 hover:text-(--text-primary) text-(--text-secondary) transition-colors"
                    >
                      <ChevronDown size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col">
                <input
                  type="time"
                  value={targetTime}
                  onChange={(e) => setTargetTime(e.target.value)}
                  className="bg-transparent text-[22px] font-bold outline-none border-b border-(--glass-border) hover:border-(--text-secondary) transition-colors tabular-nums active:bg-(--btn-bg-hover)"
                />
                <span className="text-[8px] font-bold opacity-30 uppercase mt-1">
                  Target Hour
                </span>
              </div>
            )}

            <button
              onClick={
                isTimerActive ? () => setIsTimerActive(false) : startTimer
              }
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                isTimerActive
                  ? "bg-(--btn-bg) text-(--accent-color) border border-(--glass-border)"
                  : "bg-(--accent-color) text-(--bg-color) shadow-(--shadow-glass)"
              }`}
            >
              {isTimerActive ? (
                <Pause size={18} fill="currentColor" />
              ) : (
                <Play size={18} fill="currentColor" className="ml-0.5" />
              )}
            </button>
          </div>

          {isTimerActive && timerMode === "duration" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute inset-0 bg-(--accent-color) text-(--bg-color) flex flex-col items-center justify-center z-10"
            >
              <span className="text-[28px] font-black tabular-nums tracking-tighter">
                {formatRemaining(remainingTime)}
              </span>
              <button
                onClick={() => setIsTimerActive(false)}
                className="mt-1 text-[9px] font-black uppercase tracking-widest opacity-60 hover:opacity-100 flex items-center gap-1"
              >
                <RotateCcw size={10} /> Cancel
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
});
