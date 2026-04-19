"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface TimerState {
  isRunning: boolean;
  startedAt: number | null;
  subjectId: string | null;
  description: string;
  tempEntryId: number | null;
  start: (entryId: number, description: string, subjectId: string | null) => void;
  stop: () => void;
  setDescription: (description: string) => void;
  setSubjectId: (subjectId: string | null) => void;
  reset: () => void;
}

export const useTimerStore = create<TimerState>()(
  persist(
    (set) => ({
      isRunning: false,
      startedAt: null,
      subjectId: null,
      description: "",
      tempEntryId: null,
      start: (entryId, description, subjectId) =>
        set({
          isRunning: true,
          startedAt: Date.now(),
          tempEntryId: entryId,
          description,
          subjectId,
        }),
      stop: () =>
        set({
          isRunning: false,
          startedAt: null,
          tempEntryId: null,
          description: "",
          subjectId: null,
        }),
      setDescription: (description) => set({ description }),
      setSubjectId: (subjectId) => set({ subjectId }),
      reset: () =>
        set({
          isRunning: false,
          startedAt: null,
          tempEntryId: null,
          description: "",
          subjectId: null,
        }),
    }),
    {
      name: "study-timer",
    }
  )
);
