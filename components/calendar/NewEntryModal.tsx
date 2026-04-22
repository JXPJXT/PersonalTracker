"use client";

import { useState } from "react";
import { createTimeEntry } from "@/lib/actions";
import { X } from "lucide-react";
import { format, setHours, setMinutes } from "date-fns";

interface Subject {
  id: string;
  name: string;
  color: string;
}

interface NewEntryModalProps {
  date: Date;
  startHour: number;
  startMinute: number;
  userId: string;
  subjects: Subject[];
  onClose: () => void;
  onCreated: () => void;
}

export default function NewEntryModal({
  date,
  startHour: initialStartHour,
  startMinute: initialStartMinute,
  userId,
  subjects,
  onClose,
  onCreated,
}: NewEntryModalProps) {
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [subjectId, setSubjectId] = useState<string | null>(null);
  const [startHour, setStartHour] = useState(initialStartHour);
  const [startMinute, setStartMinute] = useState(initialStartMinute);
  const [endHour, setEndHour] = useState(Math.min(initialStartHour + 1, 23));
  const [endMinute, setEndMinute] = useState(initialStartMinute);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const startDate = setMinutes(setHours(date, startHour), startMinute);
    const endDate = setMinutes(setHours(date, endHour), endMinute);

    await createTimeEntry({
      description,
      start: startDate.toISOString(),
      stop: endDate.toISOString(),
      subjectId,
      userId,
      notes,
    });
    setSaving(false);
    onCreated();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white">New Study Session</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#333] rounded transition-colors"
          >
            <X size={18} className="text-gray-400" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Description</label>
            <input
              type="text"
              className="input-field"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What did you study?"
              autoFocus
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Subject</label>
            <div className="grid grid-cols-2 gap-2">
              {subjects.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSubjectId(s.id === subjectId ? null : s.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all border ${
                    subjectId === s.id
                      ? "border-white/30 bg-white/10"
                      : "border-[#333] bg-[#2a2a2a] hover:border-[#444]"
                  }`}
                >
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: s.color }}
                  />
                  <span className="text-gray-300">{s.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-xs text-gray-400 mb-1.5 block">
                Start · {format(date, "EEE, MMM d")}
              </label>
              <div className="flex gap-2">
                <select
                  value={startHour}
                  onChange={(e) => setStartHour(Number(e.target.value))}
                  className="input-field text-center"
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>
                      {String(i).padStart(2, "0")}
                    </option>
                  ))}
                </select>
                <span className="text-gray-500 self-center">:</span>
                <select
                  value={startMinute}
                  onChange={(e) => setStartMinute(Number(e.target.value))}
                  className="input-field text-center"
                >
                  {Array.from({ length: 12 }, (_, i) => i * 5).map((m) => (
                    <option key={m} value={m}>
                      {String(m).padStart(2, "0")}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex-1">
              <label className="text-xs text-gray-400 mb-1.5 block">End</label>
              <div className="flex gap-2">
                <select
                  value={endHour}
                  onChange={(e) => setEndHour(Number(e.target.value))}
                  className="input-field text-center"
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>
                      {String(i).padStart(2, "0")}
                    </option>
                  ))}
                </select>
                <span className="text-gray-500 self-center">:</span>
                <select
                  value={endMinute}
                  onChange={(e) => setEndMinute(Number(e.target.value))}
                  className="input-field text-center"
                >
                  {Array.from({ length: 12 }, (_, i) => i * 5).map((m) => (
                    <option key={m} value={m}>
                      {String(m).padStart(2, "0")}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Notes</label>
            <textarea
              className="input-field min-h-[80px] resize-y"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Session notes, key takeaways..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="btn-ghost flex-1">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary flex-1"
            >
              {saving ? "Saving…" : "Save Session"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
