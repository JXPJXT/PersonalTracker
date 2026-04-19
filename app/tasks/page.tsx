import { getUser, getTasks } from "@/lib/actions";
import { redirect } from "next/navigation";
import TasksClient from "./TasksClient";

export default async function TasksPage() {
  const user = await getUser();
  if (!user) redirect("/");

  const tasks = await getTasks(user.id);

  const serialized = tasks.map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description,
    priority: t.priority,
    dueDate: t.dueDate?.toISOString() || null,
    completed: t.completed,
    completedAt: t.completedAt?.toISOString() || null,
    subjectId: t.subjectId,
    subject: t.subject
      ? { id: t.subject.id, name: t.subject.name, color: t.subject.color }
      : null,
    createdAt: t.createdAt.toISOString(),
  }));

  const subjects = user.subjects.map((s) => ({
    id: s.id,
    name: s.name,
    color: s.color,
  }));

  return <TasksClient userId={user.id} tasks={serialized} subjects={subjects} />;
}
