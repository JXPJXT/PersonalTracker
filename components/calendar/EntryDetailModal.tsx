"use client";

import { useState } from "react";
import { updateTimeEntry, deleteTimeEntry } from "@/lib/actions";
import { X, Trash2, Clock, StickyNote } from "lucide-react";
import { format, getHours, getMinutes, setHours, setMinutes } from "date-fns";

interface Subject {
  id: string;
  name: string;
  color: string;
}

interface EntryDetailModalProps {
  entry: {
    id: number;
    description: string;
    notes?: string;
    start: string;
    stop: string | null;
    subjectId: string | null;
    subject: Subject | null;
  };
  subjects: Subject[];
  onClose: () => void;
  onUpdated: () => void;
}

export default function EntryDetailModal({
  entry,
  subjects,
  onClose,
  onUpdated,
}: EntryDetailModalProps) {
  const startDate = new Date(entry.start);
  const stopDate = entry.stop ? new Date(entry.stop) : null;

  const [description, setDescription] = useState(entry.description);
  const [notes, setNotes] = useState(entry.notes || "");
  const [subjectId, setSubjectId] = useState<string | null>(entry.subjectId);
  const [startHour, setStartHour] = useState(getHours(startDate));
  const [startMin, setStartMin] = useState(getMinutes(startDate));
  const [endHour, setEndHour] = useState(stopDate ? getHours(stopDate) : 0);
  const [endMin, setEndMin] = useState(stopDate ? getMinutes(stopDate) : 0);
  const [saving, setSaving] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const newStart = setMinutes(setHours(startDate, startHour), startMin);
    const newStop = stopDate
      ? setMinutes(setHours(stopDate, endHour), endMin)
      : null;

    await updateTimeEntry(entry.id, {
      description,
      notes,
      start: newStart.toISOString(),
      stop: newStop?.toISOString(),
      subjectId,
    });
    setSaving(false);
    onUpdated();
  };

  const handleDelete = async () => {
    await deleteTimeEntry(entry.id);
    onUpdated();
  };

  const durationMinutes = stopDate
    ? Math.round((stopDate.getTime() - startDate.getTime()) / 60000)
    : null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-card max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Clock size={18} />
            Session Details
          </h2>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowDelete(true)}
              className="p-1.5 hover:bg-red-500/20 rounded transition-colors"
            >
              <Trash2 size={16} className="text-red-400" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-[#333] rounded transition-colors"
            >
              <X size={18} className="text-gray-400" />
            </button>
          </div>
        </div>

        {/* Delete confirmation */}
        {showDelete && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-sm text-red-300 mb-2">
              Delete this session permanently?
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDelete(false)}
                className="btn-ghost text-xs py-1.5"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-3 py-1.5 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {/* Description */}
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">
              Description
            </label>
            <input
              type="text"
              className="input-field"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Session description"
            />
          </div>

          {/* Subject */}
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">
              Subject
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setSubjectId(null)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all border ${
                  subjectId === null
                    ? "border-white/30 bg-white/10"
                    : "border-[#333] bg-[#2a2a2a] hover:border-[#444]"
                }`}
              >
                <span className="text-gray-400">None</span>
              </button>
              {subjects.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSubjectId(s.id)}
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

          {/* Time */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-xs text-gray-400 mb-1.5 block">
                Start · {format(startDate, "EEE, MMM d")}
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
                  value={startMin}
                  onChange={(e) => setStartMin(Number(e.target.value))}
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
            {stopDate && (
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
                    value={endMin}
                    onChange={(e) => setEndMin(Number(e.target.value))}
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
            )}
          </div>

          {durationMinutes !== null && (
            <div className="text-xs text-gray-500">
              Duration: {Math.floor(durationMinutes / 60)}h {durationMinutes % 60}m
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="text-xs text-gray-400 mb-1.5 flex items-center gap-1.5">
              <StickyNote size={12} />
              Notes
            </label>
            <textarea
              className="input-field min-h-[100px] resize-y"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Session notes, key takeaways, things to review..."
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
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
