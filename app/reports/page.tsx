import { getUser, getAllEntries } from "@/lib/actions";
import ReportsClient from "./ReportsClient";
import { isAuthenticated } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function ReportsPage() {
  if (!(await isAuthenticated())) redirect("/login");
  const user = await getUser();

  const entries = await getAllEntries(user.id);

  const serialized = entries.map((e) => ({
    id: e.id,
    description: e.description,
    start: e.start.toISOString(),
    stop: e.stop?.toISOString() || null,
    durationInSeconds: e.durationInSeconds,
    subjectId: e.subjectId,
    subject: e.subject
      ? { id: e.subject.id, name: e.subject.name, color: e.subject.color }
      : null,
  }));

  const subjects = user.subjects.map((s) => ({
    id: s.id,
    name: s.name,
    color: s.color,
  }));

  return <ReportsClient entries={serialized} subjects={subjects} />;
}
