"use client";

import { useState, useEffect } from "react";
import { updateGoal } from "@/lib/actions";
import { useTimerStore } from "@/lib/store";
import { Edit2, Check, X } from "lucide-react";

interface Goal {
  id: string;
  type: string;
  targetHours: number;
}

export default function GoalWidget({
  userId,
  initialGoals,
  initialTodayTime,
  initialWeekTime
}: {
  userId: string;
  initialGoals: Goal[];
  initialTodayTime: number;
  initialWeekTime: number;
}) {
  const [goals, setGoals] = useState(initialGoals);
  const [isEditingDaily, setIsEditingDaily] = useState(false);
  const [editDailyHours, setEditDailyHours] = useState("");
  
  const dailyGoal = goals.find(g => g.type === "DAILY")?.targetHours || 4; // Default 4 hrs
  const weeklyGoal = goals.find(g => g.type === "WEEKLY")?.targetHours || 20;

  // Real-time tracking if timer is running
  const store = useTimerStore();
  const [activeSessionTime, setActiveSessionTime] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (store.isRunning && store.startedAt) {
      interval = setInterval(() => {
        setActiveSessionTime(Math.floor((Date.now() - store.startedAt!) / 1000));
      }, 1000);
    } else {
      setActiveSessionTime(0);
    }
    return () => clearInterval(interval);
  }, [store.isRunning, store.startedAt]);

  const currentTodayTime = initialTodayTime + activeSessionTime;
  const currentWeekTime = initialWeekTime + activeSessionTime;

  const todayHours = currentTodayTime / 3600;
  const weekHours = currentWeekTime / 3600;

  const dailyProgress = Math.min((todayHours / dailyGoal) * 100, 100);
  const weeklyProgress = Math.min((weekHours / weeklyGoal) * 100, 100);

  const handleSaveDaily = async () => {
    const hrs = parseFloat(editDailyHours);
    if (!isNaN(hrs) && hrs > 0) {
      const g = await updateGoal(userId, "DAILY", hrs);
      setGoals(prev => {
        const filtered = prev.filter(p => p.type !== "DAILY");
        return [...filtered, g as Goal];
      });
    }
    setIsEditingDaily(false);
  };

  const handleSaveWeekly = async (hrs: number) => {
    if (!isNaN(hrs) && hrs > 0) {
      const g = await updateGoal(userId, "WEEKLY", hrs);
      setGoals(prev => {
        const filtered = prev.filter(p => p.type !== "WEEKLY");
        return [...filtered, g as Goal];
      });
    }
  };

  return (
    <div className="px-3 py-2 mt-2">
      <div className="bg-[#1a1a1a] rounded-xl p-3 border border-[#2a2a2a]">
        
        {/* Daily Goal */}
        <div className="mb-3">
          <div className="flex justify-between items-center mb-1.5 group">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              Daily Goal
            </span>
            {!isEditingDaily ? (
              <button 
                onClick={() => {
                  setEditDailyHours(dailyGoal.toString());
                  setIsEditingDaily(true);
                }}
                className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-white transition-opacity"
              >
                <Edit2 size={12} />
              </button>
            ) : null}
          </div>

          {isEditingDaily ? (
            <div className="flex items-center gap-1 mb-2">
              <input 
                type="number" 
                value={editDailyHours}
                onChange={e => setEditDailyHours(e.target.value)}
                className="w-12 bg-[#2a2a2a] text-white text-xs px-1.5 py-1 rounded outline-none border border-[#3a3a3a]"
                autoFocus
              />
              <span className="text-xs text-gray-400 mr-1">h</span>
              <button onClick={handleSaveDaily} className="p-1 text-green-400 hover:bg-green-400/20 rounded">
                <Check size={12} />
              </button>
              <button onClick={() => setIsEditingDaily(false)} className="p-1 text-red-400 hover:bg-red-400/20 rounded">
                <X size={12} />
              </button>
            </div>
          ) : (
            <div className="flex justify-between items-end mb-1.5">
              <span className="text-sm font-medium text-white">
                {todayHours.toFixed(1)} <span className="text-gray-500 text-xs">/ {dailyGoal}h</span>
              </span>
              <span className="text-[10px] text-purple-400 font-bold">{Math.floor(dailyProgress)}%</span>
            </div>
          )}
          <div className="h-1.5 w-full bg-[#2a2a2a] rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-purple-600 to-indigo-500 rounded-full transition-all duration-500" 
              style={{ width: `${dailyProgress}%` }}
            />
          </div>
        </div>

        {/* Weekly Goal */}
        <div>
          <div className="flex justify-between items-end mb-1.5 mt-3">
            <span className="text-sm font-medium text-white">
              {weekHours.toFixed(1)} <span className="text-gray-500 text-xs">/ {weeklyGoal}h</span>
            </span>
            <span className="text-[10px] text-blue-400 font-bold">{Math.floor(weeklyProgress)}%</span>
          </div>
          <div className="h-1.5 w-full bg-[#2a2a2a] rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full transition-all duration-500" 
              style={{ width: `${weeklyProgress}%` }}
            />
          </div>
        </div>

      </div>
    </div>
  );
}
