import { getUser, getSleepLogs, getHabits } from "@/lib/actions";
import { isAuthenticated } from "@/lib/auth";
import { redirect } from "next/navigation";
import HabitsClient from "./HabitsClient";

export default async function HabitsPage() {
  if (!(await isAuthenticated())) redirect("/login");
  const user = await getUser();

  const [sleepLogs, habits] = await Promise.all([
    getSleepLogs(user.id, 30),
    getHabits(user.id),
  ]);

  const serializedSleep = sleepLogs.map((l) => ({
    id: l.id,
    date: l.date,
    wakeTime: l.wakeTime,
    sleepTime: l.sleepTime,
    quality: l.quality,
    notes: l.notes,
  }));

  const serializedHabits = habits.map((h) => ({
    id: h.id,
    name: h.name,
    icon: h.icon,
    color: h.color,
    target: h.target,
    unit: h.unit,
    entries: h.entries.map((e) => ({
      date: e.date,
      value: e.value,
    })),
  }));

  return (
    <HabitsClient
      userId={user.id}
      sleepLogs={serializedSleep}
      habits={serializedHabits}
    />
  );
}
