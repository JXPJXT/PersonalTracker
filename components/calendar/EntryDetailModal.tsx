"use client";

import { useState, useEffect } from "react";
import {
  updateTimeEntry,
  deleteTimeEntry,
  getTasksForSession,
  linkTaskToSession,
  unlinkTaskFromSession,
} from "@/lib/actions";
import { X, Trash2, Clock, StickyNote, Link2, Unlink } from "lucide-react";
import { format, getHours, getMinutes, setHours, setMinutes } from "date-fns";

interface Subject {
  id: string;
  name: string;
  color: string;
}

interface TaskData {
  id: string;
  title: string;
  priority: string;
  completed: boolean;
  subject: Subject | null;
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
  tasks?: TaskData[];
  onClose: () => void;
  onUpdated: () => void;
}

const PRIORITY_COLORS = {
  HIGH: "text-red-400",
  MEDIUM: "text-amber-400",
  LOW: "text-blue-400",
};

export default function EntryDetailModal({
  entry,
  subjects,
  tasks = [],
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

  // Task linking state
  const [linkedTasks, setLinkedTasks] = useState<TaskData[]>([]);
  const [showTaskPicker, setShowTaskPicker] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(true);

  // Load linked tasks
  useEffect(() => {
    const load = async () => {
      try {
        const linked = await getTasksForSession(entry.id);
        setLinkedTasks(
          linked.map((t) => ({
            id: t.id,
            title: t.title,
            priority: t.priority,
            completed: t.completed,
            subject: t.subject
              ? { id: t.subject.id, name: t.subject.name, color: t.subject.color }
              : null,
          }))
        );
      } catch {
        // ignore
      } finally {
        setLoadingTasks(false);
      }
    };
    load();
  }, [entry.id]);

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

  const handleLinkTask = async (taskId: string) => {
    await linkTaskToSession(taskId, entry.id);
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      setLinkedTasks((prev) => [...prev, task]);
    }
    setShowTaskPicker(false);
  };

  const handleUnlinkTask = async (taskId: string) => {
    await unlinkTaskFromSession(taskId, entry.id);
    setLinkedTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  const durationMinutes = stopDate
    ? Math.round((stopDate.getTime() - startDate.getTime()) / 60000)
    : null;

  const linkedTaskIds = new Set(linkedTasks.map((t) => t.id));
  const availableTasks = tasks.filter(
    (t) => !linkedTaskIds.has(t.id) && !t.completed
  );

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

          {/* Linked Tasks */}
          <div>
            <label className="text-xs text-gray-400 mb-1.5 flex items-center gap-1.5">
              <Link2 size={12} />
              Linked Tasks
            </label>

            {loadingTasks ? (
              <div className="text-xs text-gray-600 py-2">Loading tasks...</div>
            ) : (
              <>
                {/* Linked task chips */}
                {linkedTasks.length > 0 && (
                  <div className="space-y-1.5 mb-2">
                    {linkedTasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center gap-2 px-3 py-2 bg-[#1a1a1a] rounded-lg group"
                      >
                        <span
                          className={`text-[10px] font-medium ${
                            PRIORITY_COLORS[task.priority as keyof typeof PRIORITY_COLORS] || "text-gray-400"
                          }`}
                        >
                          {task.priority}
                        </span>
                        <span className="text-sm text-white flex-1 truncate">
                          {task.title}
                        </span>
                        {task.subject && (
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: task.subject.color }}
                          />
                        )}
                        <button
                          onClick={() => handleUnlinkTask(task.id)}
                          className="p-1 hover:bg-red-500/20 rounded opacity-0 group-hover:opacity-100 transition-all"
                          title="Unlink task"
                        >
                          <Unlink size={11} className="text-red-400" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add task link */}
                {showTaskPicker ? (
                  <div className="bg-[#1a1a1a] rounded-lg border border-[#333] p-2 max-h-[160px] overflow-y-auto">
                    {availableTasks.length > 0 ? (
                      availableTasks.map((task) => (
                        <button
                          key={task.id}
                          onClick={() => handleLinkTask(task.id)}
                          className="w-full text-left flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[#2a2a2a] transition-colors"
                        >
                          <span
                            className={`text-[10px] ${
                              PRIORITY_COLORS[task.priority as keyof typeof PRIORITY_COLORS] || "text-gray-400"
                            }`}
                          >
                            •
                          </span>
                          <span className="text-xs text-gray-300 truncate">
                            {task.title}
                          </span>
                        </button>
                      ))
                    ) : (
                      <p className="text-xs text-gray-600 text-center py-2">
                        No tasks available to link
                      </p>
                    )}
                    <button
                      onClick={() => setShowTaskPicker(false)}
                      className="w-full text-xs text-gray-500 hover:text-white py-1 mt-1 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowTaskPicker(true)}
                    className="text-xs text-[#7c3aed] hover:text-[#a78bfa] transition-colors flex items-center gap-1"
                  >
                    <Link2 size={11} />
                    Link a task to this session
                  </button>
                )}
              </>
            )}
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
