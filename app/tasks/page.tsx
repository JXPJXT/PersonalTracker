import { getUser, getTasks, getTimeForTask } from "@/lib/actions";
import TasksClient from "./TasksClient";
import { isAuthenticated } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function TasksPage() {
  if (!(await isAuthenticated())) redirect("/login");
  const user = await getUser();

  const tasks = await getTasks(user.id);

  const serialized = await Promise.all(
    tasks.map(async (t) => {
      const totalTime = await getTimeForTask(t.id);
      return {
        id: t.id,
        title: t.title,
        description: t.description,
        priority: t.priority,
        dueDate: t.dueDate?.toISOString() || null,
        completed: t.completed,
        completedAt: t.completedAt?.toISOString() || null,
        autoCompleteHours: t.autoCompleteHours,
        subjectId: t.subjectId,
        subject: t.subject
          ? { id: t.subject.id, name: t.subject.name, color: t.subject.color }
          : null,
        createdAt: t.createdAt.toISOString(),
        sessionLinks: t.sessionLinks.map((l) => ({
          id: l.id,
          timeEntry: {
            id: Number(l.timeEntry.id),
            description: l.timeEntry.description,
            start: l.timeEntry.start.toISOString(),
            stop: l.timeEntry.stop?.toISOString() || null,
            durationInSeconds: l.timeEntry.durationInSeconds,
            subject: l.timeEntry.subject
              ? {
                  id: l.timeEntry.subject.id,
                  name: l.timeEntry.subject.name,
                  color: l.timeEntry.subject.color,
                }
              : null,
          },
        })),
        totalTimeLogged: totalTime,
      };
    })
  );

  const subjects = user.subjects.map((s) => ({
    id: s.id,
    name: s.name,
    color: s.color,
  }));

  return <TasksClient userId={user.id} tasks={serialized} subjects={subjects} />;
}
