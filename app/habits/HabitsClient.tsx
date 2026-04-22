"use client";

import { useState, useTransition } from "react";
import {
  upsertSleepLog,
  deleteSleepLog,
  getSleepLogs,
  createHabit,
  updateHabit,
  logHabitEntry,
} from "@/lib/actions";
import {
  Moon,
  Sun,
  Plus,
  Trash2,
  Star,
  Clock,
  TrendingUp,
  Pencil,
  Check,
  Target,
} from "lucide-react";
import ConfirmModal from "@/components/ui/ConfirmModal";

interface SleepLogData {
  id: string;
  date: string;
  wakeTime: string;
  sleepTime: string;
  quality: number;
  notes: string;
}

interface HabitEntryData {
  date: string;
  value: number;
}

interface HabitData {
  id: string;
  name: string;
  icon: string;
  color: string;
  target: number;
  unit: string;
  entries: HabitEntryData[];
}

export default function HabitsClient({
  userId,
  sleepLogs: initialSleepLogs,
  habits: initialHabits,
}: {
  userId: string;
  sleepLogs: SleepLogData[];
  habits: HabitData[];
}) {
  const [activeTab, setActiveTab] = useState<"habits" | "sleep">("habits");

  return (
    <div className="p-8 max-w-4xl mx-auto overflow-y-auto h-full">
      {/* Header & Tabs */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Target size={24} />
            Daily Habits
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Build routines and track your progress over time
          </p>
        </div>
        <div className="flex bg-[#222] rounded-lg border border-[#2a2a2a] overflow-hidden p-1">
          <button
            onClick={() => setActiveTab("habits")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
              activeTab === "habits"
                ? "bg-[#7c3aed] text-white shadow-sm"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Habit Tracker
          </button>
          <button
            onClick={() => setActiveTab("sleep")}
            className={`px-4 py-2 text-sm font-medium rounded-md flex items-center gap-2 transition-all ${
              activeTab === "sleep"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-gray-400 hover:text-white"
            }`}
          >
            <Moon size={14} /> Sleep Log
          </button>
        </div>
      </div>

      {activeTab === "habits" ? (
        <HabitsGrid userId={userId} habits={initialHabits} />
      ) : (
        <SleepTracker userId={userId} initialLogs={initialSleepLogs} />
      )}
    </div>
  );
}

// ─── Generic Habits Tracker ─────────────────────────────────────

function HabitsGrid({ userId, habits: initialHabits }: { userId: string, habits: HabitData[] }) {
  const [isPending, startTransition] = useTransition();
  const [habits, setHabits] = useState(initialHabits);
  const [showForm, setShowForm] = useState(false);

  // New habit form
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("💧");
  const [target, setTarget] = useState(1);
  const [unit, setUnit] = useState("");
  const [color, setColor] = useState("#3b82f6");

  // Dates (Last 7 days)
  const today = new Date();
  const dates = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });

  const handleCreate = () => {
    if (!name.trim()) return;
    startTransition(async () => {
      await createHabit({
        userId,
        name: name.trim(),
        icon,
        target,
        unit: unit.trim(),
        color,
      });
      setShowForm(false);
      setName("");
      setIcon("💧");
      // Need a proper refresh here in a real scenario, but page reload will do for now
      window.location.reload();
    });
  };

  const handleToggle = (habitId: string, date: string, currentValue: number, targetValue: number) => {
    // If it's a binary habit (target=1), just flip 0/1
    // If it's a numeric habit (target>1), clicking increments until target, then resets to 0
    let nextValue = 1;
    if (targetValue === 1) {
      nextValue = currentValue >= 1 ? 0 : 1;
    } else {
      nextValue = currentValue >= targetValue ? 0 : currentValue + 1;
    }

    // Optimistic UI update
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id !== habitId) return h;
        const entryIdx = h.entries.findIndex((e) => e.date === date);
        const newEntries = [...h.entries];
        if (entryIdx >= 0) {
          newEntries[entryIdx] = { date, value: nextValue };
        } else {
          newEntries.push({ date, value: nextValue });
        }
        return { ...h, entries: newEntries };
      })
    );

    startTransition(async () => {
      await logHabitEntry(habitId, date, nextValue);
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#333]">
              <th className="p-4 font-medium text-sm text-gray-400 w-1/3">Habit</th>
              {dates.map((d, i) => {
                const dateObj = new Date(d + "T00:00:00");
                const isToday = i === 6;
                return (
                  <th key={d} className="p-2 text-center w-[8%]">
                    <div className={`text-xs ${isToday ? "text-[#7c3aed] font-bold" : "text-gray-500"}`}>
                      {dateObj.toLocaleDateString("en-US", { weekday: "narrow" })}
                    </div>
                    <div className={`text-[10px] ${isToday ? "text-[#7c3aed]" : "text-gray-600"}`}>
                      {dateObj.getDate()}
                    </div>
                  </th>
                );
              })}
              <th className="p-4 font-medium text-sm text-gray-400 text-center">Progress</th>
            </tr>
          </thead>
          <tbody>
            {habits.map((habit) => {
              // Calculate weekly completion %
              let completedDays = 0;
              dates.forEach(d => {
                const entry = habit.entries.find((e) => e.date === d);
                if (entry && entry.value >= habit.target) completedDays++;
              });
              const pct = (completedDays / 7) * 100;

              return (
                <tr key={habit.id} className="border-b border-[#222] hover:bg-[#222]/50 transition-colors">
                  <td className="p-4 flex items-center gap-3">
                    <span className="text-xl shrink-0 w-8 text-center">{habit.icon}</span>
                    <div>
                      <p className="text-sm font-medium text-white">{habit.name}</p>
                      <p className="text-xs text-gray-500">
                        Goal: {habit.target} {habit.unit}
                      </p>
                    </div>
                  </td>
                  {dates.map((d) => {
                    const entry = habit.entries.find((e) => e.date === d);
                    const val = entry?.value || 0;
                    const isCompleted = val >= habit.target;
                    const isPartial = val > 0 && !isCompleted;

                    return (
                      <td key={d} className="p-2 text-center">
                        <button
                          onClick={() => handleToggle(habit.id, d, val, habit.target)}
                          className="w-10 h-10 rounded-lg mx-auto flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                          style={{
                            backgroundColor: isCompleted
                              ? habit.color
                              : isPartial
                              ? habit.color + "33"
                              : "#222",
                            border: `1px solid ${
                              isCompleted || isPartial ? habit.color : "#333"
                            }`,
                          }}
                        >
                          {isCompleted ? (
                            <Check size={16} className="text-white" />
                          ) : habit.target > 1 && val > 0 ? (
                            <span className="text-[10px] font-bold text-white relative z-10">{val} / {habit.target}</span>
                          ) : null}
                        </button>
                      </td>
                    );
                  })}
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-2">
                       <div className="w-16 h-1.5 bg-[#222] rounded-full overflow-hidden">
                         <div 
                           className="h-full rounded-full transition-all duration-500"
                           style={{ width: `${pct}%`, backgroundColor: habit.color }}
                         />
                       </div>
                       <span className="text-xs text-gray-400 w-8 text-right">{Math.round(pct)}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        
        {habits.length === 0 && !showForm && (
          <div className="p-8 text-center text-gray-500">
            No habits created yet. Click below to start building routines!
          </div>
        )}
      </div>

      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <Plus size={16} /> Add a new habit
        </button>
      ) : (
        <div className="bg-[#222] p-5 rounded-xl border border-[#333] grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <h3 className="text-sm font-medium text-white mb-4">Create New Habit</h3>
          </div>
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Habit Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field"
              placeholder="e.g. Drink Water, Read 20 pages..."
            />
          </div>
          <div className="flex gap-4">
            <div className="w-20">
              <label className="text-xs text-gray-400 mb-1.5 block">Emoji</label>
              <input
                type="text"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                className="input-field text-center text-xl p-1"
                maxLength={2}
              />
            </div>
            <div className="w-20">
              <label className="text-xs text-gray-400 mb-1.5 block">Target</label>
              <input
                type="number"
                min="1"
                value={target}
                onChange={(e) => setTarget(parseInt(e.target.value) || 1)}
                className="input-field px-2"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-gray-400 mb-1.5 block">Unit (optional)</label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="input-field"
                placeholder="e.g. glasses, minutes..."
              />
            </div>
          </div>
          <div className="col-span-2">
            <label className="text-xs text-gray-400 mb-1.5 block">Color</label>
            <div className="flex gap-2">
              {["#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4", "#3b82f6", "#8b5cf6", "#d946ef"].map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full border-2 transition-transform ${color === c ? "scale-110 border-white" : "border-transparent"}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div className="col-span-2 flex gap-2 mt-2">
            <button onClick={() => setShowForm(false)} className="btn-ghost">Cancel</button>
            <button onClick={handleCreate} disabled={!name.trim() || isPending} className="btn-primary">
              {isPending ? "Saving..." : "Create Habit"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sleep Tracker Component ──────────────────────────────────────

function SleepTracker({ userId, initialLogs }: { userId: string, initialLogs: SleepLogData[] }) {
  const [logs, setLogs] = useState(initialLogs);
  const [isPending, startTransition] = useTransition();

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formDate, setFormDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [formSleep, setFormSleep] = useState("23:00");
  const [formWake, setFormWake] = useState("07:00");
  const [formQuality, setFormQuality] = useState(3);
  const [formNotes, setFormNotes] = useState("");

  const refreshData = async () => {
    const fresh = await getSleepLogs(userId, 30);
    setLogs(
      fresh.map((l) => ({
        id: l.id,
        date: l.date,
        wakeTime: l.wakeTime,
        sleepTime: l.sleepTime,
        quality: l.quality,
        notes: l.notes,
      }))
    );
  };

  const resetForm = () => {
    setFormDate(new Date().toISOString().slice(0, 10));
    setFormSleep("23:00");
    setFormWake("07:00");
    setFormQuality(3);
    setFormNotes("");
    setEditingId(null);
    setShowForm(false);
  };

  const handleSave = () => {
    startTransition(async () => {
      await upsertSleepLog({
        userId,
        date: formDate,
        sleepTime: formSleep,
        wakeTime: formWake,
        quality: formQuality,
        notes: formNotes,
      });
      await refreshData();
      resetForm();
    });
  };

  const handleEdit = (log: SleepLogData) => {
    setFormDate(log.date);
    setFormSleep(log.sleepTime);
    setFormWake(log.wakeTime);
    setFormQuality(log.quality);
    setFormNotes(log.notes);
    setEditingId(log.id);
    setShowForm(true);
  };

  const [confirmModal, setConfirmModal] = useState<{isOpen: boolean, id: string | null}>({isOpen: false, id: null});

  const handleDelete = (id: string) => {
    setConfirmModal({ isOpen: true, id });
  };

  const executeDelete = () => {
    const id = confirmModal.id;
    if (!id) return;
    startTransition(async () => {
      await deleteSleepLog(id);
      await refreshData();
    });
  };

  const calcDuration = (sleep: string, wake: string) => {
    const [sh, sm] = sleep.split(":").map(Number);
    const [wh, wm] = wake.split(":").map(Number);
    let sleepMin = sh * 60 + sm;
    let wakeMin = wh * 60 + wm;
    if (wakeMin <= sleepMin) wakeMin += 24 * 60;
    const dur = wakeMin - sleepMin;
    return dur;
  };

  const avgSleep =
    logs.length > 0
      ? logs.reduce((s, l) => s + calcDuration(l.sleepTime, l.wakeTime), 0) /
        logs.length
      : 0;
  const avgQuality =
    logs.length > 0
      ? logs.reduce((s, l) => s + l.quality, 0) / logs.length
      : 0;

  const fmtDuration = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = Math.round(mins % 60);
    return `${h}h ${m}m`;
  };

  const qualityLabel = (q: number) =>
    ["", "Terrible", "Poor", "Fair", "Good", "Excellent"][q] || "";
  const qualityColor = (q: number) =>
    ["", "#ef4444", "#f97316", "#eab308", "#22c55e", "#7c3aed"][q] || "#666";

  const formatDate = (d: string) => {
    const date = new Date(d + "T00:00:00");
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (d === today.toISOString().slice(0, 10)) return "Today";
    if (d === yesterday.toISOString().slice(0, 10)) return "Yesterday";

    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-4">
          <div className="bg-[#222] px-4 py-2 rounded-xl border border-[#2a2a2a]">
            <span className="text-xs text-gray-500 block">Avg Sleep</span>
            <span className="text-lg font-semibold text-white">{fmtDuration(avgSleep)}</span>
          </div>
          <div className="bg-[#222] px-4 py-2 rounded-xl border border-[#2a2a2a]">
            <span className="text-xs text-gray-500 block">Avg Quality</span>
            <span className="text-lg font-semibold" style={{ color: qualityColor(Math.round(avgQuality)) }}>
              {avgQuality.toFixed(1)}/5
            </span>
          </div>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary">
          <Plus size={16} /> Log Sleep
        </button>
      </div>

      {showForm && (
        <div className="mb-6 p-5 bg-[#222] rounded-xl border border-[#333]">
          <h3 className="text-sm font-medium text-white mb-4">
            {editingId ? "Edit Sleep Log" : "New Sleep Log"}
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Date (Morning of)</label>
              <input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Quality</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((q) => (
                  <button
                    key={q}
                    onClick={() => setFormQuality(q)}
                    className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-all"
                    style={{
                      background: formQuality === q ? qualityColor(q) + "22" : "transparent",
                      border: `1px solid ${formQuality === q ? qualityColor(q) : "#333"}`,
                      color: formQuality === q ? qualityColor(q) : "#888",
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block flex items-center gap-1">
                <Moon size={10} /> Bedtime
              </label>
              <input type="time" value={formSleep} onChange={(e) => setFormSleep(e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block flex items-center gap-1">
                <Sun size={10} /> Wake Time
              </label>
              <input type="time" value={formWake} onChange={(e) => setFormWake(e.target.value)} className="input-field" />
            </div>
          </div>
          <div className="mt-3">
            <label className="text-xs text-gray-400 mb-1.5 block">Notes (optional)</label>
            <input type="text" value={formNotes} onChange={(e) => setFormNotes(e.target.value)} className="input-field" placeholder="e.g. Woke up refreshed..." />
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={resetForm} className="btn-ghost">Cancel</button>
            <button onClick={handleSave} className="btn-primary" disabled={isPending}>
              {isPending ? "Saving…" : editingId ? "Update" : "Save"}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {logs.map((log) => {
          const dur = calcDuration(log.sleepTime, log.wakeTime);
          return (
            <div key={log.id} className="flex items-center gap-4 p-4 bg-[#222] rounded-xl border border-[#2a2a2a] hover:border-[#333] transition-all group/log">
              <div className="w-24 shrink-0">
                <p className="text-sm font-medium text-white">{formatDate(log.date)}</p>
                <p className="text-[10px] text-gray-600">{log.date}</p>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-xs text-gray-400 mb-1.5">
                  <Moon size={10} className="text-indigo-400" />
                  <span>{log.sleepTime}</span>
                  <span className="text-gray-600">→</span>
                  <Sun size={10} className="text-amber-400" />
                  <span>{log.wakeTime}</span>
                  <span className="text-gray-600 ml-1">({fmtDuration(dur)})</span>
                </div>
                <div className="h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min((dur / (10 * 60)) * 100, 100)}%`,
                      background: `linear-gradient(90deg, #6366f1, #7c3aed)`,
                      opacity: 0.7 + (log.quality / 5) * 0.3,
                    }}
                  />
                </div>
                {log.notes && <p className="text-[10px] text-gray-600 mt-1 truncate">{log.notes}</p>}
              </div>

              <div className="text-center shrink-0 w-12">
                <span className="text-sm font-bold" style={{ color: qualityColor(log.quality) }}>
                  {log.quality}/5
                </span>
                <p className="text-[9px]" style={{ color: qualityColor(log.quality) }}>
                  {qualityLabel(log.quality)}
                </p>
              </div>

              <div className="flex gap-1 opacity-0 group-hover/log:opacity-100 transition-all">
                <button onClick={() => handleEdit(log)} className="p-1.5 hover:bg-[#333] rounded transition-colors"><Pencil size={12} className="text-gray-400" /></button>
                <button onClick={() => handleDelete(log.id)} className="p-1.5 hover:bg-red-500/20 rounded transition-colors"><Trash2 size={12} className="text-red-400" /></button>
              </div>
            </div>
          );
        })}
      </div>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title="Delete Sleep Log"
        description="Are you sure you want to delete this sleep log? This action cannot be undone."
        onConfirm={executeDelete}
        onCancel={() => setConfirmModal({ isOpen: false, id: null })}
        danger={true}
      />
    </div>
  );
}
