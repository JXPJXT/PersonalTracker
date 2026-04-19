import { getUser, getSubjects } from "@/lib/actions";
import { redirect } from "next/navigation";
import SubjectsClient from "./SubjectsClient";

export default async function SubjectsPage() {
  const user = await getUser();
  if (!user) redirect("/");

  const subjects = await getSubjects(user.id);

  const serialized = subjects.map((s) => ({
    id: s.id,
    name: s.name,
    color: s.color,
    entryCount: s._count.entries,
  }));

  return <SubjectsClient userId={user.id} subjects={serialized} />;
}
