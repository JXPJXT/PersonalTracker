"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Timer,
  BookOpen,
  Palette,
  Settings,
  LayoutGrid,
  ListTodo,
  Layers,
  Moon,
  LogOut,
  BookMarked,
  Book,
  FileText,
  Calendar,
} from "lucide-react";
import { useTimerStore } from "@/lib/store";
import GoalWidget from "./GoalWidget";
import SettingsModal from "./SettingsModal";
import { useState } from "react";
import { useClerk } from "@clerk/nextjs";

export default function Sidebar({ 
  user,
  goals,
  initialTodayTime,
  initialWeekTime
}: { 
  user: { id: string; name: string };
  goals: any[];
  initialTodayTime: number;
  initialWeekTime: number;
}) {
  const pathname = usePathname();
  const store = useTimerStore();
  const [showSettings, setShowSettings] = useState(false);

  const userName = user?.name || "User";

  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[185px] bg-[#111] flex flex-col z-30 border-r border-[#2a2a2a]">
      {/* Logo / User */}
      <div className="p-4 pb-2">
        <div className="flex items-center gap-2 cursor-pointer group">
          <div className="w-8 h-8 rounded-full bg-[#7c3aed] flex items-center justify-center text-xs font-bold text-white">
            {initials}
          </div>
          <span className="text-sm font-medium text-white group-hover:text-purple-400 transition-colors truncate">
            {userName}
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto pt-2">
        {/* TRACK */}
        <div className="sidebar-section-label">Track</div>
        <Link
          href="/"
          className={`sidebar-item ${pathname === "/" ? "active" : ""}`}
        >
          <LayoutGrid size={16} />
          <span>Dashboard</span>
        </Link>
        <Link
          href="/calendar"
          className={`sidebar-item ${pathname === "/calendar" ? "active" : ""}`}
        >
          <Calendar size={16} />
          <span>Calendar</span>
        </Link>

        {/* ANALYZE */}
        <div className="sidebar-section-label mt-2">Analyze</div>
        <Link
          href="/reports"
          className={`sidebar-item ${pathname === "/reports" ? "active" : ""}`}
        >
          <BarChart3 size={16} />
          <span>Reports</span>
        </Link>

        {/* MANAGE */}
        <div className="sidebar-section-label mt-2">Manage</div>
        <Link
          href="/subjects"
          className={`sidebar-item ${pathname === "/subjects" ? "active" : ""}`}
        >
          <Palette size={16} />
          <span>Subjects</span>
        </Link>
        <Link
          href="/tasks"
          className={`sidebar-item ${pathname === "/tasks" ? "active" : ""}`}
        >
          <ListTodo size={16} />
          <span>Tasks</span>
        </Link>

        {/* LEARN */}
        <div className="sidebar-section-label mt-2">Learn</div>
        <Link
          href="/notes"
          className={`sidebar-item ${pathname?.startsWith("/notes") ? "active" : ""}`}
        >
          <FileText size={16} />
          <span>Notes</span>
        </Link>
        <Link
          href="/flashcards"
          className={`sidebar-item ${pathname === "/flashcards" ? "active" : ""}`}
        >
          <Layers size={16} />
          <span>Flashcards</span>
        </Link>
        <Link
          href="/resources"
          className={`sidebar-item ${pathname === "/resources" ? "active" : ""}`}
        >
          <BookMarked size={16} />
          <span>Resources</span>
        </Link>

        {/* LIFE */}
        <div className="sidebar-section-label mt-2">Life</div>
        <Link
          href="/journal"
          className={`sidebar-item ${pathname === "/journal" ? "active" : ""}`}
        >
          <Book size={16} />
          <span>Journal</span>
        </Link>
        <Link
          href="/habits"
          className={`sidebar-item ${pathname === "/habits" ? "active" : ""}`}
        >
          <Moon size={16} />
          <span>Sleep</span>
        </Link>
        
        {/* GOALS */}
        {user?.id && (
          <GoalWidget 
            userId={user.id} 
            initialGoals={goals}
            initialTodayTime={initialTodayTime}
            initialWeekTime={initialWeekTime}
          />
        )}
      </nav>

      {/* Bottom */}
      <div className="border-t border-[#2a2a2a] p-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-[#333] flex items-center justify-center text-xs font-medium text-white">
            {initials}
          </div>
          <span className="text-xs text-gray-400 truncate flex-1">{userName}</span>
          <Settings 
            size={14} 
            className="text-gray-500 cursor-pointer hover:text-white transition-colors" 
            onClick={() => setShowSettings(true)}
          />
          <LogOut
            id="logout-btn"
            size={14}
            className="text-gray-500 cursor-pointer hover:text-red-400 transition-colors"
            onClick={() => signOut()}
          />
        </div>
      </div>

      {showSettings && user?.id && (
        <SettingsModal userId={user.id} onClose={() => setShowSettings(false)} />
      )}
    </aside>
  );
}

