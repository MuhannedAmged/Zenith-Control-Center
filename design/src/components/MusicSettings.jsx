import { memo, useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Play, Pause, Volume2, FolderOpen, Repeat } from "lucide-react";

export const MusicSettings = memo(({ isVisible }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [vol, setVol] = useState(1);
  const [currentSong, setCurrentSong] = useState(() => {
    const saved = localStorage.getItem("zenith-music-last");
    return saved
      ? JSON.parse(saved)
      : {
          title: "No track selected",
          artist: "Choose a file to begin",
          albumArt: "/music.avif",
        };
  });

  // Persist song choice
  useEffect(() => {
    localStorage.setItem("zenith-music-last", JSON.stringify(currentSong));
  }, [currentSong]);

  const audioRef = useRef(new Audio());
  const fileInputRef = useRef(null);

  // Handle Audio Events
  useEffect(() => {
    const audio = audioRef.current;

    const onTimeUpdate = () => {
      setProgress((audio.currentTime / audio.duration) * 100 || 0);
    };

    const onLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const onEnded = () => {
      if (!isLooping) {
        setIsPlaying(false);
        setProgress(0);
      }
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("ended", onEnded);
    };
  }, [isLooping]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.loop = isLooping;
    }
  }, [isLooping]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      audioRef.current.src = url;
      setCurrentSong({
        title: file.name.replace(/\.[^/.]+$/, ""),
        artist: "Local File",
        albumArt: currentSong.albumArt, // Keeping placeholder for now
      });
      setIsPlaying(true);
      audioRef.current.play();
    }
  };

  const togglePlay = () => {
    if (!audioRef.current.src) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const formatTime = (time) => {
    if (isNaN(time)) return "0:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <motion.div
      className="bg-glass w-72 p-5 rounded-3xl relative z-50 border border-(--glass-border) mt-2 clickable overflow-hidden"
      initial={{ opacity: 0, y: -30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -30, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="audio/*"
        className="hidden"
      />

      <div className="flex flex-col gap-6 relative">
        {/* Album Art & Titles */}
        <div className="flex items-center gap-4 px-1">
          <motion.div
            className="w-16 h-16 rounded-2xl overflow-hidden shadow-2xl relative shrink-0 border border-(--glass-border)"
            animate={{ rotate: isPlaying ? 360 : 0 }}
            transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          >
            <img
              src={currentSong.albumArt}
              alt="Album Art"
              className="w-full h-full object-cover"
            />
          </motion.div>

          <div className="flex flex-col gap-1 overflow-hidden">
            <h3 className="text-[14px] font-bold tracking-tight truncate">
              {currentSong.title}
            </h3>
            <p className="text-[10px] text-(--text-secondary) font-medium uppercase tracking-wider">
              {currentSong.artist}
            </p>
          </div>

          <button
            onClick={() => fileInputRef.current.click()}
            className="ml-auto p-2 rounded-full hover:bg-(--btn-bg-hover) transition-colors bg-(--btn-bg)"
            title="Open File"
          >
            <FolderOpen size={16} className="text-(--accent-color)" />
          </button>
        </div>

        {/* Visualizer */}
        <div className="flex items-end justify-center gap-[3px] h-6 px-2 opacity-60">
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={i}
              className="w-1 bg-(--text-secondary) rounded-full"
              animate={{
                height: isPlaying && isVisible ? [4, 16, 8, 20, 6][i % 5] : 4,
              }}
              transition={{
                duration: 0.5 + Math.random(),
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>

        {/* Progress Bar */}
        <div className="flex flex-col gap-2 px-1">
          <div
            className="relative h-1 w-full bg-(--range-track) rounded-full overflow-hidden cursor-pointer"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const pct = (e.clientX - rect.left) / rect.width;
              audioRef.current.currentTime = pct * audioRef.current.duration;
            }}
          >
            <motion.div
              className="absolute top-0 left-0 h-full bg-(--accent-color)"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-[9px] font-bold text-(--text-secondary) tracking-widest uppercase">
            <span className="tabular-nums">
              {formatTime(audioRef.current.currentTime)}
            </span>
            <span className="tabular-nums">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-between items-center px-4 py-3 bg-(--btn-bg) rounded-2xl border border-(--glass-border)">
          <div className="flex items-center gap-3">
            <Volume2 size={14} className="text-(--text-secondary)" />
            <div className="w-20 px-1 group cursor-pointer relative flex items-center h-4">
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={vol}
                onChange={(e) => {
                  const v = e.target.value;
                  setVol(v);
                  audioRef.current.volume = v;
                }}
                style={{
                  background: `linear-gradient(to right, var(--accent-color) ${vol * 100}%, var(--range-track) ${vol * 100}%)`,
                }}
                className="w-full"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <motion.button
              onClick={togglePlay}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="w-6 h-6 bg-(--accent-color) text-white flex items-center justify-center rounded-full shadow-(--shadow-glass)"
            >
              {isPlaying ? (
                <Pause size={14} fill="currentColor" />
              ) : (
                <Play size={14} fill="currentColor" />
              )}
            </motion.button>
            <button
              onClick={() => setIsLooping(!isLooping)}
              className={`transition-colors w-6 h-6 flex items-center justify-center rounded-full ${
                isLooping
                  ? "bg-(--accent-color) text-(--accent-color)"
                  : "text-(--text-secondary) hover:text-(--text-primary)"
              }`}
            >
              <Repeat size={14} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
});
