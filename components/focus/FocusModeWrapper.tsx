"use client";

import { useTimerStore } from "@/lib/store";
import FocusModeOverlay from "./FocusModeOverlay";

interface Subject {
  id: string;
  name: string;
  color: string;
}

export default function FocusModeWrapper({
  subjects,
}: {
  subjects: Subject[];
}) {
  const store = useTimerStore();

  if (!store.focusModeActive || !store.isRunning) return null;

  const selectedSubject = subjects.find((s) => s.id === store.subjectId);

  return (
    <FocusModeOverlay
      subjectName={selectedSubject?.name}
      subjectColor={selectedSubject?.color}
    />
  );
}
