"use client";

import { useState, useCallback } from "react";
import { startOfWeek, endOfWeek } from "date-fns";
import TopBar from "@/components/topbar/TopBar";
import CalendarGrid from "@/components/calendar/CalendarGrid";
import ListView from "@/components/calendar/ListView";
import SmartSuggestions from "@/components/suggestions/SmartSuggestions";
import ExamCountdown from "@/components/suggestions/ExamCountdown";
import { getEntriesForWeek } from "@/lib/actions";
import { useRouter } from "next/navigation";

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
  subject: { id: string; name: string; color: string } | null;
}

interface TaskData {
  id: string;
  title: string;
  priority: string;
  completed: boolean;
  dueDate: string | null;
  subject: Subject | null;
}

interface CalendarPageClientProps {
  userId: string;
  subjects: Subject[];
  initialEntries: TimeEntryData[];
  initialWeekStart: string;
  tasks: TaskData[];
}

export default function CalendarPageClient({
  userId,
  subjects,
  initialEntries,
  initialWeekStart,
  tasks,
}: CalendarPageClientProps) {
  const [weekStart, setWeekStart] = useState(new Date(initialWeekStart));
  const [entries, setEntries] = useState<TimeEntryData[]>(initialEntries);
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");
  const router = useRouter();

  const fetchEntries = useCallback(
    async (ws: Date) => {
      const we = endOfWeek(ws, { weekStartsOn: 1 });
      const data = await getEntriesForWeek(
        userId,
        ws.toISOString(),
        we.toISOString()
      );
      // Server action serializes Dates — they may arrive as strings or Date objects
      const serialized = data.map((e: Record<string, unknown>) => ({
        id: Number(e.id),
        description: String(e.description || ""),
        start: e.start instanceof Date ? e.start.toISOString() : String(e.start),
        stop: e.stop
          ? e.stop instanceof Date
            ? e.stop.toISOString()
            : String(e.stop)
          : null,
        durationInSeconds: e.durationInSeconds ? Number(e.durationInSeconds) : null,
        subjectId: e.subjectId ? String(e.subjectId) : null,
        subject: e.subject
          ? {
              id: String((e.subject as Record<string, unknown>).id),
              name: String((e.subject as Record<string, unknown>).name),
              color: String((e.subject as Record<string, unknown>).color),
            }
          : null,
      }));
      setEntries(serialized);
    },
    [userId]
  );

  const handleWeekChange = useCallback(
    async (newWeekStart: Date) => {
      setWeekStart(newWeekStart);
      await fetchEntries(newWeekStart);
    },
    [fetchEntries]
  );

  const handleRefresh = useCallback(async () => {
    await fetchEntries(weekStart);
    router.refresh();
  }, [fetchEntries, weekStart, router]);

  return (
    <div className="flex flex-col h-screen">
      <TopBar
        userId={userId}
        currentWeekStart={weekStart}
        onWeekChange={handleWeekChange}
        subjects={subjects}
        viewMode={viewMode}
        setViewMode={setViewMode}
      />
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-hidden">
          {viewMode === "calendar" ? (
            <CalendarGrid
              weekStart={weekStart}
              entries={entries}
              userId={userId}
              subjects={subjects}
              tasks={tasks}
              onRefresh={handleRefresh}
            />
          ) : (
            <ListView
              weekStart={weekStart}
              entries={entries}
              onRefresh={handleRefresh}
            />
          )}
        </div>
        {/* Right sidebar with Smart Suggestions and Countdown */}
        <div className="w-[280px] border-l border-[#2a2a2a] bg-[#1a1a1a] p-4 overflow-y-auto shrink-0 hidden xl:block space-y-6">
          <ExamCountdown tasks={tasks} />
          <SmartSuggestions userId={userId} />
        </div>
      </div>
    </div>
  );
}
