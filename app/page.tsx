import { getUser, getTasks, getDueFlashcards, getHabits, getDailyLogs } from "@/lib/actions";
import { isAuthenticated } from "@/lib/auth";
import { redirect } from "next/navigation";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  if (!(await isAuthenticated())) redirect("/login");
  const user = await getUser();

  const [allTasks, dueCards, habits, dailyLogs] = await Promise.all([
    getTasks(user.id),
    getDueFlashcards(user.id),
    getHabits(user.id),
    getDailyLogs(user.id)
  ]);

  // Pass necessary data to the dashboard
  const activeTasks = allTasks.filter(t => !t.completed).map((t) => ({
    id: t.id,
    title: t.title,
    priority: t.priority,
    completed: t.completed,
    dueDate: t.dueDate?.toISOString() || null,
    subject: t.subject
      ? { id: t.subject.id, name: t.subject.name, color: t.subject.color }
      : null,
  })).slice(0, 10); // Show up to 10 tasks
  
  const serializedDueCards = dueCards.map(c => ({
    id: c.id,
    deckName: c.deck.name,
    subjectColor: c.deck.subject?.color || "#666"
  }));

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayJournal = dailyLogs.find(l => l.date === todayStr);

  return (
    <DashboardClient 
      userId={user.id} 
      userName={user.name!}
      activeTasks={activeTasks}
      dueCards={serializedDueCards}
      habits={habits}
      hasJournalToday={!!todayJournal}
    />
  );
}
