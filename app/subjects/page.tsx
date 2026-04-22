import { getUser, getSubjects } from "@/lib/actions";
import SubjectsClient from "./SubjectsClient";
import { isAuthenticated } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function SubjectsPage() {
  if (!(await isAuthenticated())) redirect("/login");
  const user = await getUser();

  const subjects = await getSubjects(user.id);

  const serialized = subjects.map((s: any) => ({
    id: s.id,
    name: s.name,
    color: s.color,
    entryCount: s._count.entries,
  }));

  return <SubjectsClient userId={user.id} subjects={serialized} />;
}
