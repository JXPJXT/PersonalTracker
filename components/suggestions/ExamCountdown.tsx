"use client";

import { differenceInDays, isAfter } from "date-fns";
import { AlertCircle, Target, ArrowRight } from "lucide-react";
import Link from "next/link";

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
  dueDate: string | null;
  subject: Subject | null;
}

export default function ExamCountdown({ tasks }: { tasks: TaskData[] }) {
  const now = new Date();

  // Find upcoming high-priority tasks (exams/major assignments)
  const upcomingExams = tasks
    .filter((t) => !t.completed && t.dueDate && t.priority === "HIGH" && isAfter(new Date(t.dueDate), now))
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());

  if (upcomingExams.length === 0) return null;

  const nextExam = upcomingExams[0];
  const daysUntil = differenceInDays(new Date(nextExam.dueDate!), now);

  // Auto-calculate suggested daily hours (assuming 20 hours of total prep needed as a heuristic)
  const targetPrepHours = 20; 
  const suggestedDaily = daysUntil > 0 ? (targetPrepHours / daysUntil).toFixed(1) : targetPrepHours;

  const subjectColor = nextExam.subject?.color || "#ff4757";

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
        <Target size={12} className="text-[#ff4757]" />
        <span className="font-medium">Up Next</span>
      </div>
      
      <div 
        className="relative overflow-hidden rounded-xl p-4 border bg-[#1a1a1a]"
        style={{ borderColor: `${subjectColor}40` }}
      >
        {/* Glow effect */}
        <div 
          className="absolute -top-10 -right-10 w-24 h-24 rounded-full blur-2xl opacity-20 pointer-events-none"
          style={{ backgroundColor: subjectColor }}
        />

        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="text-sm font-semibold text-white leading-tight mb-1">
              {nextExam.title}
            </h3>
            {nextExam.subject && (
              <span 
                className="text-xs px-1.5 py-0.5 rounded-sm"
                style={{ backgroundColor: `${subjectColor}20`, color: subjectColor }}
              >
                {nextExam.subject.name}
              </span>
            )}
          </div>
          <div className="flex flex-col items-end">
            <span 
              className="text-2xl font-bold leading-none tracking-tighter"
              style={{ color: subjectColor }}
            >
              {daysUntil}
            </span>
            <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">
              Days Left
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs pt-3 mt-1 border-t border-[#333]">
          <div className="text-gray-400 flex items-center gap-1">
            <AlertCircle size={12} />
            <span>Target: {suggestedDaily}h / day</span>
          </div>
          <Link 
            href="/tasks"
            className="text-white hover:text-gray-300 transition-colors flex items-center gap-1"
          >
            Details <ArrowRight size={10} />
          </Link>
        </div>
      </div>
    </div>
  );
}
