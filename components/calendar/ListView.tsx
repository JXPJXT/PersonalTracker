"use client";

import { format, isSameDay, addDays } from "date-fns";
import { Copy, Trash2, Clock, Play } from "lucide-react";
import { deleteTimeEntry } from "@/lib/actions";
import { useTimerStore } from "@/lib/store";
import { formatDuration } from "@/lib/utils";

interface Subject {
  id: string;
  name: string;
  color: string;
}

interface TimeEntryData {
  id: number;
  description: string;
  start: string;
  stop: string | null;
  durationInSeconds: number | null;
  subjectId: string | null;
  subject: Subject | null;
}

interface ListViewProps {
  weekStart: Date;
  entries: TimeEntryData[];
  onRefresh: () => void;
}

export default function ListView({ weekStart, entries, onRefresh }: ListViewProps) {
  const store = useTimerStore();

  const days = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this session?")) {
      await deleteTimeEntry(id);
      onRefresh();
    }
  };

  const handleContinue = (entry: TimeEntryData) => {
    store.setDescription(entry.description);
    store.setSubjectId(entry.subjectId);
    // Let the user manually start the timer by clicking Play in TopBar or we could start it automatically.
    // For now we just pre-fill
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 text-white min-h-0 bg-[#111]">
      <div className="max-w-4xl mx-auto space-y-8 pb-10">
        <h2 className="text-xl font-semibold mb-6 flex items-center gap-2 text-white">
          <Clock size={20} className="text-purple-400" /> List View
        </h2>

        {entries.length === 0 ? (
          <div className="text-center py-20 text-gray-500 rounded-xl border border-dashed border-[#333] bg-[#1a1a1a]">
            No sessions recorded this week. Click the Play button in the TopBar to start tracking.
          </div>
        ) : (
          days.map((day) => {
            const dayEntries = entries.filter((e) => isSameDay(new Date(e.start), day));

            if (dayEntries.length === 0) return null;

            const totalDurationForDay = dayEntries.reduce((acc, e) => acc + (e.durationInSeconds || 0), 0);

            return (
              <div key={day.toISOString()} className="bg-[#1a1a1a] rounded-xl overflow-hidden border border-[#2a2a2a]">
                <div className="bg-[#222] px-4 py-3 flex justify-between items-center border-b border-[#2a2a2a]">
                  <h3 className="font-medium text-gray-200">
                    {format(day, "EEEE, MMM d")}
                  </h3>
                  <span className="text-xs font-mono text-gray-400 bg-[#333] px-2 py-0.5 rounded">
                    Total: {formatDuration(totalDurationForDay)}
                  </span>
                </div>
                
                <div className="divide-y divide-[#2a2a2a]">
                  {dayEntries.map((entry) => (
                    <div key={entry.id} className="p-4 flex items-center gap-4 hover:bg-[#222] transition-colors group">
                      <div className="w-[100px] text-xs font-mono text-gray-500 shrink-0">
                        {format(new Date(entry.start), "HH:mm")} - {entry.stop ? format(new Date(entry.stop), "HH:mm") : "Now"}
                      </div>
                      
                      <div className="w-1.5 h-10 rounded-full shrink-0" style={{ backgroundColor: entry.subject?.color || "#555" }} />
                      
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-gray-200 truncate">
                          {entry.description || "Untitled Session"}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-2 mt-1">
                          <span 
                            className="px-1.5 py-0.5 rounded-sm"
                            style={{ 
                              backgroundColor: entry.subject ? `${entry.subject.color}20` : '#333',
                              color: entry.subject?.color || '#888'
                            }}
                          >
                            {entry.subject?.name || "No Subject"}
                          </span>
                        </div>
                      </div>

                      <div className="text-sm font-mono text-gray-300 w-20 text-right shrink-0">
                        {formatDuration(entry.durationInSeconds || 0)}
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity pl-4">
                        <button 
                          onClick={() => handleContinue(entry)}
                          className="p-1.5 text-gray-400 hover:text-white hover:bg-[#333] rounded transition-colors"
                          title="Copy session details to TopBar"
                        >
                          <Copy size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(entry.id)}
                          className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-[#ff4757]/10 rounded transition-colors"
                          title="Delete Session"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
