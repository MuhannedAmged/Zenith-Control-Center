import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  Video,
  Volume2,
  Maximize,
  Minimize,
  FolderOpen,
  Repeat,
  Camera,
} from "lucide-react";
import { memo, useState, useEffect, useRef } from "react";

export const VideoSettings = memo(({ standaloneUrl }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLooping, setIsLooping] = useState(false);

  const getRangeBackground = (value, min = 0, max = 100) => {
    const percentage = ((value - min) / (max - min)) * 100;
    return `linear-gradient(to right, var(--accent-color) ${percentage}%, var(--range-track) ${percentage}%)`;
  };
  const [isFullscreen, setIsFullscreen] = useState(!!standaloneUrl);
  const [showControls, setShowControls] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [volume, setVolume] = useState(1);
  const [sysVolume, setSysVolume] = useState(65);
  const [sysBrightness, setSysBrightness] = useState(50);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [filePath, setFilePath] = useState(
    () => localStorage.getItem("zenith-video-last-path") || standaloneUrl || "",
  );
  const [currentVideo, setCurrentVideo] = useState({
    title: standaloneUrl
      ? standaloneUrl.split(/[\\/]/).pop()
      : "No video selected",
    resolution: "Detecting...",
    fps: "–",
  });

  const videoRef = useRef(null);
  const playerContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const controlsTimeoutRef = useRef(null);

  // Sync state with <video> element
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let lastUpdate = 0;
    const onTimeUpdate = () => {
      const now = Date.now();
      if (now - lastUpdate > 250) {
        // Update UI every 250ms max
        setProgress((video.currentTime / video.duration) * 100 || 0);
        lastUpdate = now;
      }
    };

    const onLoadedMetadata = () => {
      setDuration(video.duration);
      setCurrentVideo((prev) => ({
        ...prev,
        resolution: `${video.videoWidth}x${video.videoHeight}`,
      }));
    };

    const onEnded = () => {
      if (!isLooping) {
        setIsPlaying(false);
        setProgress(0);
      }
    };

    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("loadedmetadata", onLoadedMetadata);
    video.addEventListener("ended", onEnded);
    document.addEventListener("fullscreenchange", onFullscreenChange);

    return () => {
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("loadedmetadata", onLoadedMetadata);
      video.removeEventListener("ended", onEnded);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
    };
  }, [isLooping]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
      videoRef.current.loop = isLooping;
    }
  }, [volume, isLooping]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isFullscreen) {
        toggleFullscreen(e);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen]);

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (!showSettings) setShowControls(false);
    }, 4000);
  };

  useEffect(() => {
    if (standaloneUrl && videoRef.current) {
      videoRef.current.src = standaloneUrl;
      setIsPlaying(true);
      videoRef.current.play();
    }

    if (window.electron && standaloneUrl) {
      const handleUpdate = (url) => {
        if (videoRef.current) {
          videoRef.current.src = url;
          setFilePath(url);
          setIsPlaying(true);
          videoRef.current.play();
        }
      };
      window.electron.onUpdateVideoSrc?.(handleUpdate);
    }
  }, [standaloneUrl]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      // In modern Electron, file.path is often blank in the renderer.
      // We use our preload helper to get the real OS path.
      const absolutePath = window.electron?.getPathForFile?.(file) || file.path;
      setFilePath(absolutePath);
      localStorage.setItem("zenith-video-last-path", absolutePath);
      videoRef.current.src = url;
      setCurrentVideo({
        title: file.name.replace(/\.[^/.]+$/, ""),
        resolution: "Detecting...",
        fps: "60",
      });
      setIsPlaying(true);
      videoRef.current.play();
    }
  };

  const togglePlay = (e) => {
    e?.stopPropagation();
    if (!videoRef.current?.src) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleLoop = (e) => {
    e?.stopPropagation();
    setIsLooping(!isLooping);
  };

  const toggleFullscreen = (e) => {
    e?.stopPropagation();
    if (standaloneUrl) {
      window.electron.closeVideoWindow();
    } else if (filePath) {
      window.electron.openVideoWindow(filePath);
    }
  };

  const handleSysVolume = (e) => {
    const val = parseInt(e.target.value);
    setSysVolume(val);
    window.electron?.setVolume(val);
  };

  const handleSysBrightness = (e) => {
    const val = parseInt(e.target.value);
    setSysBrightness(val);
    window.electron?.setBrightness(val);
  };

  const takeSnapshot = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const link = document.createElement("a");
    link.download = `snapshot_${new Date().getTime()}.jpg`;
    link.href = canvas.toDataURL("image/jpeg", 0.9);
    link.click();
  };
  const formatTime = (time) => {
    if (isNaN(time)) return "0:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleProgressClick = (e) => {
    e.stopPropagation();
    if (!videoRef.current || !videoRef.current.src) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    videoRef.current.currentTime = pct * videoRef.current.duration;
  };

  return (
    <motion.div
      className={`text-(--text-primary) ${
        isFullscreen
          ? "fixed inset-0 z-9998 p-0 rounded-none border-none bg-black"
          : "bg-glass w-72 p-5 rounded-3xl relative z-50 border border-(--glass-border) mt-2 clickable overflow-hidden"
      }`}
      initial={{ opacity: 0, y: -30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -30, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="video/*"
        className="hidden"
      />

      <div className="flex flex-col gap-5 relative">
        {/* Compact Title Bar (Hidden in Fullscreen/Standalone to keep UI clean as PebbleMenu is now used) */}
        {!isFullscreen && (
          <div className="flex justify-between items-center px-1">
            <div className="flex items-center gap-2">
              <Video size={14} className="text-blue-400" />
              <span className="text-[10px] font-black uppercase tracking-widest opacity-60">
                Video Center
              </span>
            </div>
            <button
              onClick={() => fileInputRef.current.click()}
              className="px-2 py-1 bg-(--btn-bg) rounded-full text-[9px] font-bold uppercase transition-all hover:bg-(--btn-bg-hover) flex items-center gap-2"
            >
              <FolderOpen size={10} />
              Open Video
            </button>
          </div>
        )}

        {/* Video Player Container (Supports Fullscreen) */}
        <div
          ref={playerContainerRef}
          onMouseMove={handleMouseMove}
          className={`relative bg-black group/container transition-all overflow-hidden ${
            isFullscreen
              ? "fixed inset-0 z-9999 flex items-center justify-center p-0 m-0"
              : "aspect-video rounded-2xl border border-white/5 shadow-inner"
          }`}
        >
          <video
            ref={videoRef}
            onClick={togglePlay}
            className={`w-full h-full ${isFullscreen ? "object-contain" : "object-cover pointer-events-none"}`}
          />

          {/* PAUSE OVERLAY */}
          {!isPlaying && videoRef.current?.src && (
            <div
              onClick={togglePlay}
              className="absolute inset-0 bg-black/40 flex items-center justify-center z-20 cursor-pointer"
            >
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="p-4 bg-(--accent-color) rounded-full text-white shadow-(--shadow-glass)"
              >
                <Play fill="currentColor" size={32} className="ml-1" />
              </motion.div>
            </div>
          )}

          {/* NO DATA STATE */}
          {(!videoRef.current || !videoRef.current.src) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center opacity-20 pointer-events-none">
              <Video size={isFullscreen ? 120 : 48} />
            </div>
          )}

          {/* === CUSTOM PLAYER CONTROLS === */}
          <AnimatePresence>
            {showControls && videoRef.current?.src && (
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                className={`absolute bottom-72 left-1/2 -translate-x-1/2 w-[94%] bg-black/80 backdrop-blur-3xl border border-white/10 rounded-[30px] p-5 z-10000 flex flex-col gap-4 shadow-[0_32px_64px_rgba(0,0,0,0.5)] transition-all ${isFullscreen ? "max-w-4xl bottom-10 p-6 gap-6 rounded-[40px]" : "max-w-xl"}`}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header (Only in FS) */}
                {isFullscreen && (
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col">
                      <span className="text-[20px] font-black tracking-tighter truncate max-w-md">
                        {currentVideo.title}
                      </span>
                      <span className="text-[10px] uppercase font-black tracking-widest text-white/40">
                        {currentVideo.resolution} • {currentVideo.fps} FPS
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={toggleFullscreen}
                        className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-all"
                      >
                        <Minimize size={20} />
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  <div
                    className="h-1.5 w-full bg-(--range-track) rounded-full overflow-hidden cursor-pointer relative group"
                    onClick={handleProgressClick}
                  >
                    <div className="absolute inset-0 bg-(--btn-bg) opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div
                      className="h-full bg-(--accent-color) shadow-(--shadow-glass)"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[9px] font-black tracking-widest text-(--text-secondary) uppercase tabular-nums">
                    <span>
                      {formatTime(videoRef.current?.currentTime || 0)}
                    </span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                {/* FS Bottom Bar */}
                <div
                  className={`flex justify-between items-center bg-white/5 p-3 rounded-2xl border border-white/5 ${isFullscreen ? "p-4 rounded-3xl" : "p-2"}`}
                >
                  <div className="flex items-center gap-4">
                    <Repeat
                      onClick={toggleLoop}
                      size={isFullscreen ? 20 : 16}
                      className={`cursor-pointer transition-all ${isLooping ? "text-(--accent-color) stroke-[3px] drop-shadow-[0_0_8px_var(--accent-color)]" : "text-(--text-secondary) hover:text-(--text-primary)"}`}
                    />

                    {/* System Controls */}
                    <div className="flex items-center gap-4 border-l border-white/10 pl-4">
                      <div className="flex items-center gap-2 group/v">
                        <Volume2
                          size={isFullscreen ? 18 : 14}
                          className="text-white/30 group-hover/v:text-white transition-colors"
                        />
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={sysVolume}
                          onChange={handleSysVolume}
                          style={{ background: getRangeBackground(sysVolume) }}
                          className={`${isFullscreen ? "w-24" : "w-16"} h-1 accent-white`}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <button
                      onClick={togglePlay}
                      className={`${isFullscreen ? "w-14 h-14" : "w-10 h-10"} bg-(--accent-color) text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all`}
                    >
                      {isPlaying ? (
                        <Pause
                          size={isFullscreen ? 24 : 18}
                          fill="currentColor"
                        />
                      ) : (
                        <Play
                          size={isFullscreen ? 24 : 18}
                          fill="currentColor"
                          className="ml-0.5"
                        />
                      )}
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={takeSnapshot}
                      className={`${isFullscreen ? "p-2.5" : "p-1.5"} bg-white/5 hover:bg-white/10 rounded-xl text-white/40 hover:text-white transition-all group`}
                      title="Take Snapshot"
                    >
                      <Camera
                        size={isFullscreen ? 18 : 14}
                        className="group-active:scale-90 transition-transform"
                      />
                    </button>
                    {isFullscreen && (
                      <div className="flex gap-2 ml-2">
                        <button
                          onClick={() => (videoRef.current.currentTime -= 10)}
                          className="w-10 h-8 bg-white/5 hover:bg-white/10 rounded-lg text-[9px] font-black flex items-center justify-center"
                        >
                          -10s
                        </button>
                        <button
                          onClick={() => (videoRef.current.currentTime += 10)}
                          className="w-10 h-8 bg-white/5 hover:bg-white/10 rounded-lg text-[9px] font-black flex items-center justify-center"
                        >
                          +10s
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Small Mode UI (Only visible when not in FS) */}
        {!isFullscreen && (
          <>
            {/* Info & Stats */}
            <div className="flex justify-between items-end px-1">
              <div className="flex flex-col gap-1 w-2/3">
                <h3 className="text-[13px] font-bold truncate leading-tight">
                  {currentVideo.title}
                </h3>
                <div className="flex gap-2 opacity-50 font-mono text-[9px] font-bold">
                  <span>{currentVideo.resolution}</span>
                  <span>{currentVideo.fps} FPS</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-[12px] font-black tracking-tight tabular-nums">
                  {formatTime(videoRef.current?.currentTime || 0)}
                </span>
                <span className="text-[8px] opacity-40 font-bold uppercase tracking-widest">
                  {formatTime(duration)}
                </span>
              </div>
            </div>

            {/* Simple Progress Slider */}
            <div
              className="relative h-1 w-full bg-(--range-track) rounded-full overflow-hidden cursor-pointer group"
              onClick={handleProgressClick}
            >
              <motion.div
                className="absolute top-0 left-0 h-full bg-(--accent-color) shadow-(--shadow-glass)"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Primary Controls */}
            <div className="flex flex-col gap-4 px-1">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <button
                    onClick={toggleLoop}
                    className={`transition-colors w-5 h-5 flex items-center justify-center rounded-full ${
                      isLooping
                        ? "bg-(--accent-color) text-(--accent-color)"
                        : "text-(--text-secondary) hover:text-(--text-primary)"
                    }`}
                  >
                    <Repeat size={16} />
                  </button>
                  <div className="flex items-center gap-2 group/volume">
                    <Volume2 size={16} className="text-white/40" />
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.01"
                      value={volume}
                      onChange={(e) => setVolume(parseFloat(e.target.value))}
                      style={{ background: getRangeBackground(volume, 0, 1) }}
                      className="w-16 h-1 accent-white"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center gap-8 py-1">
                    <motion.button
                      onClick={togglePlay}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="w-5 h-5 bg-(--accent-color) text-white flex items-center justify-center rounded-2xl shadow-(--shadow-glass) transition-all"
                    >
                      {isPlaying ? (
                        <Pause size={14} fill="currentColor" />
                      ) : (
                        <Play size={14} fill="currentColor" />
                      )}
                    </motion.button>
                  </div>
                  <button
                    onClick={toggleFullscreen}
                    className="text-(--text-secondary) hover:text-(--text-primary) transition-colors"
                  >
                    <Maximize size={16} />
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
});
