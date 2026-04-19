import { getUser, getEntriesForWeek } from "@/lib/actions";
import { startOfWeek, endOfWeek } from "date-fns";
import OnboardingModal from "@/components/OnboardingModal";
import CalendarPageClient from "@/components/calendar/CalendarPageClient";

export default async function HomePage() {
  const user = await getUser();

  if (!user) {
    return <OnboardingModal />;
  }

  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  const entries = await getEntriesForWeek(
    user.id,
    weekStart.toISOString(),
    weekEnd.toISOString()
  );

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

  return (
    <CalendarPageClient
      userId={user.id}
      subjects={subjects}
      initialEntries={serializedEntries}
      initialWeekStart={weekStart.toISOString()}
    />
  );
}
