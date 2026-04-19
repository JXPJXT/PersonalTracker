"use client";

import { useState, useMemo, useTransition } from "react";
import {
  createTask,
  updateTask,
  deleteTask,
  getTasks,
} from "@/lib/actions";
import {
  Plus,
  Check,
  Trash2,
  ChevronDown,
  ChevronUp,
  Flag,
  CalendarDays,
  ListTodo,
  StickyNote,
  ArrowUpDown,
} from "lucide-react";
import { format, isPast, isToday, isTomorrow, parseISO } from "date-fns";

interface Subject {
  id: string;
  name: string;
  color: string;
}

interface TaskData {
  id: string;
  title: string;
  description: string;
  priority: string;
  dueDate: string | null;
  completed: boolean;
  completedAt: string | null;
  subjectId: string | null;
  subject: Subject | null;
  createdAt: string;
}

interface TasksClientProps {
  userId: string;
  tasks: TaskData[];
  subjects: Subject[];
}

const PRIORITY_ORDER = { HIGH: 0, MEDIUM: 1, LOW: 2 };
const PRIORITY_COLORS = {
  HIGH: { bg: "bg-red-500/15", text: "text-red-400", border: "border-red-500/30" },
  MEDIUM: { bg: "bg-amber-500/15", text: "text-amber-400", border: "border-amber-500/30" },
  LOW: { bg: "bg-blue-500/15", text: "text-blue-400", border: "border-blue-500/30" },
};

type SortField = "priority" | "dueDate" | "createdAt" | "title";

export default function TasksClient({
  userId,
  tasks: initialTasks,
  subjects,
}: TasksClientProps) {
  const [tasks, setTasks] = useState(initialTasks);
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // New task form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [dueDate, setDueDate] = useState("");
  const [subjectId, setSubjectId] = useState<string | null>(null);

  // Edit task
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPriority, setEditPriority] = useState("MEDIUM");
  const [editDueDate, setEditDueDate] = useState("");
  const [editSubjectId, setEditSubjectId] = useState<string | null>(null);

  // Sort
  const [sortField, setSortField] = useState<SortField>("priority");
  const [sortAsc, setSortAsc] = useState(true);

  const refreshTasks = async () => {
    const fresh = await getTasks(userId);
    setTasks(
      fresh.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        priority: t.priority,
        dueDate: t.dueDate?.toISOString() || null,
        completed: t.completed,
        completedAt: t.completedAt?.toISOString() || null,
        subjectId: t.subjectId,
        subject: t.subject
          ? { id: t.subject.id, name: t.subject.name, color: t.subject.color }
          : null,
        createdAt: t.createdAt.toISOString(),
      }))
    );
  };

  const sortedTasks = useMemo(() => {
    const incomplete = tasks.filter((t) => !t.completed);
    const completed = tasks.filter((t) => t.completed);

    const sortFn = (a: TaskData, b: TaskData) => {
      let cmp = 0;
      switch (sortField) {
        case "priority":
          cmp =
            (PRIORITY_ORDER[a.priority as keyof typeof PRIORITY_ORDER] ?? 1) -
            (PRIORITY_ORDER[b.priority as keyof typeof PRIORITY_ORDER] ?? 1);
          break;
        case "dueDate":
          if (!a.dueDate && !b.dueDate) cmp = 0;
          else if (!a.dueDate) cmp = 1;
          else if (!b.dueDate) cmp = -1;
          else cmp = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          break;
        case "createdAt":
          cmp = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          break;
        case "title":
          cmp = a.title.localeCompare(b.title);
          break;
      }
      return sortAsc ? cmp : -cmp;
    };

    return [...incomplete.sort(sortFn), ...completed];
  }, [tasks, sortField, sortAsc]);

  const handleCreate = async () => {
    if (!title.trim()) return;
    startTransition(async () => {
      await createTask({
        title: title.trim(),
        description,
        priority,
        dueDate: dueDate || null,
        subjectId,
        userId,
      });
      await refreshTasks();
      setTitle("");
      setDescription("");
      setPriority("MEDIUM");
      setDueDate("");
      setSubjectId(null);
      setShowForm(false);
    });
  };

  const handleToggle = (task: TaskData) => {
    startTransition(async () => {
      await updateTask(task.id, { completed: !task.completed });
      await refreshTasks();
    });
  };

  const handleUpdate = async (id: string) => {
    if (!editTitle.trim()) return;
    startTransition(async () => {
      await updateTask(id, {
        title: editTitle.trim(),
        description: editDescription,
        priority: editPriority,
        dueDate: editDueDate || null,
        subjectId: editSubjectId,
      });
      await refreshTasks();
      setEditingId(null);
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      await deleteTask(id);
      await refreshTasks();
    });
  };

  const startEdit = (task: TaskData) => {
    setEditingId(task.id);
    setEditTitle(task.title);
    setEditDescription(task.description);
    setEditPriority(task.priority);
    setEditDueDate(task.dueDate ? task.dueDate.split("T")[0] : "");
    setEditSubjectId(task.subjectId);
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const getDueDateLabel = (dateStr: string | null) => {
    if (!dateStr) return null;
    const date = parseISO(dateStr);
    if (isToday(date)) return { text: "Today", className: "text-amber-400" };
    if (isTomorrow(date)) return { text: "Tomorrow", className: "text-blue-400" };
    if (isPast(date)) return { text: `Overdue · ${format(date, "MMM d")}`, className: "text-red-400" };
    return { text: format(date, "MMM d"), className: "text-gray-400" };
  };

  const incompleteCount = tasks.filter((t) => !t.completed).length;
  const completedCount = tasks.filter((t) => t.completed).length;

  return (
    <div className="p-8 max-w-3xl mx-auto overflow-y-auto h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ListTodo size={24} />
            Tasks
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            {incompleteCount} pending · {completedCount} completed
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary"
          disabled={isPending}
        >
          <Plus size={16} />
          New Task
        </button>
      </div>

      {/* Sort controls */}
      <div className="flex items-center gap-2 mb-4 text-xs text-gray-500">
        <ArrowUpDown size={12} />
        <span>Sort by:</span>
        {(["priority", "dueDate", "title", "createdAt"] as SortField[]).map(
          (field) => (
            <button
              key={field}
              onClick={() => toggleSort(field)}
              className={`px-2 py-1 rounded transition-colors ${
                sortField === field
                  ? "bg-[#7c3aed]/20 text-[#7c3aed]"
                  : "hover:bg-[#2a2a2a] text-gray-400"
              }`}
            >
              {field === "dueDate" ? "Due Date" : field === "createdAt" ? "Newest" : field.charAt(0).toUpperCase() + field.slice(1)}
              {sortField === field && (sortAsc ? " ↑" : " ↓")}
            </button>
          )
        )}
      </div>

      {/* New task form */}
      {showForm && (
        <div className="mb-6 p-5 bg-[#222] rounded-xl border border-[#333]">
          <h3 className="text-sm font-medium text-white mb-4">Create Task</h3>
          <div className="space-y-3">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-field"
              placeholder="Task title"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate();
                if (e.key === "Escape") setShowForm(false);
              }}
            />

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field min-h-[60px] resize-y"
              placeholder="Description (optional)"
            />

            <div className="flex gap-3">
              {/* Priority */}
              <div className="flex-1">
                <label className="text-xs text-gray-400 mb-1.5 block">
                  <Flag size={11} className="inline mr-1" />
                  Priority
                </label>
                <div className="flex gap-1.5">
                  {(["HIGH", "MEDIUM", "LOW"] as const).map((p) => {
                    const colors = PRIORITY_COLORS[p];
                    return (
                      <button
                        key={p}
                        onClick={() => setPriority(p)}
                        className={`flex-1 px-2 py-1.5 text-xs rounded-lg border transition-all ${
                          priority === p
                            ? `${colors.bg} ${colors.text} ${colors.border}`
                            : "border-[#333] text-gray-500 hover:border-[#444]"
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Due date */}
              <div className="flex-1">
                <label className="text-xs text-gray-400 mb-1.5 block">
                  <CalendarDays size={11} className="inline mr-1" />
                  Due Date
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="input-field text-sm"
                />
              </div>
            </div>

            {/* Subject */}
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Subject</label>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setSubjectId(null)}
                  className={`px-2.5 py-1.5 text-xs rounded-lg border transition-all ${
                    subjectId === null
                      ? "border-white/30 bg-white/10 text-white"
                      : "border-[#333] text-gray-500 hover:border-[#444]"
                  }`}
                >
                  None
                </button>
                {subjects.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSubjectId(s.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg border transition-all ${
                      subjectId === s.id
                        ? "border-white/30 bg-white/10 text-white"
                        : "border-[#333] text-gray-500 hover:border-[#444]"
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: s.color }}
                    />
                    {s.name}
                  </button>
                ))}
              </div>
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
                {isPending ? "Creating…" : "Create Task"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Task list */}
      <div className="space-y-2">
        {sortedTasks.map((task) => {
          const colors = PRIORITY_COLORS[task.priority as keyof typeof PRIORITY_COLORS] || PRIORITY_COLORS.MEDIUM;
          const dueDateLabel = getDueDateLabel(task.dueDate);
          const isExpanded = expandedId === task.id;
          const isEditing = editingId === task.id;

          return (
            <div
              key={task.id}
              className={`bg-[#222] rounded-xl border transition-all ${
                task.completed
                  ? "border-[#2a2a2a] opacity-50"
                  : "border-[#2a2a2a] hover:border-[#333]"
              } ${isPending ? "pointer-events-none" : ""}`}
            >
              <div className="flex items-center gap-3 p-4">
                {/* Checkbox */}
                <button
                  onClick={() => handleToggle(task)}
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0 ${
                    task.completed
                      ? "bg-[#7c3aed] border-[#7c3aed]"
                      : "border-[#444] hover:border-[#7c3aed]"
                  }`}
                >
                  {task.completed && <Check size={12} className="text-white" />}
                </button>

                {/* Content */}
                <div
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() =>
                    setExpandedId(isExpanded ? null : task.id)
                  }
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-sm font-medium ${
                        task.completed
                          ? "text-gray-500 line-through"
                          : "text-white"
                      }`}
                    >
                      {task.title}
                    </span>
                    {task.subject && (
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: task.subject.color }}
                      />
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded ${colors.bg} ${colors.text}`}
                    >
                      {task.priority}
                    </span>
                    {dueDateLabel && (
                      <span className={`text-[10px] ${dueDateLabel.className}`}>
                        {dueDateLabel.text}
                      </span>
                    )}
                    {task.description && (
                      <StickyNote size={10} className="text-gray-600" />
                    )}
                  </div>
                </div>

                {/* Expand/Actions */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleDelete(task.id)}
                    className="p-1.5 hover:bg-red-500/20 rounded opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 size={13} className="text-red-400" />
                  </button>
                  <button
                    onClick={() =>
                      setExpandedId(isExpanded ? null : task.id)
                    }
                    className="p-1 hover:bg-[#333] rounded transition-colors"
                  >
                    {isExpanded ? (
                      <ChevronUp size={14} className="text-gray-400" />
                    ) : (
                      <ChevronDown size={14} className="text-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* Expanded detail / edit */}
              {isExpanded && (
                <div className="px-4 pb-4 pt-0 border-t border-[#2a2a2a]">
                  {isEditing ? (
                    <div className="space-y-3 pt-3">
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="input-field"
                        autoFocus
                      />
                      <textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        className="input-field min-h-[60px] resize-y"
                        placeholder="Description"
                      />
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <label className="text-xs text-gray-400 mb-1 block">Priority</label>
                          <div className="flex gap-1.5">
                            {(["HIGH", "MEDIUM", "LOW"] as const).map((p) => {
                              const pc = PRIORITY_COLORS[p];
                              return (
                                <button
                                  key={p}
                                  onClick={() => setEditPriority(p)}
                                  className={`flex-1 px-2 py-1.5 text-xs rounded-lg border transition-all ${
                                    editPriority === p
                                      ? `${pc.bg} ${pc.text} ${pc.border}`
                                      : "border-[#333] text-gray-500"
                                  }`}
                                >
                                  {p}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                        <div className="flex-1">
                          <label className="text-xs text-gray-400 mb-1 block">Due Date</label>
                          <input
                            type="date"
                            value={editDueDate}
                            onChange={(e) => setEditDueDate(e.target.value)}
                            className="input-field text-sm"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">Subject</label>
                        <div className="flex gap-2 flex-wrap">
                          <button
                            onClick={() => setEditSubjectId(null)}
                            className={`px-2 py-1 text-xs rounded-lg border ${
                              editSubjectId === null
                                ? "border-white/30 bg-white/10 text-white"
                                : "border-[#333] text-gray-500"
                            }`}
                          >
                            None
                          </button>
                          {subjects.map((s) => (
                            <button
                              key={s.id}
                              onClick={() => setEditSubjectId(s.id)}
                              className={`flex items-center gap-1.5 px-2 py-1 text-xs rounded-lg border ${
                                editSubjectId === s.id
                                  ? "border-white/30 bg-white/10 text-white"
                                  : "border-[#333] text-gray-500"
                              }`}
                            >
                              <span
                                className="w-2 h-2 rounded-full"
                                style={{ backgroundColor: s.color }}
                              />
                              {s.name}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingId(null)}
                          className="btn-ghost text-xs"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleUpdate(task.id)}
                          className="btn-primary text-xs"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="pt-3 space-y-2">
                      {task.description && (
                        <p className="text-sm text-gray-400">{task.description}</p>
                      )}
                      {task.subject && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: task.subject.color }}
                          />
                          {task.subject.name}
                        </div>
                      )}
                      {task.dueDate && (
                        <div className="text-xs text-gray-500">
                          Due: {format(parseISO(task.dueDate), "EEEE, MMM d, yyyy")}
                        </div>
                      )}
                      {task.completedAt && (
                        <div className="text-xs text-green-400/60">
                          Completed {format(parseISO(task.completedAt), "MMM d 'at' h:mm a")}
                        </div>
                      )}
                      <button
                        onClick={() => startEdit(task)}
                        className="text-xs text-[#7c3aed] hover:underline mt-1"
                      >
                        Edit task
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {tasks.length === 0 && (
        <div className="text-center py-20">
          <ListTodo size={40} className="text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">No tasks yet</p>
          <p className="text-sm text-gray-600 mt-1">
            Create your first task to stay organized
          </p>
        </div>
      )}
    </div>
  );
}
