"use client";

import { useState, useTransition, useRef, useEffect, useCallback } from "react";
import {
  createResource,
  updateResource,
  deleteResource,
  linkResources,
  unlinkResources,
  getResources,
} from "@/lib/actions";
import {
  Plus,
  Trash2,
  Pencil,
  ExternalLink,
  Link2,
  Unlink,
  BookMarked,
  Search,
  Tag,
  Map,
  List,
  X,
} from "lucide-react";
import ConfirmModal from "@/components/ui/ConfirmModal";

interface Subject {
  id: string;
  name: string;
  color: string;
}

interface LinkData {
  id: string;
  toId?: string;
  toTitle?: string;
  toColor?: string;
  fromId?: string;
  fromTitle?: string;
  fromColor?: string;
  label: string;
}

interface ResourceData {
  id: string;
  title: string;
  url: string;
  description: string;
  tags: string;
  subjectId: string | null;
  subject: Subject | null;
  createdAt: string;
  linksFrom: LinkData[];
  linksTo: LinkData[];
}

export default function ResourcesClient({
  userId,
  resources: initialResources,
  subjects,
}: {
  userId: string;
  resources: ResourceData[];
  subjects: Subject[];
}) {
  const [resources, setResources] = useState(initialResources);
  const [isPending, startTransition] = useTransition();
  const [view, setView] = useState<"list" | "map">("list");
  const [search, setSearch] = useState("");
  const [filterSubject, setFilterSubject] = useState<string | null>(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formUrl, setFormUrl] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formTags, setFormTags] = useState("");
  const [formSubjectId, setFormSubjectId] = useState<string | null>(null);

  // Link state
  const [linkingFrom, setLinkingFrom] = useState<string | null>(null);

  const refreshData = async () => {
    const fresh = await getResources(userId);
    setResources(
      fresh.map((r) => ({
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
      }))
    );
  };

  const resetForm = () => {
    setFormTitle("");
    setFormUrl("");
    setFormDesc("");
    setFormTags("");
    setFormSubjectId(null);
    setEditingId(null);
    setShowForm(false);
  };

  const handleSave = () => {
    if (!formTitle.trim()) return;
    startTransition(async () => {
      if (editingId) {
        await updateResource(editingId, {
          title: formTitle.trim(),
          url: formUrl.trim(),
          description: formDesc.trim(),
          tags: formTags.trim(),
          subjectId: formSubjectId,
        });
      } else {
        await createResource({
          title: formTitle.trim(),
          url: formUrl.trim(),
          description: formDesc.trim(),
          tags: formTags.trim(),
          subjectId: formSubjectId,
          userId,
        });
      }
      await refreshData();
      resetForm();
    });
  };

  const handleEdit = (r: ResourceData) => {
    setFormTitle(r.title);
    setFormUrl(r.url);
    setFormDesc(r.description);
    setFormTags(r.tags);
    setFormSubjectId(r.subjectId);
    setEditingId(r.id);
    setShowForm(true);
  };

  const [confirmModal, setConfirmModal] = useState<{isOpen: boolean, id: string | null}>({isOpen: false, id: null});

  const handleDelete = (id: string) => {
    setConfirmModal({ isOpen: true, id });
  };

  const executeDelete = () => {
    const id = confirmModal.id;
    if (!id) return;
    startTransition(async () => {
      await deleteResource(id);
      await refreshData();
    });
  };

  const handleLink = (toId: string) => {
    if (!linkingFrom || linkingFrom === toId) return;
    startTransition(async () => {
      await linkResources(linkingFrom, toId);
      await refreshData();
      setLinkingFrom(null);
    });
  };

  const handleUnlink = (fromId: string, toId: string) => {
    startTransition(async () => {
      await unlinkResources(fromId, toId);
      await refreshData();
    });
  };

  // Filter
  const filtered = resources.filter((r) => {
    const matchSearch =
      !search ||
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.tags.toLowerCase().includes(search.toLowerCase()) ||
      r.description.toLowerCase().includes(search.toLowerCase());
    const matchSubject = !filterSubject || r.subjectId === filterSubject;
    return matchSearch && matchSubject;
  });

  const allTags = Array.from(
    new Set(
      resources
        .flatMap((r) => r.tags.split(",").map((t) => t.trim()))
        .filter(Boolean)
    )
  );

  return (
    <div className="p-8 max-w-4xl mx-auto overflow-y-auto h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <BookMarked size={24} />
            Resources
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            {resources.length} resources ·{" "}
            {resources.reduce(
              (s, r) => s + r.linksFrom.length + r.linksTo.length,
              0
            ) / 2}{" "}
            connections
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex bg-[#222] rounded-lg border border-[#2a2a2a] overflow-hidden">
            <button
              onClick={() => setView("list")}
              className={`px-3 py-1.5 text-xs flex items-center gap-1 transition-all ${view === "list" ? "bg-[#7c3aed] text-white" : "text-gray-400 hover:text-white"}`}
            >
              <List size={12} /> List
            </button>
            <button
              onClick={() => setView("map")}
              className={`px-3 py-1.5 text-xs flex items-center gap-1 transition-all ${view === "map" ? "bg-[#7c3aed] text-white" : "text-gray-400 hover:text-white"}`}
            >
              <Map size={12} /> Map
            </button>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="btn-primary"
          >
            <Plus size={16} />
            Add Resource
          </button>
        </div>
      </div>

      {/* Search & filters */}
      <div className="flex gap-3 mb-5">
        <div className="flex-1 relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-9 text-sm"
            placeholder="Search resources..."
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto">
          <button
            onClick={() => setFilterSubject(null)}
            className={`px-2.5 py-1.5 text-xs rounded-lg border whitespace-nowrap transition-all ${!filterSubject ? "border-white/30 bg-white/10 text-white" : "border-[#333] text-gray-500 hover:border-[#444]"}`}
          >
            All
          </button>
          {subjects.map((s) => (
            <button
              key={s.id}
              onClick={() =>
                setFilterSubject(filterSubject === s.id ? null : s.id)
              }
              className={`flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg border whitespace-nowrap transition-all ${filterSubject === s.id ? "border-white/30 bg-white/10 text-white" : "border-[#333] text-gray-500 hover:border-[#444]"}`}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: s.color }}
              />
              {s.name}
            </button>
          ))}
        </div>
      </div>

      {/* Linking banner */}
      {linkingFrom && (
        <div className="mb-4 p-3 bg-[#7c3aed]/10 border border-[#7c3aed]/30 rounded-xl flex items-center justify-between">
          <p className="text-sm text-[#7c3aed]">
            <Link2 size={14} className="inline mr-1" />
            Click on a resource to link it to &quot;
            {resources.find((r) => r.id === linkingFrom)?.title}&quot;
          </p>
          <button
            onClick={() => setLinkingFrom(null)}
            className="text-xs text-gray-400 hover:text-white"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="mb-6 p-5 bg-[#222] rounded-xl border border-[#333]">
          <h3 className="text-sm font-medium text-white mb-4">
            {editingId ? "Edit Resource" : "New Resource"}
          </h3>
          <div className="space-y-3">
            <input
              type="text"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              className="input-field"
              placeholder="Title"
              autoFocus
            />
            <input
              type="url"
              value={formUrl}
              onChange={(e) => setFormUrl(e.target.value)}
              className="input-field"
              placeholder="URL (optional)"
            />
            <input
              type="text"
              value={formDesc}
              onChange={(e) => setFormDesc(e.target.value)}
              className="input-field"
              placeholder="Description (optional)"
            />
            <input
              type="text"
              value={formTags}
              onChange={(e) => setFormTags(e.target.value)}
              className="input-field"
              placeholder="Tags (comma-separated, e.g. calculus, derivatives)"
            />
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">
                Subject
              </label>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setFormSubjectId(null)}
                  className={`px-2.5 py-1.5 text-xs rounded-lg border transition-all ${formSubjectId === null ? "border-white/30 bg-white/10 text-white" : "border-[#333] text-gray-500"}`}
                >
                  None
                </button>
                {subjects.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setFormSubjectId(s.id)}
                    className={`flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg border transition-all ${formSubjectId === s.id ? "border-white/30 bg-white/10 text-white" : "border-[#333] text-gray-500"}`}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: s.color }}
                    />
                    {s.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={resetForm} className="btn-ghost">
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="btn-primary"
              disabled={isPending || !formTitle.trim()}
            >
              {isPending ? "Saving…" : editingId ? "Update" : "Save"}
            </button>
          </div>
        </div>
      )}

      {/* View */}
      {view === "list" ? (
        <ListView
          resources={filtered}
          linkingFrom={linkingFrom}
          onLink={handleLink}
          onUnlink={handleUnlink}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onStartLink={setLinkingFrom}
          allResources={resources}
        />
      ) : (
        <MapView resources={resources} subjects={subjects} />
      )}

      {/* Empty state */}
      {resources.length === 0 && !showForm && (
        <div className="text-center py-20">
          <BookMarked size={40} className="text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">No resources saved yet</p>
          <p className="text-sm text-gray-600 mt-1">
            Save links, notes, and build your knowledge map
          </p>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title="Delete Resource"
        description="Are you sure you want to delete this resource? This action cannot be undone."
        onConfirm={executeDelete}
        onCancel={() => setConfirmModal({ isOpen: false, id: null })}
        danger={true}
      />
    </div>
  );
}

// ─── List View ──────────────────────────────────────────────

function ListView({
  resources,
  linkingFrom,
  onLink,
  onUnlink,
  onEdit,
  onDelete,
  onStartLink,
  allResources,
}: {
  resources: ResourceData[];
  linkingFrom: string | null;
  onLink: (toId: string) => void;
  onUnlink: (fromId: string, toId: string) => void;
  onEdit: (r: ResourceData) => void;
  onDelete: (id: string) => void;
  onStartLink: (id: string) => void;
  allResources: ResourceData[];
}) {
  return (
    <div className="space-y-2">
      {resources.map((r) => {
        const allLinks = [
          ...r.linksFrom.map((l) => ({
            resourceId: l.toId!,
            title: l.toTitle!,
            color: l.toColor!,
            direction: "→" as const,
            fromId: r.id,
            toId: l.toId!,
          })),
          ...r.linksTo.map((l) => ({
            resourceId: l.fromId!,
            title: l.fromTitle!,
            color: l.fromColor!,
            direction: "←" as const,
            fromId: l.fromId!,
            toId: r.id,
          })),
        ];
        const tags = r.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);

        return (
          <div
            key={r.id}
            className={`p-4 bg-[#222] rounded-xl border transition-all group/res ${linkingFrom && linkingFrom !== r.id ? "border-[#7c3aed]/40 cursor-pointer hover:border-[#7c3aed]" : "border-[#2a2a2a] hover:border-[#333]"}`}
            onClick={() => linkingFrom && onLink(r.id)}
          >
            <div className="flex items-start gap-3">
              {r.subject && (
                <span
                  className="w-3 h-3 rounded-full mt-1 shrink-0"
                  style={{ backgroundColor: r.subject.color }}
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium text-white">{r.title}</h3>
                  {r.url && (
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-500 hover:text-[#7c3aed] transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink size={12} />
                    </a>
                  )}
                </div>
                {r.description && (
                  <p className="text-xs text-gray-500 mt-0.5">{r.description}</p>
                )}
                {/* Tags */}
                {tags.length > 0 && (
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {tags.map((tag, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 text-[10px] bg-[#333] text-gray-400 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                {/* Links */}
                {allLinks.length > 0 && (
                  <div className="flex gap-1.5 mt-2 flex-wrap">
                    {allLinks.map((link, i) => (
                      <span
                        key={i}
                        className="flex items-center gap-1 px-2 py-0.5 text-[10px] rounded-full border border-[#333] text-gray-400"
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: link.color }}
                        />
                        {link.direction} {link.title}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onUnlink(link.fromId, link.toId);
                          }}
                          className="ml-0.5 hover:text-red-400"
                        >
                          <X size={8} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              {!linkingFrom && (
                <div className="flex gap-1 opacity-0 group-hover/res:opacity-100 transition-all shrink-0">
                  <button
                    onClick={() => onStartLink(r.id)}
                    className="p-1.5 hover:bg-[#333] rounded transition-colors"
                    title="Link to another resource"
                  >
                    <Link2 size={12} className="text-[#7c3aed]" />
                  </button>
                  <button
                    onClick={() => onEdit(r)}
                    className="p-1.5 hover:bg-[#333] rounded transition-colors"
                  >
                    <Pencil size={12} className="text-gray-400" />
                  </button>
                  <button
                    onClick={() => onDelete(r.id)}
                    className="p-1.5 hover:bg-red-500/20 rounded transition-colors"
                  >
                    <Trash2 size={12} className="text-red-400" />
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Knowledge Map View (Canvas) ──────────────────────────────

interface NodePos {
  id: string;
  x: number;
  y: number;
}

function MapView({
  resources,
  subjects,
}: {
  resources: ResourceData[];
  subjects: Subject[];
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [nodes, setNodes] = useState<NodePos[]>([]);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // Initialize node positions in a force-directed-like layout
  useEffect(() => {
    if (resources.length === 0) return;
    const w = containerRef.current?.clientWidth || 700;
    const h = containerRef.current?.clientHeight || 500;
    const cx = w / 2;
    const cy = h / 2;
    const radius = Math.min(w, h) * 0.32;

    const initialNodes: NodePos[] = resources.map((r, i) => {
      const angle = (2 * Math.PI * i) / resources.length - Math.PI / 2;
      return {
        id: r.id,
        x: cx + radius * Math.cos(angle),
        y: cy + radius * Math.sin(angle),
      };
    });
    setNodes(initialNodes);
  }, [resources]);

  // Draw
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || nodes.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, rect.width, rect.height);

    // Draw edges
    for (const r of resources) {
      const fromNode = nodes.find((n) => n.id === r.id);
      if (!fromNode) continue;
      for (const link of r.linksFrom) {
        const toNode = nodes.find((n) => n.id === link.toId);
        if (!toNode) continue;

        ctx.beginPath();
        ctx.moveTo(fromNode.x, fromNode.y);
        ctx.lineTo(toNode.x, toNode.y);
        ctx.strokeStyle =
          hoveredNode === r.id || hoveredNode === link.toId
            ? "#7c3aed"
            : "#333";
        ctx.lineWidth =
          hoveredNode === r.id || hoveredNode === link.toId ? 2 : 1;
        ctx.stroke();
      }
    }

    // Draw nodes
    for (const r of resources) {
      const node = nodes.find((n) => n.id === r.id);
      if (!node) continue;

      const color = r.subject?.color || "#666";
      const isHovered = hoveredNode === r.id;
      const nodeRadius = isHovered ? 22 : 18;

      // Glow
      if (isHovered) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, nodeRadius + 6, 0, Math.PI * 2);
        ctx.fillStyle = color + "22";
        ctx.fill();
      }

      // Node circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, nodeRadius, 0, Math.PI * 2);
      ctx.fillStyle = isHovered ? color : color + "44";
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Label
      ctx.fillStyle = isHovered ? "#fff" : "#ccc";
      ctx.font = `${isHovered ? 12 : 10}px Inter, sans-serif`;
      ctx.textAlign = "center";
      const label =
        r.title.length > 16 ? r.title.slice(0, 14) + "…" : r.title;
      ctx.fillText(label, node.x, node.y + nodeRadius + 14);
    }
  }, [nodes, resources, hoveredNode]);

  useEffect(() => {
    draw();
  }, [draw]);

  const getNodeAt = (mx: number, my: number) => {
    for (const n of nodes) {
      const dx = mx - n.x;
      const dy = my - n.y;
      if (dx * dx + dy * dy < 22 * 22) return n.id;
    }
    return null;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const nodeId = getNodeAt(mx, my);
    if (nodeId) {
      const node = nodes.find((n) => n.id === nodeId)!;
      setDragging(nodeId);
      setDragOffset({ x: mx - node.x, y: my - node.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    if (dragging) {
      setNodes((prev) =>
        prev.map((n) =>
          n.id === dragging
            ? { ...n, x: mx - dragOffset.x, y: my - dragOffset.y }
            : n
        )
      );
    } else {
      setHoveredNode(getNodeAt(mx, my));
    }
  };

  const handleMouseUp = () => setDragging(null);

  if (resources.length === 0) {
    return (
      <div className="text-center py-20 text-gray-500">
        Add resources to see the knowledge map
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="w-full bg-[#1a1a1a] rounded-xl border border-[#2a2a2a] overflow-hidden"
      style={{ height: "500px" }}
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
}
