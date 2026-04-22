"use client";

import { useState, useEffect } from "react";
import { getSmartSuggestions } from "@/lib/actions";
import { useTimerStore } from "@/lib/store";
import { Lightbulb, X, ChevronRight, Sparkles } from "lucide-react";

interface Suggestion {
  id: string;
  type: "neglected_subject" | "best_time" | "streak_risk";
  icon: string;
  title: string;
  message: string;
  actionLabel?: string;
  actionData?: Record<string, string>;
}

interface SmartSuggestionsProps {
  userId: string;
}

export default function SmartSuggestions({ userId }: SmartSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const store = useTimerStore();

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getSmartSuggestions(userId);
        setSuggestions(data);
      } catch (err) {
        console.error("Failed to load suggestions:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userId]);

  const handleDismiss = (id: string) => {
    setDismissed((prev) => new Set(prev).add(id));
  };

  const handleAction = (suggestion: Suggestion) => {
    if (suggestion.actionData?.subjectId) {
      store.setSubjectId(suggestion.actionData.subjectId);
      store.setDescription(
        `${suggestion.actionData.subjectName || "Study"} session`
      );
      // Focus input
      document.getElementById("timer-description-input")?.focus();
    }
  };

  const visible = suggestions.filter((s) => !dismissed.has(s.id));

  if (loading || visible.length === 0) return null;

  const typeColors = {
    neglected_subject: {
      bg: "bg-amber-500/5",
      border: "border-amber-500/20",
      accent: "text-amber-400",
      actionBg: "bg-amber-500/10 hover:bg-amber-500/20 text-amber-400",
    },
    best_time: {
      bg: "bg-blue-500/5",
      border: "border-blue-500/20",
      accent: "text-blue-400",
      actionBg: "bg-blue-500/10 hover:bg-blue-500/20 text-blue-400",
    },
    streak_risk: {
      bg: "bg-red-500/5",
      border: "border-red-500/20",
      accent: "text-red-400",
      actionBg: "bg-red-500/10 hover:bg-red-500/20 text-red-400",
    },
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
        <Sparkles size={12} className="text-[#7c3aed]" />
        <span className="font-medium">Smart Suggestions</span>
      </div>
      {visible.slice(0, 3).map((suggestion) => {
        const colors = typeColors[suggestion.type];
        return (
          <div
            key={suggestion.id}
            className={`${colors.bg} border ${colors.border} rounded-xl p-3 flex items-start gap-3 group transition-all`}
          >
            <span className="text-lg mt-0.5 shrink-0">{suggestion.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white">
                {suggestion.title}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                {suggestion.message}
              </p>
              {suggestion.actionLabel && (
                <button
                  onClick={() => handleAction(suggestion)}
                  className={`mt-2 flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs transition-all ${colors.actionBg}`}
                >
                  {suggestion.actionLabel}
                  <ChevronRight size={12} />
                </button>
              )}
            </div>
            <button
              onClick={() => handleDismiss(suggestion.id)}
              className="p-1 hover:bg-white/10 rounded opacity-0 group-hover:opacity-100 transition-all shrink-0"
            >
              <X size={12} className="text-gray-500" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
