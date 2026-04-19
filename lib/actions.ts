"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// ─── User ──────────────────────────────────────────────────────

export async function getUser() {
  const user = await prisma.user.findFirst({
    include: { subjects: true },
  });
  return user;
}

export async function createUser(name: string, email: string) {
  const user = await prisma.user.create({
    data: {
      name,
      email,
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
  revalidatePath("/");
  return user;
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
    include: { subject: true },
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
}) {
  const task = await prisma.task.create({
    data: {
      title: data.title,
      description: data.description || "",
      priority: data.priority,
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      subjectId: data.subjectId,
      userId: data.userId,
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
  }
) {
  const updateData: Record<string, unknown> = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.priority !== undefined) updateData.priority = data.priority;
  if (data.subjectId !== undefined) updateData.subjectId = data.subjectId;
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
