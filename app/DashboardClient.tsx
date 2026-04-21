"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  CheckCircle2, 
  Circle, 
  Layers, 
  Brain, 
  Moon, 
  Book, 
  Zap, 
  TrendingUp, 
  ArrowRight,
  Target,
  ListTodo,
  Calendar
} from "lucide-react";
import GoalWidget from "@/components/sidebar/GoalWidget";

interface TaskDisplay {
  id: string;
  title: string;
  priority: string;
  completed: boolean;
  dueDate: string | null;
  subject: { name: string; color: string } | null;
}

interface DueCard {
  id: string;
  deckName: string;
  subjectColor: string;
}

interface HabitData {
  id: string;
  name: string;
  icon: string;
  color: string;
  target: number;
  unit: string;
  entries: { date: string; value: number }[];
}

export default function DashboardClient({
  userId,
  userName,
  activeTasks,
  dueCards,
  habits,
  hasJournalToday,
}: {
  userId: string;
  userName: string;
  activeTasks: TaskDisplay[];
  dueCards: DueCard[];
  habits: HabitData[];
  hasJournalToday: boolean;
}) {
  const [time, setTime] = useState("");
  const todayStr = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    const updateTime = () => {
      setTime(new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }));
    };
    updateTime();
    const int = setInterval(updateTime, 60000);
    return () => clearInterval(int);
  }, []);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  };

  // Habits calculations for today
  const todaysHabits = habits.map(h => {
    const entry = h.entries.find(e => e.date === todayStr);
    const value = entry?.value || 0;
    return { ...h, val: value, isCompleted: value >= h.target };
  });

  const completedHabitsCount = todaysHabits.filter(h => h.isCompleted).length;
  const habitCompletionPct = todaysHabits.length > 0 
    ? Math.round((completedHabitsCount / todaysHabits.length) * 100) 
    : 0;

  return (
    <div className="p-8 max-w-6xl mx-auto h-full overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight mb-2">
            {getGreeting()}, {userName.split(" ")[0]}
          </h1>
          <p className="text-gray-400">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            {time && <span className="ml-2 px-2 py-0.5 bg-[#222] rounded text-gray-300 border border-[#333] text-sm">{time}</span>}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Left Column */}
        <div className="space-y-6 flex flex-col">
          {/* Active Tasks Widget */}
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl overflow-hidden flex flex-col shadow-lg">
            <div className="p-5 border-b border-[#222] flex items-center justify-between bg-[#16161a]">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <ListTodo size={18} className="text-indigo-400" />
                Active Tasks
              </h3>
              <Link href="/tasks" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 group">
                View All <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
            <div className="p-5 flex-1 space-y-3">
              {activeTasks.length > 0 ? (
                activeTasks.slice(0, 5).map(task => (
                  <div key={task.id} className="flex flex-col gap-1 p-3 bg-[#222] rounded-xl border border-[#333]">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full border-2 border-gray-500`} />
                      <span className="text-sm font-medium text-white truncate">{task.title}</span>
                    </div>
                    {task.subject && (
                      <div className="ml-6 flex items-center text-[10px] text-gray-500">
                        <span className="w-1.5 h-1.5 rounded-full mr-1" style={{ backgroundColor: task.subject.color }} />
                        {task.subject.name}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-gray-500 text-sm">
                  No active tasks! You're all caught up.
                </div>
              )}
            </div>
          </div>

          {/* Flashcards Widget */}
          <Link href="/flashcards" className="bg-gradient-to-br from-[#1a1a1a] to-[#222] border border-[#2a2a2a] hover:border-[#444] transition-all rounded-2xl p-5 shadow-lg group">
             <div className="flex justify-between items-start mb-4">
               <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl">
                 <Brain size={24} />
               </div>
               <span className="text-xs font-semibold bg-blue-500/20 text-blue-400 px-2.5 py-1 rounded-full">
                 {dueCards.length} Due
               </span>
             </div>
             <h3 className="font-semibold text-white mb-1">Daily Review</h3>
             <p className="text-sm text-gray-400">
               {dueCards.length > 0 ? `You have flashcards waiting in ${Array.from(new Set(dueCards.map(c => c.deckName))).length} decks.` : 'No cards due for review!'}
             </p>
          </Link>
        </div>

        {/* Middle Column */}
        <div className="space-y-6 flex flex-col">
          {/* Habits Status Widget */}
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl overflow-hidden flex flex-col shadow-lg">
            <div className="p-5 border-b border-[#222] flex items-center justify-between bg-[#16161a]">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Target size={18} className="text-emerald-400" />
                Today's Habits
              </h3>
              <Link href="/habits" className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 group">
                Manage <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
            <div className="p-5 space-y-4">
              {/* Progress Bar */}
              <div>
                <div className="flex justify-between text-xs mb-1.5 font-medium">
                  <span className="text-gray-400">Completion</span>
                  <span className="text-emerald-400">{habitCompletionPct}%</span>
                </div>
                <div className="h-2 bg-[#222] rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: `${habitCompletionPct}%` }} />
                </div>
              </div>

              {/* Habit List */}
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {todaysHabits.length > 0 ? (
                  todaysHabits.map(habit => (
                    <div key={habit.id} className="flex items-center justify-between p-3 bg-[#222] rounded-xl border border-[#333]">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{habit.icon}</span>
                        <span className="text-sm font-medium text-gray-200">{habit.name}</span>
                      </div>
                      <div className="flex items-center">
                        {habit.isCompleted ? (
                          <CheckCircle2 size={18} className="text-emerald-500" />
                        ) : (
                          <div className="text-xs text-gray-500 border border-[#444] px-2 py-0.5 rounded backdrop-blur bg-[#111]">
                            {habit.val} / {habit.target}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                   <div className="text-center py-6 text-gray-500 text-sm">
                    No habits set up yet.
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Calendar quick link */}
          <Link href="/calendar" className="bg-[#1a1a1a] border border-[#2a2a2a] hover:border-[#444] transition-all rounded-2xl p-5 shadow-lg flex items-center justify-between group">
            <div className="flex items-center gap-4">
               <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl">
                 <Calendar size={20} />
               </div>
               <div>
                  <h3 className="font-semibold text-white">Time Tracking</h3>
                  <p className="text-xs text-gray-400">Open your weekly calendar</p>
               </div>
            </div>
            <ArrowRight size={16} className="text-gray-500 group-hover:text-white transition-colors group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Right Column */}
        <div className="space-y-6 flex flex-col">
          {/* Daily Journal Status */}
          <Link href="/journal" className="bg-gradient-to-br from-[#1a1a1a] to-[#222] border border-[#2a2a2a] hover:border-[#444] transition-all rounded-2xl p-6 shadow-lg group">
             <div className="flex items-center gap-4 mb-4">
               <div className={`p-3 rounded-xl ${hasJournalToday ? 'bg-amber-500/10 text-amber-500' : 'bg-gray-800 text-gray-400'}`}>
                 <Book size={24} />
               </div>
               <div>
                  <h3 className="font-semibold text-white">Daily Journal</h3>
                  <p className="text-xs text-gray-400">{hasJournalToday ? 'Entry completed' : 'Pending entry'}</p>
               </div>
             </div>
             {hasJournalToday ? (
               <div className="text-sm text-emerald-400 flex items-center gap-2 bg-emerald-400/10 p-3 rounded-lg border border-emerald-400/20">
                 <CheckCircle2 size={16} /> You've logged today's journal!
               </div>
             ) : (
               <div className="text-sm text-amber-400 flex items-center gap-2 bg-amber-400/10 p-3 rounded-lg border border-amber-400/20">
                 <Zap size={16} /> Take 5 minutes to reflect on today.
               </div>
             )}
          </Link>

          {/* Quick Actions */}
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-5 shadow-lg">
            <h3 className="font-semibold text-white mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/notes" className="flex flex-col items-center justify-center gap-2 p-4 bg-[#222] hover:bg-[#2a2a2a] border border-[#333] hover:border-[#444] rounded-xl transition-all">
                 <Layers size={20} className="text-purple-400" />
                 <span className="text-xs font-medium text-gray-300">Notes</span>
              </Link>
              <Link href="/habits" className="flex flex-col items-center justify-center gap-2 p-4 bg-[#222] hover:bg-[#2a2a2a] border border-[#333] hover:border-[#444] rounded-xl transition-all">
                 <Moon size={20} className="text-indigo-400" />
                 <span className="text-xs font-medium text-gray-300">Log Sleep</span>
              </Link>
              <Link href="/resources" className="col-span-2 flex items-center justify-center gap-2 p-3 bg-[#222] hover:bg-[#2a2a2a] border border-[#333] hover:border-[#444] rounded-xl transition-all">
                 <span className="text-sm font-medium text-gray-300">Open Knowledge Map</span>
              </Link>
            </div>
          </div>
          
          {/* Note to the system: Render any existing widgets like GoalWidget here too if we want */}
        </div>

      </div>
    </div>
  );
}
