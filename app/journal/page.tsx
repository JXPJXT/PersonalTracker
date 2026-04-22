import { getUser, getDailyLogs } from "@/lib/actions";
import { isAuthenticated } from "@/lib/auth";
import { redirect } from "next/navigation";
import JournalClient from "./JournalClient";

export default async function JournalPage() {
  if (!(await isAuthenticated())) redirect("/login");
  const user = await getUser();

  const logs = await getDailyLogs(user.id);
  const serialized = logs.map((l) => ({
    id: l.id,
    date: l.date,
    content: l.content,
    mood: l.mood,
    productivity: l.productivity,
    highlights: l.highlights,
    improvements: l.improvements,
    gratitude: l.gratitude,
  }));

  return <JournalClient userId={user.id} logs={serialized} />;
}
