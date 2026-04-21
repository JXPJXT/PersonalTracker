"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// ─── User (HARDCODED — no login required) ──────────────────────

const HARDCODED_USER = {
  name: "jxpjxt",
  email: "bhatiajapjotjpr@gmail.com",
};

export async function getUser() {
  // Always return the hardcoded user, auto-create if DB is empty
  let user = await prisma.user.findFirst({
    where: { email: HARDCODED_USER.email },
    include: { subjects: true },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        name: HARDCODED_USER.name,
        email: HARDCODED_USER.email,
        subjects: {
          create: [
            { name: "Mathematics", color: "#7c3aed" },
            { name: "Physics", color: "#2563eb" },
            { name: "Chemistry", color: "#16a34a" },
            { name: "Programming", color: "#ea580c" },
          ],
        },
      },
      include: { subjects: true },
    });
  }

  return user; // This ALWAYS returns a user — never null
}

// ─── Subjects ──────────────────────────────────────────────────

export async function getSubjects(userId: string) {
  return prisma.subject.findMany({
    where: { userId },
    include: {
      _count: { select: { entries: true } },
    },
  });
}

export async function createSubject(
  userId: string,
  name: string,
  color: string
) {
  const subject = await prisma.subject.create({
    data: { name, color, userId },
  });
  revalidatePath("/");
  revalidatePath("/subjects");
  return subject;
}

export async function updateSubject(
  id: string,
  name: string,
  color: string
) {
  const subject = await prisma.subject.update({
    where: { id },
    data: { name, color },
  });
  revalidatePath("/");
  revalidatePath("/subjects");
  return subject;
}

export async function deleteSubject(id: string) {
  await prisma.timeEntry.updateMany({
    where: { subjectId: id },
    data: { subjectId: null },
  });
  await prisma.task.updateMany({
    where: { subjectId: id },
    data: { subjectId: null },
  });
  await prisma.subject.delete({ where: { id } });
  revalidatePath("/");
  revalidatePath("/subjects");
}

// ─── Time Entries ──────────────────────────────────────────────

export async function getEntriesForWeek(
  userId: string,
  weekStart: string,
  weekEnd: string
) {
  return prisma.timeEntry.findMany({
    where: {
      userId,
      start: {
        gte: new Date(weekStart),
        lte: new Date(weekEnd),
      },
    },
    include: { subject: true },
    orderBy: { start: "asc" },
  });
}

export async function getAllEntries(userId: string) {
  return prisma.timeEntry.findMany({
    where: { userId, stop: { not: null } },
    include: { subject: true },
    orderBy: { start: "desc" },
  });
}

export async function createTimeEntry(data: {
  description: string;
  start: string;
  stop: string | null;
  subjectId: string | null;
  userId: string;
  notes?: string;
}) {
  const startDate = new Date(data.start);
  const stopDate = data.stop ? new Date(data.stop) : null;
  const durationInSeconds = stopDate
    ? Math.floor((stopDate.getTime() - startDate.getTime()) / 1000)
    : null;

  const entry = await prisma.timeEntry.create({
    data: {
      description: data.description,
      notes: data.notes || "",
      start: startDate,
      stop: stopDate,
      durationInSeconds,
      subjectId: data.subjectId,
      userId: data.userId,
    },
  });
  revalidatePath("/");
  return entry;
}

export async function updateTimeEntry(
  id: number,
  data: {
    description?: string;
    notes?: string;
    start?: string;
    stop?: string;
    subjectId?: string | null;
  }
) {
  const updateData: Record<string, unknown> = {};
  if (data.description !== undefined) updateData.description = data.description;
  if (data.notes !== undefined) updateData.notes = data.notes;
  if (data.subjectId !== undefined) updateData.subjectId = data.subjectId;
  if (data.start) updateData.start = new Date(data.start);
  if (data.stop) {
    updateData.stop = new Date(data.stop);
    const entry = await prisma.timeEntry.findUnique({ where: { id } });
    if (entry) {
      const startTime = data.start
        ? new Date(data.start).getTime()
        : entry.start.getTime();
      updateData.durationInSeconds = Math.floor(
        (new Date(data.stop).getTime() - startTime) / 1000
      );
    }
  }

  const entry = await prisma.timeEntry.update({
    where: { id },
    data: updateData,
  });
  revalidatePath("/");
  return entry;
}

export async function stopTimerEntry(id: number) {
  const now = new Date();
  const entry = await prisma.timeEntry.findUnique({ where: { id } });
  if (!entry) return null;

  const durationInSeconds = Math.floor(
    (now.getTime() - entry.start.getTime()) / 1000
  );

  const updated = await prisma.timeEntry.update({
    where: { id },
    data: {
      stop: now,
      durationInSeconds,
    },
  });
  revalidatePath("/");
  return updated;
}

export async function deleteTimeEntry(id: number) {
  await prisma.timeEntry.delete({ where: { id } });
  revalidatePath("/");
}

// ─── Tasks ─────────────────────────────────────────────────────

export async function getTasks(userId: string) {
  return prisma.task.findMany({
    where: { userId },
    include: {
      subject: true,
      sessionLinks: {
        include: {
          timeEntry: { include: { subject: true } },
        },
      },
    },
    orderBy: [
      { completed: "asc" },
      { priority: "asc" }, // HIGH < LOW < MEDIUM alphabetically, we'll sort client-side
      { dueDate: "asc" },
      { createdAt: "desc" },
    ],
  });
}

export async function createTask(data: {
  title: string;
  description?: string;
  priority: string;
  dueDate: string | null;
  subjectId: string | null;
  userId: string;
  autoCompleteHours?: number | null;
}) {
  const task = await prisma.task.create({
    data: {
      title: data.title,
      description: data.description || "",
      priority: data.priority,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      subjectId: data.subjectId,
      userId: data.userId,
      autoCompleteHours: data.autoCompleteHours ?? null,
    },
  });
  revalidatePath("/tasks");
  return task;
}

export async function updateTask(
  id: string,
  data: {
    title?: string;
    description?: string;
    priority?: string;
    dueDate?: string | null;
    completed?: boolean;
    subjectId?: string | null;
    autoCompleteHours?: number | null;
  }
) {
  const updateData: Record<string, unknown> = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.priority !== undefined) updateData.priority = data.priority;
  if (data.subjectId !== undefined) updateData.subjectId = data.subjectId;
  if (data.autoCompleteHours !== undefined) updateData.autoCompleteHours = data.autoCompleteHours;
  if (data.dueDate !== undefined) {
    updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
  }
  if (data.completed !== undefined) {
    updateData.completed = data.completed;
    updateData.completedAt = data.completed ? new Date() : null;
  }

  const task = await prisma.task.update({
    where: { id },
    data: updateData,
  });
  revalidatePath("/tasks");
  return task;
}

export async function deleteTask(id: string) {
  await prisma.task.delete({ where: { id } });
  revalidatePath("/tasks");
}

// ─── Task ↔ Session Linking ────────────────────────────────────

export async function linkTaskToSession(taskId: string, timeEntryId: number) {
  const link = await prisma.taskSessionLink.create({
    data: { taskId, timeEntryId },
  });

  // Check auto-complete: sum all linked session durations for this task
  await checkAutoComplete(taskId);

  revalidatePath("/tasks");
  revalidatePath("/");
  return link;
}

export async function unlinkTaskFromSession(taskId: string, timeEntryId: number) {
  await prisma.taskSessionLink.deleteMany({
    where: { taskId, timeEntryId },
  });
  revalidatePath("/tasks");
  revalidatePath("/");
}

export async function getTasksForSession(timeEntryId: number) {
  const links = await prisma.taskSessionLink.findMany({
    where: { timeEntryId },
    include: { task: { include: { subject: true } } },
  });
  return links.map((l) => l.task);
}

export async function getTimeForTask(taskId: string) {
  const links = await prisma.taskSessionLink.findMany({
    where: { taskId },
    include: { timeEntry: true },
  });
  const totalSeconds = links.reduce(
    (sum, l) => sum + (l.timeEntry.durationInSeconds || 0),
    0
  );
  return totalSeconds;
}

async function checkAutoComplete(taskId: string) {
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task || task.completed || !task.autoCompleteHours) return;

  const totalSeconds = await getTimeForTask(taskId);
  const totalHours = totalSeconds / 3600;

  if (totalHours >= task.autoCompleteHours) {
    await prisma.task.update({
      where: { id: taskId },
      data: { completed: true, completedAt: new Date() },
    });
  }
}

// ─── Flashcard Decks ───────────────────────────────────────────

export async function getFlashcardDecks(userId: string) {
  return prisma.flashcardDeck.findMany({
    where: { userId },
    include: {
      cards: { orderBy: { createdAt: "asc" } },
      subject: true,
      _count: { select: { cards: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createFlashcardDeck(data: {
  name: string;
  subjectId: string | null;
  userId: string;
}) {
  const deck = await prisma.flashcardDeck.create({
    data: {
      name: data.name,
      subjectId: data.subjectId,
      userId: data.userId,
    },
  });
  revalidatePath("/flashcards");
  return deck;
}

export async function deleteFlashcardDeck(id: string) {
  await prisma.flashcardDeck.delete({ where: { id } });
  revalidatePath("/flashcards");
}

// ─── Flashcards ────────────────────────────────────────────────

export async function createFlashcard(data: {
  front: string;
  back: string;
  deckId: string;
}) {
  const card = await prisma.flashcard.create({
    data: {
      front: data.front,
      back: data.back,
      deckId: data.deckId,
    },
  });
  revalidatePath("/flashcards");
  return card;
}

export async function updateFlashcard(
  id: string,
  data: { front?: string; back?: string }
) {
  const card = await prisma.flashcard.update({
    where: { id },
    data,
  });
  revalidatePath("/flashcards");
  return card;
}

export async function deleteFlashcard(id: string) {
  await prisma.flashcard.delete({ where: { id } });
  revalidatePath("/flashcards");
}

// Spaced Repetition: SM-2 Algorithm
export async function reviewFlashcard(id: string, quality: number) {
  // quality: 0-5 (0=forgot, 5=perfect recall)
  const card = await prisma.flashcard.findUnique({ where: { id } });
  if (!card) return null;

  let { ease, interval, repetitions } = card;

  if (quality >= 3) {
    // Correct response
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * ease);
    }
    repetitions += 1;
  } else {
    // Incorrect response - reset
    repetitions = 0;
    interval = 1;
  }

  // Update ease factor (SM-2 formula)
  ease = ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (ease < 1.3) ease = 1.3;

  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + interval);

  const updated = await prisma.flashcard.update({
    where: { id },
    data: {
      ease,
      interval,
      repetitions,
      nextReview,
      lastReview: new Date(),
    },
  });

  revalidatePath("/flashcards");
  return updated;
}

export async function getDueFlashcards(userId: string) {
  const now = new Date();
  return prisma.flashcard.findMany({
    where: {
      deck: { userId },
      nextReview: { lte: now },
    },
    include: { deck: { include: { subject: true } } },
    orderBy: { nextReview: "asc" },
  });
}

// ─── Smart Suggestions ────────────────────────────────────────

export async function getSmartSuggestions(userId: string) {
  const suggestions: Array<{
    id: string;
    type: "neglected_subject" | "best_time" | "streak_risk";
    icon: string;
    title: string;
    message: string;
    actionLabel?: string;
    actionData?: Record<string, string>;
  }> = [];

  const now = new Date();
  const subjects = await prisma.subject.findMany({ where: { userId } });
  const entries = await prisma.timeEntry.findMany({
    where: { userId, stop: { not: null } },
    include: { subject: true },
    orderBy: { start: "desc" },
  });

  // 1. Neglected subjects - haven't studied in X days
  for (const subject of subjects) {
    const lastEntry = entries.find((e) => e.subjectId === subject.id);
    if (lastEntry) {
      const daysSince = Math.floor(
        (now.getTime() - new Date(lastEntry.start).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSince >= 3) {
        suggestions.push({
          id: `neglect-${subject.id}`,
          type: "neglected_subject",
          icon: "📚",
          title: `${subject.name} needs attention`,
          message: `You haven't studied ${subject.name} in ${daysSince} days. Time to review!`,
          actionLabel: "Start session",
          actionData: { subjectId: subject.id, subjectName: subject.name },
        });
      }
    } else if (entries.length > 0) {
      // Subject exists but has never been studied
      suggestions.push({
        id: `neglect-${subject.id}`,
        type: "neglected_subject",
        icon: "🆕",
        title: `Start studying ${subject.name}`,
        message: `You haven't logged any sessions for ${subject.name} yet.`,
        actionLabel: "Start session",
        actionData: { subjectId: subject.id, subjectName: subject.name },
      });
    }
  }

  // 2. Best study time analysis
  if (entries.length >= 5) {
    const hourBuckets: Record<number, { total: number; count: number }> = {};
    for (const entry of entries) {
      const hour = new Date(entry.start).getHours();
      if (!hourBuckets[hour]) hourBuckets[hour] = { total: 0, count: 0 };
      hourBuckets[hour].total += entry.durationInSeconds || 0;
      hourBuckets[hour].count += 1;
    }

    // Find the 2-hour window with the most productive time
    let bestStart = 9;
    let bestTotal = 0;
    for (let h = 5; h < 22; h++) {
      const total =
        (hourBuckets[h]?.total || 0) +
        (hourBuckets[h + 1]?.total || 0);
      if (total > bestTotal) {
        bestTotal = total;
        bestStart = h;
      }
    }

    if (bestTotal > 0) {
      const formatHour = (h: number) => {
        const ampm = h >= 12 ? "PM" : "AM";
        const hour12 = h % 12 || 12;
        return `${hour12} ${ampm}`;
      };
      suggestions.push({
        id: "best-time",
        type: "best_time",
        icon: "⏰",
        title: "Your peak study hours",
        message: `You study best between ${formatHour(bestStart)}–${formatHour(bestStart + 2)}. Consider blocking this time daily!`,
      });
    }
  }

  // 3. Streak risk
  const todayEntries = entries.filter((e) => {
    const entryDate = new Date(e.start);
    return (
      entryDate.getDate() === now.getDate() &&
      entryDate.getMonth() === now.getMonth() &&
      entryDate.getFullYear() === now.getFullYear()
    );
  });

  if (todayEntries.length === 0 && entries.length > 0) {
    // Check if there was a streak going
    let streakCount = 0;
    const checkDate = new Date(now);
    checkDate.setDate(checkDate.getDate() - 1);
    while (true) {
      const dayEntries = entries.filter((e) => {
        const d = new Date(e.start);
        return (
          d.getDate() === checkDate.getDate() &&
          d.getMonth() === checkDate.getMonth() &&
          d.getFullYear() === checkDate.getFullYear()
        );
      });
      if (dayEntries.length > 0) {
        streakCount++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    if (streakCount >= 2) {
      suggestions.push({
        id: "streak-risk",
        type: "streak_risk",
        icon: "🔥",
        title: `Protect your ${streakCount}-day streak!`,
        message: `You haven't studied today yet. Start a quick session to keep your streak alive!`,
        actionLabel: "Start now",
      });
    }
  }

  return suggestions;
}

// ─── Goals ─────────────────────────────────────────────────────

export async function getGoals(userId: string) {
  return prisma.goal.findMany({ where: { userId } });
}

export async function updateGoal(userId: string, type: "DAILY" | "WEEKLY", targetHours: number) {
  const goal = await prisma.goal.upsert({
    where: { userId_type: { userId, type } },
    update: { targetHours },
    create: { userId, type, targetHours },
  });
  revalidatePath("/");
  return goal;
}

export async function getTodayStudyTime(userId: string) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const entries = await prisma.timeEntry.findMany({
    where: {
      userId,
      start: { gte: startOfDay },
    },
  });

  return entries.reduce((acc, e) => {
    let dur = e.durationInSeconds || 0;
    if (!e.stop) {
      dur = Math.floor((new Date().getTime() - new Date(e.start).getTime()) / 1000);
    }
    return acc + dur;
  }, 0);
}

export async function getWeekStudyTime(userId: string) {
  const startOfWeek = new Date();
  const day = startOfWeek.getDay();
  // Usually Mon-Sun week
  const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
  startOfWeek.setDate(diff);
  startOfWeek.setHours(0, 0, 0, 0);

  const entries = await prisma.timeEntry.findMany({
    where: {
      userId,
      start: { gte: startOfWeek },
    },
  });

  return entries.reduce((acc, e) => {
    let dur = e.durationInSeconds || 0;
    if (!e.stop) {
      dur = Math.floor((new Date().getTime() - new Date(e.start).getTime()) / 1000);
    }
    return acc + dur;
  }, 0);
}

// ─── Export / Import ──────────────────────────────────────────

export async function exportData(userId: string) {
  const [subjects, entries, tasks, decks] = await Promise.all([
    prisma.subject.findMany({ where: { userId } }),
    prisma.timeEntry.findMany({ where: { userId } }),
    prisma.task.findMany({ where: { userId } }),
    prisma.flashcardDeck.findMany({ 
      where: { userId },
      include: { cards: true } 
    }),
  ]);
  
  return {
    exportDate: new Date().toISOString(),
    version: "1.0",
    data: {
      subjects,
      entries,
      tasks,
      decks
    }
  };
}

// ─── Sleep/Wake Tracking ──────────────────────────────────────

export async function getSleepLogs(userId: string, limit = 30) {
  return prisma.sleepLog.findMany({
    where: { userId },
    orderBy: { date: "desc" },
    take: limit,
  });
}

export async function getSleepLogForDate(userId: string, date: string) {
  return prisma.sleepLog.findUnique({
    where: { userId_date: { userId, date } },
  });
}

export async function upsertSleepLog(data: {
  userId: string;
  date: string;
  wakeTime: string;
  sleepTime: string;
  quality: number;
  notes?: string;
}) {
  const log = await prisma.sleepLog.upsert({
    where: { userId_date: { userId: data.userId, date: data.date } },
    update: {
      wakeTime: data.wakeTime,
      sleepTime: data.sleepTime,
      quality: data.quality,
      notes: data.notes || "",
    },
    create: {
      userId: data.userId,
      date: data.date,
      wakeTime: data.wakeTime,
      sleepTime: data.sleepTime,
      quality: data.quality,
      notes: data.notes || "",
    },
  });
  revalidatePath("/habits");
  return log;
}

export async function deleteSleepLog(id: string) {
  await prisma.sleepLog.delete({ where: { id } });
  revalidatePath("/habits");
}

// ─── Resources ────────────────────────────────────────────────

export async function getResources(userId: string) {
  return prisma.resource.findMany({
    where: { userId },
    include: {
      subject: true,
      linksFrom: { include: { toResource: { include: { subject: true } } } },
      linksTo: { include: { fromResource: { include: { subject: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createResource(data: {
  title: string;
  url?: string;
  description?: string;
  tags?: string;
  subjectId?: string | null;
  userId: string;
}) {
  const resource = await prisma.resource.create({
    data: {
      title: data.title,
      url: data.url || "",
      description: data.description || "",
      tags: data.tags || "",
      subjectId: data.subjectId || null,
      userId: data.userId,
    },
  });
  revalidatePath("/resources");
  return resource;
}

export async function updateResource(
  id: string,
  data: {
    title?: string;
    url?: string;
    description?: string;
    tags?: string;
    subjectId?: string | null;
  }
) {
  const updateData: Record<string, unknown> = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.url !== undefined) updateData.url = data.url;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.tags !== undefined) updateData.tags = data.tags;
  if (data.subjectId !== undefined) updateData.subjectId = data.subjectId;

  const resource = await prisma.resource.update({
    where: { id },
    data: updateData,
  });
  revalidatePath("/resources");
  return resource;
}

export async function deleteResource(id: string) {
  await prisma.resource.delete({ where: { id } });
  revalidatePath("/resources");
}

export async function linkResources(fromId: string, toId: string, label = "") {
  const link = await prisma.resourceLink.create({
    data: { fromResourceId: fromId, toResourceId: toId, label },
  });
  revalidatePath("/resources");
  return link;
}

export async function unlinkResources(fromId: string, toId: string) {
  await prisma.resourceLink.deleteMany({
    where: { fromResourceId: fromId, toResourceId: toId },
  });
  revalidatePath("/resources");
}

// ─── Daily Journal ─────────────────────────────────────────────

export async function getDailyLogs(userId: string) {
  return prisma.dailyLog.findMany({
    where: { userId },
    orderBy: { date: "desc" },
  });
}

export async function upsertDailyLog(data: {
  userId: string;
  date: string;
  content: string;
  mood: number;
  productivity: number;
  highlights: string;
  improvements: string;
  gratitude: string;
}) {
  const log = await prisma.dailyLog.upsert({
    where: { userId_date: { userId: data.userId, date: data.date } },
    update: {
      content: data.content,
      mood: data.mood,
      productivity: data.productivity,
      highlights: data.highlights,
      improvements: data.improvements,
      gratitude: data.gratitude,
    },
    create: {
      userId: data.userId,
      date: data.date,
      content: data.content,
      mood: data.mood,
      productivity: data.productivity,
      highlights: data.highlights,
      improvements: data.improvements,
      gratitude: data.gratitude,
    },
  });
  revalidatePath("/journal");
  return log;
}

// ─── Habit Tracking ────────────────────────────────────────────

export async function getHabits(userId: string) {
  return prisma.habit.findMany({
    where: { userId, archived: false },
    include: {
      entries: {
        where: {
          date: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
              .toISOString()
              .slice(0, 10), // Last 30 days
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function createHabit(data: {
  userId: string;
  name: string;
  icon: string;
  color: string;
  target: number;
  unit: string;
}) {
  const habit = await prisma.habit.create({
    data: {
      userId: data.userId,
      name: data.name,
      icon: data.icon,
      color: data.color,
      target: data.target,
      unit: data.unit,
    },
  });
  revalidatePath("/habits");
  return habit;
}

export async function updateHabit(
  id: string,
  data: Partial<Omit<Parameters<typeof createHabit>[0], "userId">>
) {
  const habit = await prisma.habit.update({
    where: { id },
    data,
  });
  revalidatePath("/habits");
  return habit;
}

export async function archiveHabit(id: string) {
  await prisma.habit.update({
    where: { id },
    data: { archived: true },
  });
  revalidatePath("/habits");
}

export async function logHabitEntry(habitId: string, date: string, value: number) {
  const entry = await prisma.habitEntry.upsert({
    where: { habitId_date: { habitId, date } },
    update: { value },
    create: { habitId, date, value },
  });
  revalidatePath("/habits");
  return entry;
}

// ─── Notion-Style Notes ────────────────────────────────────────

export async function getNotes(userId: string) {
  return prisma.note.findMany({
    where: { userId },
    include: {
      children: true, // Just to know if it has children
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getNoteById(id: string) {
  return prisma.note.findUnique({
    where: { id },
    include: {
      parent: true,
      children: {
        orderBy: { updatedAt: "desc" },
      },
    },
  });
}

export async function createNote(data: {
  userId: string;
  title?: string;
  parentId?: string;
}) {
  const note = await prisma.note.create({
    data: {
      userId: data.userId,
      title: data.title || "Untitled",
      content: "[]",
      parentId: data.parentId,
    },
  });
  revalidatePath("/notes");
  return note;
}

export async function updateNote(
  id: string,
  data: Partial<{
    title: string;
    icon: string;
    cover: string;
    content: string;
    parentId: string | null;
  }>
) {
  const note = await prisma.note.update({
    where: { id },
    data,
  });
  revalidatePath("/notes");
  return note;
}

export async function deleteNote(id: string) {
  await prisma.note.delete({
    where: { id },
  });
  revalidatePath("/notes");
}

