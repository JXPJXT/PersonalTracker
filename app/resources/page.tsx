import { getUser, getResources } from "@/lib/actions";
import { isAuthenticated } from "@/lib/auth";
import { redirect } from "next/navigation";
import ResourcesClient from "./ResourcesClient";

export default async function ResourcesPage() {
  if (!(await isAuthenticated())) redirect("/login");
  const user = await getUser();

  const resources = await getResources(user.id);
  const serialized = resources.map((r) => ({
    id: r.id,
    title: r.title,
    url: r.url,
    description: r.description,
    tags: r.tags,
    subjectId: r.subjectId,
    subject: r.subject
      ? { id: r.subject.id, name: r.subject.name, color: r.subject.color }
      : null,
    createdAt: r.createdAt.toISOString(),
    linksFrom: r.linksFrom.map((l) => ({
      id: l.id,
      toId: l.toResourceId,
      toTitle: l.toResource.title,
      toColor: l.toResource.subject?.color || "#666",
      label: l.label,
    })),
    linksTo: r.linksTo.map((l) => ({
      id: l.id,
      fromId: l.fromResourceId,
      fromTitle: l.fromResource.title,
      fromColor: l.fromResource.subject?.color || "#666",
      label: l.label,
    })),
  }));

  const subjects = user.subjects.map((s) => ({
    id: s.id,
    name: s.name,
    color: s.color,
  }));

  return (
    <ResourcesClient userId={user.id} resources={serialized} subjects={subjects} />
  );
}
