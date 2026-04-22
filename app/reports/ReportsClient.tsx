"use client";

import { useMemo } from "react";
import {
  startOfWeek,
  endOfWeek,
  isWithinInterval,
  subDays,
  format,
  isSameDay,
  differenceInCalendarDays,
  eachDayOfInterval,
} from "date-fns";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { formatHoursMinutes } from "@/lib/utils";
import { Flame, Clock, BookOpen, TrendingUp } from "lucide-react";

interface EntryData {
  id: number;
  description: string;
  start: string;
  stop: string | null;
  durationInSeconds: number | null;
  subjectId: string | null;
  subject: { id: string; name: string; color: string } | null;
}

interface SubjectData {
  id: string;
  name: string;
  color: string;
}

interface ReportsClientProps {
  entries: EntryData[];
  subjects: SubjectData[];
}

export default function ReportsClient({
  entries,
  subjects,
}: ReportsClientProps) {
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  // Weekly entries
  const weeklyEntries = useMemo(
    () =>
      entries.filter((e) =>
        isWithinInterval(new Date(e.start), { start: weekStart, end: weekEnd })
      ),
    [entries, weekStart, weekEnd]
  );

  // Weekly total seconds
  const weeklyTotalSeconds = useMemo(
    () =>
      weeklyEntries.reduce((sum, e) => sum + (e.durationInSeconds || 0), 0),
    [weeklyEntries]
  );

  // Hours per subject for pie chart
  const pieData = useMemo(() => {
    const map = new Map<string, { name: string; color: string; seconds: number }>();
    for (const entry of weeklyEntries) {
      const key = entry.subject?.id || "none";
      const existing = map.get(key) || {
        name: entry.subject?.name || "Uncategorized",
        color: entry.subject?.color || "#666",
        seconds: 0,
      };
      existing.seconds += entry.durationInSeconds || 0;
      map.set(key, existing);
    }
    return Array.from(map.values())
      .map((d) => ({
        name: d.name,
        color: d.color,
        hours: Math.round((d.seconds / 3600) * 10) / 10,
      }))
      .sort((a, b) => b.hours - a.hours);
  }, [weeklyEntries]);

  // Weekly trend logic (last 6 weeks)
  const lineChartData = useMemo(() => {
    const data: Array<Record<string, string | number>> = [];
    const weeksToShow = 6;
    for (let i = weeksToShow - 1; i >= 0; i--) {
      const wStart = subDays(weekStart, i * 7);
      const wEnd = endOfWeek(wStart, { weekStartsOn: 1 });
      const weekLabel = format(wStart, "MMM d");
      
      const weekPeriodEntries = entries.filter(e => isWithinInterval(new Date(e.start), {start: wStart, end: wEnd}));
      
      const weekEntryObj: Record<string, string | number> = { name: weekLabel };
      
      // Ensure all subjects explicitly exist so lines drawn continuously 
      subjects.forEach(s => {
        weekEntryObj[s.name] = 0;
      });

      for(const entry of weekPeriodEntries) {
         if (entry.subject) {
            const current = weekEntryObj[entry.subject.name] || 0;
            weekEntryObj[entry.subject.name] = current + (entry.durationInSeconds || 0) / 3600;
         }
      }
      
      // Round everything to 1 decimal
      subjects.forEach(s => {
        weekEntryObj[s.name] = Math.round(weekEntryObj[s.name] * 10) / 10;
      });

      data.push(weekEntryObj);
    }
    return data;
  }, [entries, weekStart, subjects]);

  // Heatmap data (last 90 days)
  const heatmapData = useMemo(() => {
    const start = subDays(now, 89);
    const days = eachDayOfInterval({ start, end: now });
    return days.map((day) => {
      const dayEntries = entries.filter((e) =>
        isSameDay(new Date(e.start), day)
      );
      const totalSeconds = dayEntries.reduce(
        (sum, e) => sum + (e.durationInSeconds || 0),
        0
      );
      return {
        date: day,
        hours: totalSeconds / 3600,
      };
    });
  }, [entries, now]);

  // Study streak
  const streak = useMemo(() => {
    let count = 0;
    let day = now;
    // Check if studied today
    const todayEntries = entries.filter((e) =>
      isSameDay(new Date(e.start), day)
    );
    if (todayEntries.length === 0) {
      day = subDays(day, 1); // Start from yesterday
    }
    while (true) {
      const dayEntries = entries.filter((e) =>
        isSameDay(new Date(e.start), day)
      );
      if (dayEntries.length > 0) {
        count++;
        day = subDays(day, 1);
      } else {
        break;
      }
    }
    return count;
  }, [entries, now]);

  const maxHeatmapHours = Math.max(...heatmapData.map((d) => d.hours), 1);

  return (
    <div className="p-8 max-w-4xl mx-auto overflow-y-auto h-full">
      <h1 className="text-2xl font-bold text-white mb-2">Reports</h1>
      <p className="text-sm text-gray-400 mb-8">
        Your study analytics for this week
      </p>

      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-[#222] rounded-xl border border-[#2a2a2a] p-5">
          <div className="flex items-center gap-2 text-gray-400 text-xs mb-3">
            <Clock size={14} />
            <span>Weekly Total</span>
          </div>
          <div className="text-3xl font-bold text-white">
            {Math.round((weeklyTotalSeconds / 3600) * 10) / 10}
            <span className="text-lg text-gray-400 ml-1">hours</span>
          </div>
        </div>

        <div className="bg-[#222] rounded-xl border border-[#2a2a2a] p-5">
          <div className="flex items-center gap-2 text-gray-400 text-xs mb-3">
            <BookOpen size={14} />
            <span>Sessions</span>
          </div>
          <div className="text-3xl font-bold text-white">
            {weeklyEntries.length}
            <span className="text-lg text-gray-400 ml-1">this week</span>
          </div>
        </div>

        <div className="bg-[#222] rounded-xl border border-[#2a2a2a] p-5">
          <div className="flex items-center gap-2 text-gray-400 text-xs mb-3">
            <Flame size={14} />
            <span>Study Streak</span>
          </div>
          <div className="text-3xl font-bold text-white">
            🔥 {streak}
            <span className="text-lg text-gray-400 ml-1">days</span>
          </div>
        </div>
      </div>

      {/* Pie chart */}
      <div className="bg-[#222] rounded-xl border border-[#2a2a2a] p-6 mb-8">
        <h2 className="text-sm font-medium text-white mb-4">
          Hours per Subject
        </h2>
        {pieData.length > 0 ? (
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="hours"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  innerRadius={55}
                  strokeWidth={0}
                  paddingAngle={2}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "#333",
                    border: "1px solid #444",
                    borderRadius: "8px",
                    fontSize: "12px",
                    color: "#fff",
                  }}
                  formatter={(value: any) => [
                    `${value} hours`,
                    "",
                  ]}
                />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: "12px", color: "#888" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500 text-sm">
            No data for this week yet
          </div>
        )}
      </div>

      {/* Subject Trend Line Chart */}
      <div className="bg-[#222] rounded-xl border border-[#2a2a2a] p-6 mb-8">
        <h2 className="text-sm font-medium text-white mb-4">Subject Trend (Last 6 Weeks)</h2>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lineChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
              <XAxis dataKey="name" stroke="#666" tick={{fill: '#666', fontSize: 12}} tickLine={false} axisLine={false} />
              <YAxis stroke="#666" tick={{fill: '#666', fontSize: 12}} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ background: "#333", border: "1px solid #444", borderRadius: "8px", fontSize: "12px", color: "#fff" }}
              />
              <Legend wrapperStyle={{ fontSize: "12px", color: "#888" }} iconType="circle" />
              {subjects.map(s => (
                <Line 
                  key={s.id} 
                  type="monotone" 
                  dataKey={s.name} 
                  stroke={s.color} 
                  strokeWidth={2}
                  dot={{ r: 3, strokeWidth: 2 }}
                  activeDot={{ r: 5 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Heatmap */}
      <div className="bg-[#222] rounded-xl border border-[#2a2a2a] p-6">
        <h2 className="text-sm font-medium text-white mb-4">
          Study Activity (Last 90 Days)
        </h2>
        <div className="flex flex-wrap gap-[3px]">
          {heatmapData.map((day, i) => {
            const intensity = day.hours / maxHeatmapHours;
            let bg = "#1a1a1a";
            if (day.hours > 0) {
              if (intensity > 0.75) bg = "#7c3aed";
              else if (intensity > 0.5) bg = "#7c3aedcc";
              else if (intensity > 0.25) bg = "#7c3aed88";
              else bg = "#7c3aed44";
            }
            return (
              <div
                key={i}
                className="w-[11px] h-[11px] rounded-[2px] transition-colors"
                style={{ backgroundColor: bg }}
                title={`${format(day.date, "MMM d")}: ${
                  day.hours > 0
                    ? `${Math.round(day.hours * 10) / 10}h`
                    : "No study"
                }`}
              />
            );
          })}
        </div>
        <div className="flex items-center gap-2 mt-3 text-[10px] text-gray-500">
          <span>Less</span>
          {["#1a1a1a", "#7c3aed44", "#7c3aed88", "#7c3aedcc", "#7c3aed"].map(
            (color) => (
              <div
                key={color}
                className="w-[11px] h-[11px] rounded-[2px]"
                style={{ backgroundColor: color }}
              />
            )
          )}
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
