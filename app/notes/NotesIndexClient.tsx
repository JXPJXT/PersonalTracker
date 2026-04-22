"use client";

import { useState, useTransition } from "react";
import { createNote, deleteNote } from "@/lib/actions";
import Link from "next/link";
import { FileText, Plus, Search, Trash2, Clock, Inbox } from "lucide-react";
import { useRouter } from "next/navigation";
import ConfirmModal from "@/components/ui/ConfirmModal";

export default function NotesIndexClient({
  userId,
  notes,
  rootNotes,
}: {
  userId: string;
  notes: any[];
  rootNotes: any[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");

  const [confirmModal, setConfirmModal] = useState<{isOpen: boolean, id: string | null}>({isOpen: false, id: null});

  const handleCreateNote = () => {
    startTransition(async () => {
      const note = await createNote({ userId, title: "Untitled" });
      router.push(`/notes/${note.id}`);
    });
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setConfirmModal({ isOpen: true, id });
  };

  const executeDelete = () => {
    const id = confirmModal.id;
    if (!id) return;
    startTransition(async () => {
      await deleteNote(id);
    });
  };

  const filteredNotes = search
    ? notes.filter((n) => n.title.toLowerCase().includes(search.toLowerCase()))
    : rootNotes;

  return (
    <div className="p-8 max-w-5xl mx-auto overflow-y-auto h-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <FileText size={28} className="text-[#a78bfa]" />
            Notes
          </h1>
          <p className="text-sm text-gray-400 mt-2">
            Your personal knowledge base. Create documents, organize thoughts, and build a second brain.
          </p>
        </div>
        <button
          onClick={handleCreateNote}
          disabled={isPending}
          className="px-4 py-2 bg-[#7c3aed] text-white rounded-lg flex items-center gap-2 hover:bg-[#6d28d9] transition-colors font-medium text-sm"
        >
          <Plus size={16} />
          {isPending ? "Creating..." : "New Note"}
        </button>
      </div>

      {/* Search & Actions */}
      <div className="flex gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search documents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#1a1a1a]/50 backdrop-blur-md border border-[#333] hover:border-[#444] rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-[#7c3aed] transition-colors shadow-inner"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filteredNotes.map((note) => (
          <Link
            key={note.id}
            href={`/notes/${note.id}`}
            className="group relative flex flex-col bg-[#1a1a1a] border border-[#2a2a2a] hover:border-[#7c3aed]/50 rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.4)]"
          >
            {note.cover ? (
              <div
                className="h-32 w-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                style={{ backgroundImage: `url(${note.cover})` }}
              />
            ) : (
              <div className="h-32 w-full bg-gradient-to-br from-[#2a2a35] to-[#1a1a24] overflow-hidden relative">
                 {/* Premium subtle pattern for empty covers */}
                 <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#fff] via-transparent to-transparent bg-[length:10px_10px]" />
              </div>
            )}
            
            <div className="p-5 flex-1 flex flex-col bg-gradient-to-b from-transparent to-[#111]">
              <div className="flex items-start gap-4 z-10 relative">
                <div className="text-3xl -mt-10 bg-[#1a1a1a] p-2 rounded-xl shadow-lg border border-[#2a2a2a]">
                  {note.icon || "📄"}
                </div>
                <div className="flex-1 pt-1 min-w-0">
                  <h3 className="font-semibold text-white truncate text-base tracking-tight group-hover:text-[#a78bfa] transition-colors">
                    {note.title || "Untitled"}
                  </h3>
                </div>
              </div>
              
              <div className="mt-auto pt-4 flex items-center justify-between text-xs text-gray-500">
                <span className="flex items-center gap-1.5 font-medium">
                  <Clock size={12} className="text-gray-400" />
                  {new Date(note.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
                
                <div className="flex items-center gap-2">
                  {note._count.children > 0 && (
                    <span className="bg-[#2a2a2a] px-2 py-1 rounded-md text-gray-300 font-medium">
                      {note._count.children} sub
                    </span>
                  )}
                  <button
                    onClick={(e) => handleDelete(e, note.id)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-all z-20"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          </Link>
        ))}

        {filteredNotes.length === 0 && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-center border border-dashed border-[#333] rounded-3xl bg-[#1a1a1a]/50 backdrop-blur-sm">
            <div className="p-5 bg-[#222] rounded-full mb-5 shadow-lg border border-[#333]">
              <Inbox size={40} className="text-gray-500" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No documents found</h3>
            <p className="text-gray-400 max-w-sm mb-6 text-sm">
              {search ? "Try refining your search terms." : "Create your first document to start building your personal knowledge base."}
            </p>
            {!search && (
              <button
                onClick={handleCreateNote}
                className="px-6 py-2.5 bg-white text-black font-semibold rounded-xl hover:bg-gray-200 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.1)]"
              >
                Create Document
              </button>
            )}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title="Delete Note"
        description="Are you sure you want to delete this note? It will delete all nested sub-notes as well. This action cannot be undone."
        onConfirm={executeDelete}
        onCancel={() => setConfirmModal({ isOpen: false, id: null })}
        danger={true}
      />
    </div>
  );
}
