"use client";

import { useState, useTransition, useEffect } from "react";
import { upsertDailyLog, getDailyLogs } from "@/lib/actions";
import dynamic from "next/dynamic";
import {
  Book,
  CalendarDays,
  Smile,
  Zap,
  Star,
  ArrowUpCircle,
  Heart,
  ChevronLeft,
  ChevronRight,
  Save,
  CheckCircle2,
} from "lucide-react";

const BlockEditor = dynamic(() => import("@/components/editor/BlockEditor"), {
  ssr: false,
  loading: () => <div className="p-8 text-gray-500 animate-pulse">Loading editor...</div>,
});

interface LogData {
  id: string;
  date: string;
  content: string;
  mood: number;
  productivity: number;
  highlights: string;
  improvements: string;
  gratitude: string;
}

export default function JournalClient({
  userId,
  logs: initialLogs,
}: {
  userId: string;
  logs: LogData[];
}) {
  const [logs, setLogs] = useState(initialLogs);
  const [isPending, startTransition] = useTransition();

  // Selected date state
  const todayStr = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState(todayStr);

  const currentLog = logs.find((l) => l.date === selectedDate) || {
    id: "",
    date: selectedDate,
    content: "",
    mood: 3,
    productivity: 3,
    highlights: "",
    improvements: "",
    gratitude: "",
  };

  // Form state tracking current selection
  const [content, setContent] = useState(currentLog.content);
  const [mood, setMood] = useState(currentLog.mood);
  const [productivity, setProductivity] = useState(currentLog.productivity);
  const [highlights, setHighlights] = useState(currentLog.highlights);
  const [improvements, setImprovements] = useState(currentLog.improvements);
  const [gratitude, setGratitude] = useState(currentLog.gratitude);
  const [saved, setSaved] = useState(false);

  // Update form when date changes
  useEffect(() => {
    const log = logs.find((l) => l.date === selectedDate);
    setContent(log?.content || "");
    setMood(log?.mood || 3);
    setProductivity(log?.productivity || 3);
    setHighlights(log?.highlights || "");
    setImprovements(log?.improvements || "");
    setGratitude(log?.gratitude || "");
    setSaved(false);
  }, [selectedDate, logs]);

  const handleSave = () => {
    startTransition(async () => {
      await upsertDailyLog({
        userId,
        date: selectedDate,
        content,
        mood,
        productivity,
        highlights,
        improvements,
        gratitude,
      });
      const freshLogs = await getDailyLogs(userId);
      setLogs(
        freshLogs.map((l: any) => ({
          ...l,
        }))
      );
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  };

  const changeDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().slice(0, 10));
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const emojiRating = (val: number, type: "mood" | "prod") => {
    if (type === "mood") {
      return ["", "😭", "😕", "😐", "🙂", "🤩"][val] || "😐";
    }
    return ["", "🐌", "🐢", "🚶", "🏃", "🚀"][val] || "🚶";
  };

  const isToday = selectedDate === todayStr;

  return (
    <div className="p-8 max-w-4xl mx-auto overflow-y-auto h-full flex flex-col">
      {/* Header & Date Navigation */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Book size={24} />
            Daily Journal
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Reflect on your day, track your mood, and document your journey
          </p>
        </div>

        <div className="flex items-center bg-[#222] rounded-xl border border-[#333] p-1">
          <button
            onClick={() => changeDate(-1)}
            className="p-2 hover:bg-[#333] rounded-lg text-gray-400 hover:text-white transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="px-4 flex items-center gap-2 text-sm font-medium">
            <CalendarDays size={14} className="text-[#7c3aed]" />
            {isToday ? "Today" : formatDate(selectedDate)}
          </div>
          <button
            onClick={() => changeDate(1)}
            disabled={isToday}
            className={`p-2 rounded-lg transition-colors ${
              isToday
                ? "text-gray-600 cursor-not-allowed"
                : "hover:bg-[#333] text-gray-400 hover:text-white"
            }`}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6 flex-1">
        {/* Left Column: Quick Ratings & Prompts */}
        <div className="col-span-1 space-y-6">
          {/* Ratings */}
          <div className="bg-[#222] rounded-xl border border-[#2a2a2a] p-5 space-y-6">
            <div>
              <label className="text-sm font-medium text-white flex items-center gap-2 mb-3">
                <Smile size={16} className="text-amber-400" /> Mood
              </label>
              <div className="flex justify-between">
                {[1, 2, 3, 4, 5].map((val) => (
                  <button
                    key={val}
                    onClick={() => setMood(val)}
                    className={`text-2xl transition-transform hover:scale-110 ${
                      mood === val ? "scale-125 saturate-100" : "grayscale opacity-50"
                    }`}
                  >
                    {emojiRating(val, "mood")}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-white flex items-center gap-2 mb-3">
                <Zap size={16} className="text-blue-400" /> Productivity
              </label>
              <div className="flex justify-between">
                {[1, 2, 3, 4, 5].map((val) => (
                  <button
                    key={val}
                    onClick={() => setProductivity(val)}
                    className={`text-2xl transition-transform hover:scale-110 ${
                      productivity === val ? "scale-125 saturate-100" : "grayscale opacity-50"
                    }`}
                  >
                    {emojiRating(val, "prod")}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Structured Prompts */}
          <div className="bg-[#222] rounded-xl border border-[#2a2a2a] p-5 space-y-4">
            <div>
              <label className="text-sm font-medium text-white flex items-center gap-2 mb-2">
                <Star size={14} className="text-emerald-400" /> Highlights / Wins
              </label>
              <textarea
                value={highlights}
                onChange={(e) => setHighlights(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg p-3 text-sm text-white resize-none outline-none focus:border-[#7c3aed] transition-colors min-h-[80px]"
                placeholder="What went well today?"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-white flex items-center gap-2 mb-2">
                <ArrowUpCircle size={14} className="text-orange-400" /> Could be better
              </label>
              <textarea
                value={improvements}
                onChange={(e) => setImprovements(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg p-3 text-sm text-white resize-none outline-none focus:border-[#7c3aed] transition-colors min-h-[80px]"
                placeholder="What needs improvement?"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-white flex items-center gap-2 mb-2">
                <Heart size={14} className="text-rose-400" /> Grateful for
              </label>
              <textarea
                value={gratitude}
                onChange={(e) => setGratitude(e.target.value)}
                className="w-full bg-[#1a1a1a] border border-[#333] rounded-lg p-3 text-sm text-white resize-none outline-none focus:border-[#7c3aed] transition-colors min-h-[80px]"
                placeholder="One thing you're thankful for..."
              />
            </div>
          </div>
        </div>

        {/* Right Column: Freeform Journal */}
        <div className="col-span-2 flex flex-col">
          <div className="flex-1 bg-[#222] rounded-xl border border-[#2a2a2a] overflow-hidden flex flex-col relative">
            <div className="p-4 border-b border-[#333] bg-[#1a1a1a] flex justify-between items-center">
              <span className="text-sm font-medium text-white">Daily Notes</span>
              {saved && (
                <span className="text-xs text-emerald-400 flex items-center gap-1 animate-fade-in-out">
                  <CheckCircle2 size={12} /> Saved
                </span>
              )}
            </div>
            <div className="flex-1 w-full bg-transparent overflow-y-auto px-2 py-4">
              <BlockEditor initialContent={content} onChange={setContent} />
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={handleSave}
              disabled={isPending}
              className="btn-primary flex items-center gap-2 px-6"
            >
              <Save size={16} />
              {isPending ? "Saving..." : "Save Entry"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
