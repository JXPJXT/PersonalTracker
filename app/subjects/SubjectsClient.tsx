"use client";

import { useState, useEffect, useTransition } from "react";
import {
  createSubject,
  updateSubject,
  deleteSubject,
  getSubjects,
} from "@/lib/actions";
import { Plus, Pencil, Trash2, X, BookOpen } from "lucide-react";

const PRESET_COLORS = [
  "#7c3aed",
  "#2563eb",
  "#16a34a",
  "#ea580c",
  "#dc2626",
  "#0891b2",
  "#d946ef",
  "#ca8a04",
  "#4f46e5",
  "#059669",
  "#e11d48",
  "#0d9488",
];

interface SubjectData {
  id: string;
  name: string;
  color: string;
  entryCount: number;
}

interface SubjectsClientProps {
  userId: string;
  subjects: SubjectData[];
}

export default function SubjectsClient({
  userId,
  subjects: initialSubjects,
}: SubjectsClientProps) {
  const [subjects, setSubjects] = useState(initialSubjects);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [isPending, startTransition] = useTransition();

  // Sync props to state when server data changes
  useEffect(() => {
    setSubjects(initialSubjects);
  }, [initialSubjects]);

  const refreshSubjects = async () => {
    const fresh = await getSubjects(userId);
    setSubjects(
      fresh.map((s) => ({
        id: s.id,
        name: s.name,
        color: s.color,
        entryCount: s._count.entries,
      }))
    );
  };

  const handleCreate = async () => {
    if (!name.trim()) return;
    startTransition(async () => {
      await createSubject(userId, name.trim(), color);
      await refreshSubjects();
      setShowForm(false);
      setName("");
      setColor(PRESET_COLORS[0]);
    });
  };

  const handleUpdate = async (id: string) => {
    if (!name.trim()) return;
    startTransition(async () => {
      await updateSubject(id, name.trim(), color);
      await refreshSubjects();
      setEditingId(null);
      setName("");
      setColor(PRESET_COLORS[0]);
    });
  };

  const handleDelete = async (id: string) => {
    startTransition(async () => {
      await deleteSubject(id);
      await refreshSubjects();
    });
  };

  const startEdit = (subject: SubjectData) => {
    setEditingId(subject.id);
    setName(subject.name);
    setColor(subject.color);
    setShowForm(false);
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Subjects</h1>
          <p className="text-sm text-gray-400 mt-1">
            Manage your study subjects and their colors
          </p>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingId(null);
            setName("");
            setColor(PRESET_COLORS[0]);
          }}
          className="btn-primary"
          disabled={isPending}
        >
          <Plus size={16} />
          Add Subject
        </button>
      </div>

      {/* Subject list */}
      <div className="space-y-2">
        {subjects.map((subject) => (
          <div
            key={subject.id}
            className={`flex items-center gap-4 p-4 bg-[#222] rounded-xl border border-[#2a2a2a] hover:border-[#333] transition-colors group ${
              isPending ? "opacity-60 pointer-events-none" : ""
            }`}
          >
            <div
              className="w-5 h-5 rounded-full shrink-0"
              style={{ backgroundColor: subject.color }}
            />
            {editingId === subject.id ? (
              <div className="flex-1 flex items-center gap-3">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field flex-1"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleUpdate(subject.id);
                    if (e.key === "Escape") setEditingId(null);
                  }}
                />
                <div className="flex gap-1.5">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className={`w-5 h-5 rounded-full transition-transform ${
                        color === c ? "scale-125 ring-2 ring-white/40" : ""
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <button
                  className="btn-primary text-xs py-1.5"
                  onClick={() => handleUpdate(subject.id)}
                >
                  Save
                </button>
                <button
                  className="btn-ghost text-xs py-1.5"
                  onClick={() => setEditingId(null)}
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <>
                <div className="flex-1">
                  <span className="text-sm font-medium text-white">
                    {subject.name}
                  </span>
                  <span className="text-xs text-gray-500 ml-3">
                    {subject.entryCount} sessions
                  </span>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => startEdit(subject)}
                    className="p-1.5 hover:bg-[#333] rounded transition-colors"
                  >
                    <Pencil size={14} className="text-gray-400" />
                  </button>
                  <button
                    onClick={() => handleDelete(subject.id)}
                    className="p-1.5 hover:bg-[#333] rounded transition-colors"
                  >
                    <Trash2 size={14} className="text-red-400" />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {subjects.length === 0 && (
        <div className="text-center py-20">
          <BookOpen size={40} className="text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">No subjects yet</p>
          <p className="text-sm text-gray-600 mt-1">
            Add your first subject to start tracking
          </p>
        </div>
      )}

      {/* New subject form */}
      {showForm && (
        <div className="mt-4 p-4 bg-[#222] rounded-xl border border-[#333]">
          <h3 className="text-sm font-medium text-white mb-3">New Subject</h3>
          <div className="space-y-3">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field"
              placeholder="Subject name"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate();
                if (e.key === "Escape") setShowForm(false);
              }}
            />
            <div className="flex gap-2 flex-wrap">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-transform ${
                    color === c
                      ? "scale-110 ring-2 ring-white/40 ring-offset-2 ring-offset-[#222]"
                      : "hover:scale-105"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={() => setShowForm(false)} className="btn-ghost">
                Cancel
              </button>
              <button
                onClick={handleCreate}
                className="btn-primary"
                disabled={isPending}
              >
                {isPending ? "Creating…" : "Create Subject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
