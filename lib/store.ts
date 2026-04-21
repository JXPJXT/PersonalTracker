"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface TimerState {
  isRunning: boolean;
  startedAt: number | null;
  subjectId: string | null;
  description: string;
  tempEntryId: number | null;
  // Focus Mode
  focusModeActive: boolean;
  focusModeStartedAt: number | null;
  start: (entryId: number, description: string, subjectId: string | null) => void;
  stop: () => void;
  setDescription: (description: string) => void;
  setSubjectId: (subjectId: string | null) => void;
  reset: () => void;
  enableFocusMode: () => void;
  disableFocusMode: () => void;
  // Pomodoro Mode
  pomodoroActive: boolean;
  pomodoroPhase: "work" | "break";
  pomodoroWorkTime: number; // in minutes
  pomodoroBreakTime: number; // in minutes
  togglePomodoro: () => void;
  setPomodoroTimes: (work: number, breakTime: number) => void;
  setPomodoroPhase: (phase: "work" | "break") => void;
}

export const useTimerStore = create<TimerState>()(
  persist(
    (set) => ({
      isRunning: false,
      startedAt: null,
      subjectId: null,
      description: "",
      tempEntryId: null,
      focusModeActive: false,
      focusModeStartedAt: null,
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
          focusModeActive: false,
          focusModeStartedAt: null,
          pomodoroPhase: "work",
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
          focusModeActive: false,
          focusModeStartedAt: null,
        }),
      enableFocusMode: () =>
        set({
          focusModeActive: true,
          focusModeStartedAt: Date.now(),
        }),
      disableFocusMode: () =>
        set({
          focusModeActive: false,
          focusModeStartedAt: null,
        }),
      pomodoroActive: false,
      pomodoroPhase: "work",
      pomodoroWorkTime: 25,
      pomodoroBreakTime: 5,
      togglePomodoro: () => set((state) => ({ pomodoroActive: !state.pomodoroActive })),
      setPomodoroTimes: (work, breakTime) => set({ pomodoroWorkTime: work, pomodoroBreakTime: breakTime }),
      setPomodoroPhase: (phase) => set({ pomodoroPhase: phase }),
    }),
    {
      name: "study-timer",
    }
  )
);
