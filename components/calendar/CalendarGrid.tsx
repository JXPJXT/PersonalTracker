"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  format,
  startOfWeek,
  addDays,
  isToday,
  isSameDay,
  differenceInCalendarDays,
} from "date-fns";
import TimeBar from "./TimeBar";
import CurrentTimeLine from "./CurrentTimeLine";
import NewEntryModal from "./NewEntryModal";
import EntryDetailModal from "./EntryDetailModal";
import { snapTo15Min } from "@/lib/utils";

const PX_PER_HOUR = 64;
const TOTAL_HEIGHT = 24 * PX_PER_HOUR; // 1536px
const TIME_AXIS_WIDTH = 52;

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

interface CalendarGridProps {
  weekStart: Date;
  entries: TimeEntryData[];
  userId: string;
  subjects: Subject[];
  onRefresh: () => void;
}

export default function CalendarGrid({
  weekStart,
  entries,
  userId,
  subjects,
  onRefresh,
}: CalendarGridProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [newEntryModal, setNewEntryModal] = useState<{
    date: Date;
    hour: number;
    minute: number;
  } | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<TimeEntryData | null>(null);

  // Scroll to 6 AM on mount
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 6 * PX_PER_HOUR;
    }
  }, []);

  // Close modals on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setNewEntryModal(null);
        setSelectedEntry(null);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Days of the week
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Find today's day index (0-6, -1 if not in this week)
  const todayIndex = days.findIndex((d) => isToday(d));

  // Handle click on grid column to create entry
  const handleGridClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>, dayIndex: number) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const y = e.clientY - rect.top + (scrollRef.current?.scrollTop || 0);
      const totalMinutes = (y / PX_PER_HOUR) * 60;
      const snapped = snapTo15Min(totalMinutes);
      const hour = Math.floor(snapped / 60);
      const minute = snapped % 60;

      setNewEntryModal({
        date: days[dayIndex],
        hour: Math.max(0, Math.min(23, hour)),
        minute,
      });
    },
    [days]
  );

  // Group entries by day
  const entriesByDay = new Map<number, TimeEntryData[]>();
  for (const entry of entries) {
    const entryDate = new Date(entry.start);
    const dayIdx = days.findIndex((d) => isSameDay(d, entryDate));
    if (dayIdx !== -1) {
      const existing = entriesByDay.get(dayIdx) || [];
      existing.push(entry);
      entriesByDay.set(dayIdx, existing);
    }
  }

  // Hour labels
  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="flex flex-col h-full">
      {/* Day headers */}
      <div className="flex border-b border-[#2a2a2a] shrink-0">
        {/* Time axis spacer */}
        <div className="w-[52px] shrink-0" />
        {/* Day columns */}
        {days.map((day, i) => {
          const today = isToday(day);
          return (
            <div
              key={i}
              className="flex-1 py-2 px-2 text-center border-l border-[#2a2a2a] first:border-l-0"
            >
              <div
                className={`text-[10px] uppercase tracking-wider font-medium mb-0.5 ${
                  today ? "text-[#7c3aed]" : "text-[#888]"
                }`}
              >
                {format(day, "EEE")}
              </div>
              <div
                className={`text-lg font-semibold leading-tight ${
                  today ? "text-[#7c3aed]" : "text-white"
                }`}
              >
                {format(day, "d")}
              </div>
              <div className="text-[9px] text-[#666] mt-0.5">0:00:00</div>
            </div>
          );
        })}
      </div>

      {/* Scrollable grid area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-hidden relative">
        <div className="relative" style={{ height: `${TOTAL_HEIGHT}px` }}>
          {/* Hour lines and labels */}
          {hours.map((hour) => (
            <div
              key={hour}
              className="grid-line-h"
              style={{ top: `${hour * PX_PER_HOUR}px` }}
            >
              <span
                className="absolute text-[10px] text-[#666] tabular-nums"
                style={{
                  left: "4px",
                  top: "-7px",
                  width: `${TIME_AXIS_WIDTH - 8}px`,
                  textAlign: "right",
                }}
              >
                {hour === 0
                  ? ""
                  : `${hour > 12 ? hour - 12 : hour}:00 ${hour >= 12 ? "PM" : "AM"}`}
              </span>
            </div>
          ))}

          {/* Vertical grid lines between columns */}
          {days.map((_, i) => (
            <div
              key={`vline-${i}`}
              className="grid-line-v"
              style={{
                left: `calc(${TIME_AXIS_WIDTH}px + ${i} * (100% - ${TIME_AXIS_WIDTH}px) / 7)`,
              }}
            />
          ))}

          {/* Clickable day columns (invisible, for click-to-create) */}
          <div
            className="absolute inset-0 flex"
            style={{ left: `${TIME_AXIS_WIDTH}px`, right: 0 }}
          >
            {days.map((_, i) => (
              <div
                key={`col-${i}`}
                className="flex-1 cursor-pointer hover:bg-white/[0.02] transition-colors"
                onClick={(e) => handleGridClick(e, i)}
              />
            ))}
          </div>

          {/* Time entry bars */}
          {Array.from(entriesByDay.entries()).map(([dayIdx, dayEntries]) =>
            dayEntries.map((entry) => (
              <TimeBar
                key={entry.id}
                id={entry.id}
                description={entry.description}
                start={new Date(entry.start)}
                stop={entry.stop ? new Date(entry.stop) : null}
                subjectColor={entry.subject?.color || "#666"}
                subjectName={entry.subject?.name || ""}
                dayIndex={dayIdx}
                onClick={() => setSelectedEntry(entry)}
              />
            ))
          )}

          {/* Current time line */}
          {todayIndex !== -1 && <CurrentTimeLine dayIndex={todayIndex} />}
        </div>
      </div>

      {/* New Entry Modal */}
      {newEntryModal && (
        <NewEntryModal
          date={newEntryModal.date}
          startHour={newEntryModal.hour}
          startMinute={newEntryModal.minute}
          userId={userId}
          subjects={subjects}
          onClose={() => setNewEntryModal(null)}
          onCreated={() => {
            setNewEntryModal(null);
            onRefresh();
          }}
        />
      )}

      {/* Entry Detail Modal */}
      {selectedEntry && (
        <EntryDetailModal
          entry={selectedEntry}
          subjects={subjects}
          onClose={() => setSelectedEntry(null)}
          onUpdated={() => {
            setSelectedEntry(null);
            onRefresh();
          }}
        />
      )}
    </div>
  );
}
