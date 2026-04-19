"use client";

import { useState, useEffect, useCallback } from "react";
import { useTimerStore } from "@/lib/store";
import { createTimeEntry, stopTimerEntry } from "@/lib/actions";
import { formatDuration } from "@/lib/utils";
import { Play, Square, ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import {
  format,
  endOfWeek,
  addWeeks,
  subWeeks,
  isSameWeek,
  getWeek,
} from "date-fns";
import { useRouter } from "next/navigation";

interface Subject {
  id: string;
  name: string;
  color: string;
}

interface TopBarProps {
  userId: string;
  currentWeekStart: Date;
  onWeekChange: (date: Date) => void;
  subjects: Subject[];
}

export default function TopBar({
  userId,
  currentWeekStart,
  onWeekChange,
  subjects,
}: TopBarProps) {
  const store = useTimerStore();
  const router = useRouter();
  const [elapsed, setElapsed] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [showSubjectDropdown, setShowSubjectDropdown] = useState(false);
  const [starting, setStarting] = useState(false);
  const [stopping, setStopping] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Timer tick
  useEffect(() => {
    if (!store.isRunning || !store.startedAt) return;
    // Set initial elapsed immediately
    setElapsed(Math.floor((Date.now() - store.startedAt) / 1000));
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - store.startedAt!) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [store.isRunning, store.startedAt]);

  const handleStart = useCallback(async () => {
    if (starting) return;
    setStarting(true);
    try {
      const desc = store.description.trim() || "Study session";
      const entry = await createTimeEntry({
        description: desc,
        start: new Date().toISOString(),
        stop: null,
        subjectId: store.subjectId,
        userId,
      });
      // entry.id might come back as BigInt from SQLite adapter — coerce to number
      const entryId = Number(entry.id);
      store.start(entryId, desc, store.subjectId);
      if (!store.description.trim()) {
        store.setDescription(desc);
      }
    } catch (err) {
      console.error("Failed to start timer:", err);
    } finally {
      setStarting(false);
    }
  }, [store, userId, starting]);

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

  const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
  const isCurrentWeek = isSameWeek(new Date(), currentWeekStart, {
    weekStartsOn: 1,
  });
  const weekNumber = getWeek(currentWeekStart, { weekStartsOn: 1 });

  const selectedSubject = subjects.find((s) => s.id === store.subjectId);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;

      if (e.key === "t" || e.key === "T") {
        e.preventDefault();
        document.getElementById("timer-description-input")?.focus();
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        onWeekChange(subWeeks(currentWeekStart, 1));
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        onWeekChange(addWeeks(currentWeekStart, 1));
      }
      if (e.key === "s" || e.key === "S") {
        e.preventDefault();
        router.push("/subjects");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [currentWeekStart, onWeekChange, router]);

  if (!mounted) {
    return (
      <div className="h-[52px] bg-[#1a1a1a] border-b border-[#2a2a2a]" />
    );
  }

  return (
    <header className="h-[52px] bg-[#1a1a1a] border-b border-[#2a2a2a] flex items-center px-4 gap-4">
      {/* Description Input */}
      <div className="flex items-center flex-1 gap-2">
        <input
          id="timer-description-input"
          type="text"
          placeholder="What are you working on?"
          value={store.description}
          onChange={(e) => store.setDescription(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              if (store.isRunning) {
                handleStop();
              } else {
                handleStart();
              }
            }
          }}
          className="flex-1 bg-transparent border-none outline-none text-sm text-white placeholder:text-[#666] max-w-[320px]"
          disabled={store.isRunning}
        />
        {/* Subject selector */}
        <div className="relative">
          <button
            onClick={() => setShowSubjectDropdown(!showSubjectDropdown)}
            className="flex items-center gap-2 px-3 py-1.5 text-xs rounded-md bg-[#2a2a2a] hover:bg-[#333] transition-colors"
            disabled={store.isRunning}
          >
            {selectedSubject ? (
              <>
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: selectedSubject.color }}
                />
                <span className="text-gray-300">{selectedSubject.name}</span>
              </>
            ) : (
              <span className="text-gray-500">+ Subject</span>
            )}
          </button>
          {showSubjectDropdown && !store.isRunning && (
            <div className="absolute top-full left-0 mt-1 bg-[#222] border border-[#333] rounded-lg shadow-xl py-1 min-w-[180px] z-50">
              <button
                onClick={() => {
                  store.setSubjectId(null);
                  setShowSubjectDropdown(false);
                }}
                className="w-full text-left px-3 py-2 text-xs text-gray-400 hover:bg-[#2a2a2a] hover:text-white transition-colors"
              >
                No subject
              </button>
              {subjects.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    store.setSubjectId(s.id);
                    setShowSubjectDropdown(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-[#2a2a2a] hover:text-white transition-colors flex items-center gap-2"
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: s.color }}
                  />
                  {s.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Week Navigation */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onWeekChange(subWeeks(currentWeekStart, 1))}
          className="p-1.5 hover:bg-[#2a2a2a] rounded transition-colors"
        >
          <ChevronLeft size={16} className="text-gray-400" />
        </button>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#2a2a2a] rounded-lg text-xs text-gray-300 min-w-[180px] justify-center">
          <Calendar size={13} />
          <span>
            {isCurrentWeek
              ? `This week · W${weekNumber}`
              : `${format(currentWeekStart, "MMM d")} – ${format(weekEnd, "MMM d")} · W${weekNumber}`}
          </span>
        </div>
        <button
          onClick={() => onWeekChange(addWeeks(currentWeekStart, 1))}
          className="p-1.5 hover:bg-[#2a2a2a] rounded transition-colors"
        >
          <ChevronRight size={16} className="text-gray-400" />
        </button>
      </div>

      {/* View Tabs */}
      <div className="flex items-center gap-1 bg-[#2a2a2a] rounded-lg p-0.5">
        <span className="view-tab active">Calendar</span>
        <span className="view-tab">List View</span>
      </div>

      {/* Timer Display */}
      <div className="flex items-center gap-3 ml-2">
        <span className="text-sm font-mono text-gray-300 tabular-nums min-w-[70px] text-right">
          {store.isRunning ? formatDuration(elapsed) : "0:00:00"}
        </span>
        {store.isRunning ? (
          <button
            onClick={handleStop}
            disabled={stopping}
            className="w-10 h-10 rounded-full bg-[#dc2626] hover:bg-[#b91c1c] flex items-center justify-center transition-colors disabled:opacity-50"
          >
            <Square size={14} className="text-white fill-white" />
          </button>
        ) : (
          <button
            onClick={handleStart}
            disabled={starting}
            className="w-10 h-10 rounded-full bg-[#7c3aed] hover:bg-[#6d28d9] flex items-center justify-center transition-colors disabled:opacity-50"
          >
            <Play size={16} className="text-white fill-white ml-0.5" />
          </button>
        )}
      </div>
    </header>
  );
}
