import { getUser, getEntriesForWeek, getTasks } from "@/lib/actions";
import { isAuthenticated } from "@/lib/auth";
import { startOfWeek, endOfWeek } from "date-fns";
import { redirect } from "next/navigation";
import CalendarPageClient from "@/components/calendar/CalendarPageClient";

export default async function HomePage() {
  if (!(await isAuthenticated())) redirect("/login");
  const user = await getUser();

  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  const [entries, allTasks] = await Promise.all([
    getEntriesForWeek(user.id, weekStart.toISOString(), weekEnd.toISOString()),
    getTasks(user.id),
  ]);

  const serializedEntries = entries.map((e) => ({
    ...e,
    start: e.start.toISOString(),
    stop: e.stop?.toISOString() || null,
    subject: e.subject
      ? { id: e.subject.id, name: e.subject.name, color: e.subject.color }
      : null,
  }));

  const subjects = user.subjects.map((s) => ({
    id: s.id,
    name: s.name,
    color: s.color,
  }));

  const tasks = allTasks.map((t) => ({
    id: t.id,
    title: t.title,
    priority: t.priority,
    completed: t.completed,
    dueDate: t.dueDate?.toISOString() || null,
    subject: t.subject
      ? { id: t.subject.id, name: t.subject.name, color: t.subject.color }
      : null,
  }));

  return (
    <CalendarPageClient
      userId={user.id}
      subjects={subjects}
      initialEntries={serializedEntries}
      initialWeekStart={weekStart.toISOString()}
      tasks={tasks}
    />
  );
}
