"use client";

import { useState, useEffect, useCallback } from "react";
import { useTimerStore } from "@/lib/store";
import { stopTimerEntry } from "@/lib/actions";
import { formatDuration } from "@/lib/utils";
import { Minimize2, Square, Volume2, VolumeX, Moon, CloudRain, Coffee, Music } from "lucide-react";
import { useRouter } from "next/navigation";

interface FocusModeOverlayProps {
  subjectName?: string;
  subjectColor?: string;
}

export default function FocusModeOverlay({
  subjectName,
  subjectColor,
}: FocusModeOverlayProps) {
  const store = useTimerStore();
  const router = useRouter();
  const [elapsed, setElapsed] = useState(0);
  const [stopping, setStopping] = useState(false);
  const [quote] = useState(() => {
    const quotes = [
      "Deep work is the ability to focus without distraction.",
      "The successful warrior is the average man, with laser-like focus.",
      "Concentrate all your thoughts upon the work at hand.",
      "Focus is a matter of deciding what things you're not going to do.",
      "Where focus goes, energy flows.",
      "The key to success is to focus on goals, not obstacles.",
      "Stay focused, go after your dreams and keep moving toward your goals.",
    ];
    return quotes[Math.floor(Math.random() * quotes.length)];
  });
  const [breathPhase, setBreathPhase] = useState<"inhale" | "exhale">("inhale");
  const [ambientSound, setAmbientSound] = useState<"none" | "rain" | "cafe" | "lofi">("none");

  // Audio files (placeholder external links for demo purposes)
  const audioUrls = {
    rain: "https://cdn.pixabay.com/download/audio/2021/08/09/audio_40b2fc3f47.mp3?filename=rain-and-thunder-16705.mp3",
    cafe: "https://cdn.pixabay.com/download/audio/2022/10/26/audio_fbc9823908.mp3?filename=cafe-background-noise-122709.mp3",
    lofi: "https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf7ee.mp3?filename=lofi-study-112191.mp3",
  };

  useEffect(() => {
    if (ambientSound === "none") return;
    const audio = new Audio(audioUrls[ambientSound]);
    audio.loop = true;
    audio.volume = 0.4;
    audio.play().catch(e => console.error("Audio playback failed", e));
    
    return () => {
      audio.pause();
      audio.src = "";
    };
  }, [ambientSound]);

  useEffect(() => {
    if (!store.isRunning || !store.startedAt) return;
    setElapsed(Math.floor((Date.now() - store.startedAt) / 1000));
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - store.startedAt!) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [store.isRunning, store.startedAt]);

  // Breathing animation cycle (4s inhale, 4s exhale)
  useEffect(() => {
    const interval = setInterval(() => {
      setBreathPhase((p) => (p === "inhale" ? "exhale" : "inhale"));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Keyboard shortcut to exit focus mode
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        store.disableFocusMode();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [store]);

  const handleStop = useCallback(async () => {
    if (stopping) return;
    setStopping(true);
    try {
      if (store.tempEntryId) {
        await stopTimerEntry(store.tempEntryId);
      }
      store.stop();
      setElapsed(0);
      router.refresh();
    } catch (err) {
      console.error("Failed to stop timer:", err);
    } finally {
      setStopping(false);
    }
  }, [store, router, stopping]);

  if (!store.focusModeActive || !store.isRunning) return null;

  const hours = Math.floor(elapsed / 3600);
  const minutes = Math.floor((elapsed % 3600) / 60);
  const seconds = elapsed % 60;

  return (
    <div className="fixed inset-0 z-[100] bg-[#09090b] flex flex-col items-center justify-center select-none overflow-hidden font-sans">
      {/* Ambient background glow */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none transition-all duration-[4000ms]"
        style={{
          background: `radial-gradient(circle at center, ${subjectColor || "#7c3aed"}22 0%, transparent 60%)`,
        }}
      />

      {/* Breathing circle overlay - ultra subtle */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className="rounded-full transition-all duration-[4000ms] ease-in-out opacity-[0.03] blur-3xl"
          style={{
            backgroundColor: subjectColor || "#7c3aed",
            width: breathPhase === "inhale" ? "600px" : "300px",
            height: breathPhase === "inhale" ? "600px" : "300px",
          }}
        />
      </div>

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-8 py-6 z-20">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 backdrop-blur-md">
            <Moon size={16} className="text-indigo-400" />
            <span className="text-xs font-semibold text-gray-300 tracking-widest uppercase">Deep Work</span>
          </div>
          {subjectName && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5 backdrop-blur-md">
              <span
                className="w-2 h-2 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.5)]"
                style={{ backgroundColor: subjectColor || "#7c3aed", boxShadow: `0 0 10px ${subjectColor || "#7c3aed"}` }}
              />
              <span className="text-xs text-gray-300 font-medium tracking-wide">{subjectName}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-6">
          {/* Ambient Sound Controls Inline */}
          <div className="flex items-center gap-3 bg-white/5 border border-white/5 backdrop-blur-md px-1.5 py-1.5 rounded-xl">
             <div className="text-[10px] text-gray-400 font-semibold tracking-wider uppercase px-2">Focus Audio</div>
             <div className="h-4 w-px bg-white/10" />
             <div className="flex gap-1">
               <button
                 onClick={() => setAmbientSound("none")}
                 className={`p-1.5 rounded-lg transition-all ${ambientSound === "none" ? "bg-white/10 text-white shadow-sm" : "text-gray-500 hover:text-gray-300 hover:bg-white/5"}`}
                 title="Mute"
               >
                 <VolumeX size={14} />
               </button>
               <button
                 onClick={() => setAmbientSound("rain")}
                 className={`p-1.5 rounded-lg transition-all ${ambientSound === "rain" ? "bg-white/10 text-white shadow-sm" : "text-gray-500 hover:text-gray-300 hover:bg-white/5"}`}
                 title="Rain"
               >
                 <CloudRain size={14} />
               </button>
               <button
                 onClick={() => setAmbientSound("cafe")}
                 className={`p-1.5 rounded-lg transition-all ${ambientSound === "cafe" ? "bg-white/10 text-white shadow-sm" : "text-gray-500 hover:text-gray-300 hover:bg-white/5"}`}
                 title="Café"
               >
                 <Coffee size={14} />
               </button>
               <button
                 onClick={() => setAmbientSound("lofi")}
                 className={`p-1.5 rounded-lg transition-all ${ambientSound === "lofi" ? "bg-white/10 text-white shadow-sm" : "text-gray-500 hover:text-gray-300 hover:bg-white/5"}`}
                 title="Lo-Fi Beats"
               >
                 <Music size={14} />
               </button>
             </div>
          </div>
        
          <button
            onClick={() => store.disableFocusMode()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 text-gray-200 hover:text-white transition-all text-sm font-medium backdrop-blur-md"
          >
            <Minimize2 size={14} />
            <span>Exit Focus</span>
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center gap-6 mt-12">
        <p className="text-xl text-gray-300 font-light tracking-wide bg-white/5 px-6 py-2 rounded-full border border-white/5 backdrop-blur-sm">
          {store.description || "Study session"}
        </p>

        {/* Big timer display */}
        <div className="flex items-baseline gap-2 my-8 drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]">
          {hours > 0 && (
            <>
              <span className="text-[140px] font-extralight text-white tabular-nums tracking-tighter leading-none">
                {String(hours).padStart(2, "0")}
              </span>
              <span className="text-7xl font-extralight text-gray-700 leading-none pb-4">:</span>
            </>
          )}
          <span className="text-[140px] font-extralight text-white tabular-nums tracking-tighter leading-none">
            {String(minutes).padStart(2, "0")}
          </span>
          <span className="text-7xl font-extralight text-gray-700 leading-none pb-4">:</span>
          <span className="text-[140px] font-extralight text-white tabular-nums tracking-tighter leading-none">
            {String(seconds).padStart(2, "0")}
          </span>
        </div>

        {/* Stop button */}
        <div className="flex flex-col items-center gap-4 mt-8">
          <button
            onClick={handleStop}
            disabled={stopping}
            className="w-20 h-20 rounded-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 hover:border-red-500/50 flex items-center justify-center transition-all duration-300 group shadow-[0_0_20px_rgba(220,38,38,0.1)] hover:shadow-[0_0_30px_rgba(220,38,38,0.2)]"
          >
            <Square
              size={20}
              className="text-red-400 fill-red-400 group-hover:scale-110 transition-transform"
            />
          </button>
          <span className="text-xs font-semibold tracking-wider uppercase text-gray-600">Finish Session</span>
        </div>
      </div>

      {/* Bottom Information */}
      <div className="absolute bottom-8 left-8 right-8 flex justify-between items-end z-10 pointer-events-none">
        {/* Keyboard hint */}
        <div className="flex flex-col gap-2 pointer-events-auto">
          <span className="text-[10px] uppercase tracking-widest text-gray-600 font-semibold mb-1">Controls</span>
          <span className="text-xs text-gray-400 flex items-center gap-2">
            <kbd className="px-2 py-1 bg-white/10 rounded-md border border-white/10 text-gray-300 font-sans shadow-sm">Esc</kbd> 
            Exit overlay
          </span>
        </div>

        {/* Quote */}
        <div className="text-center max-w-lg mb-2">
          <p className="text-sm text-gray-400 italic font-serif leading-relaxed">
            &ldquo;{quote}&rdquo;
          </p>
        </div>

        {/* DND reminder */}
        <div className="flex items-center gap-2 text-xs font-medium text-gray-500 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 backdrop-blur-sm pointer-events-auto">
          <Volume2 size={14} className={ambientSound !== "none" ? "text-indigo-400" : ""} />
          <span>Notifications muted</span>
        </div>
      </div>
    </div>
  );
}
