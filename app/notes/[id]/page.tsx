import { getUser, getNoteById } from "@/lib/actions";
import { isAuthenticated } from "@/lib/auth";
import { redirect } from "next/navigation";
import NoteEditorClient from "./NoteEditorClient";

export default async function NotePage({ params }: { params: Promise<{ id: string }> }) {
  if (!(await isAuthenticated())) redirect("/login");
  const user = await getUser();
  const { id } = await params;

  const note = await getNoteById(id);
  if (!note || note.userId !== user.id) {
    redirect("/notes");
  }

  // Serialize note
  const serialized = {
    id: note.id,
    title: note.title,
    icon: note.icon,
    cover: note.cover,
    content: note.content,
    parentId: note.parentId,
    updatedAt: note.updatedAt.toISOString(),
    parent: note.parent ? { id: note.parent.id, title: note.parent.title } : null,
    children: note.children.map((c: any) => ({
      id: c.id,
      title: c.title,
      icon: c.icon,
      updatedAt: c.updatedAt.toISOString()
    }))
  };

  return <NoteEditorClient userId={user.id} initialNote={serialized} />;
}
