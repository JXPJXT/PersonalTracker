import { getUser, getNotes } from "@/lib/actions";
import { isAuthenticated } from "@/lib/auth";
import { redirect } from "next/navigation";
import NotesIndexClient from "./NotesIndexClient";

export default async function NotesPage() {
  if (!(await isAuthenticated())) redirect("/login");
  const user = await getUser();

  const notes = await getNotes(user.id);
  const serialized = notes.map((n: any) => ({
    id: n.id,
    title: n.title,
    icon: n.icon,
    cover: n.cover,
    parentId: n.parentId,
    updatedAt: n.updatedAt.toISOString(),
    _count: { children: n.children.length },
  }));

  // Build hierarchy tree
  const rootNotes = serialized.filter((n: any) => !n.parentId);

  return <NotesIndexClient userId={user.id} notes={serialized} rootNotes={rootNotes} />;
}
