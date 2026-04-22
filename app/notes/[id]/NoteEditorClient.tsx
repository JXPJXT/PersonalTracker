"use client";

import { useState, useCallback, useTransition } from "react";
import { updateNote, createNote } from "@/lib/actions";
import Link from "next/link";
import { ArrowLeft, Clock, Save, CheckCircle2, Image as ImageIcon, Trash2, Plus, FileText, Layers } from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

// Dynamically import the editor since it uses browser APIs
const BlockEditor = dynamic(() => import("@/components/editor/BlockEditor"), {
  ssr: false,
  loading: () => <div className="p-8 text-gray-500 animate-pulse">Loading editor...</div>,
});

export default function NoteEditorClient({
  userId,
  initialNote,
}: {
  userId: string;
  initialNote: any;
}) {
  const router = useRouter();
  const [note, setNote] = useState(initialNote);
  const [isPending, startTransition] = useTransition();
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");

  const saveNote = useCallback(async (data: Partial<typeof initialNote>) => {
    setSaveStatus("saving");
    const updated = await updateNote(note.id, data);
    setNote((prev: any) => ({ ...prev, ...data, updatedAt: updated.updatedAt.toISOString() }));
    setSaveStatus("saved");
  }, [note.id]);

  const handleContentChange = useCallback((newContent: string) => {
    setSaveStatus("unsaved");
    saveNote({ content: newContent });
  }, [saveNote]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSaveStatus("unsaved");
    setNote((prev: any) => ({ ...prev, title: e.target.value }));
  };

  const handleTitleBlur = () => {
    saveNote({ title: note.title });
  };

  const addCover = () => {
    const defaultCover = "https://images.unsplash.com/photo-1542281286-9e0a16bb7366?auto=format&fit=crop&q=80&w=2000";
    saveNote({ cover: defaultCover });
  };

  const removeCover = () => {
    saveNote({ cover: null });
  };

  const addSubpage = () => {
    startTransition(async () => {
      const child = await createNote({ userId, title: "Untitled Subpage", parentId: note.id });
      router.push(`/notes/${child.id}`);
    });
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#0e0e12]">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#222] bg-[#0e0e12]/80 backdrop-blur-xl z-20 sticky top-0">
        <div className="flex items-center gap-3">
          <Link href={note.parent ? `/notes/${note.parent.id}` : "/notes"} className="text-gray-400 hover:text-white transition-colors flex items-center gap-1.5 text-sm px-2 py-1 rounded hover:bg-[#222]">
            <ArrowLeft size={16} /> 
            <span className="max-w-[120px] truncate">{note.parent ? note.parent.title || "Parent Page" : "Notes"}</span>
          </Link>
          <div className="h-4 w-px bg-[#333]" />
          <div className="text-sm font-medium text-gray-300 flex items-center gap-2 max-w-[300px] truncate">
            <span>
              {note.icon && <span className="mr-1.5">{note.icon}</span>}
              {note.title || "Untitled"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="hidden md:flex items-center gap-1">
            <Clock size={12} /> Last edited {new Date(note.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
          </span>
          {saveStatus === "saving" && <span className="animate-pulse flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />Saving</span>}
          {saveStatus === "saved" && <span className="flex items-center gap-1 text-emerald-500"><CheckCircle2 size={12} /> Saved</span>}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto w-full relative group/scroll">
        {/* Cover Image */}
        {note.cover && (
          <div className="relative w-full h-48 md:h-64 lg:h-72 group border-b border-[#222]">
            <img src={note.cover} alt="Cover" className="w-full h-full object-cover transition-transform duration-700 hover:scale-[1.01]" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e12] to-transparent opacity-40 pointer-events-none" />
            <button
              onClick={removeCover}
              className="absolute bottom-4 right-4 bg-[#1a1a1a]/80 backdrop-blur border border-[#333] hover:bg-[#222] text-white px-3 py-1.5 rounded-lg text-xs font-medium opacity-0 group-hover:opacity-100 transition-all shadow-[0_0_15px_rgba(0,0,0,0.5)]"
            >
              Remove Cover
            </button>
          </div>
        )}

        <div className="max-w-[900px] mx-auto px-8 md:px-16 py-12 pb-32">
          {/* Page Controls (Icon & Cover adders) */}
          <div className="flex gap-4 opacity-0 group-hover/scroll:opacity-100 transition-opacity absolute -mt-10 z-10">
            {!note.cover && (
              <button 
                onClick={addCover}
                className="flex items-center gap-1.5 px-2 py-1 rounded-md text-gray-500 hover:text-gray-200 hover:bg-[#222] text-sm font-medium transition-colors"
               >
                <ImageIcon size={15} /> Add cover
              </button>
            )}
            {!note.icon && (
               <button 
                onClick={() => saveNote({icon: "📄"})}
                className="flex items-center gap-1.5 px-2 py-1 rounded-md text-gray-500 hover:text-gray-200 hover:bg-[#222] text-sm font-medium transition-colors"
               >
                <FileText size={15} /> Add icon
              </button>
            )}
          </div>

          {/* Title Area */}
          <div className="mb-4 relative">
            {note.icon && (
              <div className="text-7xl mb-6 -ml-2 select-none group/icon relative cursor-pointer inline-block">
                 <span className="drop-shadow-lg">{note.icon}</span>
                 <button onClick={() => saveNote({icon: null})} className="absolute -top-1 -right-4 bg-[#222] border border-[#333] rounded-full p-1.5 opacity-0 group-hover/icon:opacity-100 transition-all hover:bg-red-500/20 hover:text-red-400">
                   <Trash2 size={12} />
                 </button>
              </div>
            )}
            
            <input
              type="text"
              value={note.title}
              onChange={handleTitleChange}
              onBlur={handleTitleBlur}
              placeholder="Untitled Document"
              className={`font-bold bg-transparent border-none outline-none text-white w-full placeholder-[#333] tracking-tight ${note.icon ? 'text-4xl md:text-5xl' : 'text-5xl md:text-6xl mt-4 shrink-0'}`}
            />
          </div>

          {/* BlockNote Editor */}
          <div className="-ml-[3rem] w-[calc(100%+6rem)] min-h-[300px]">
             {/* The BlockNote text editor */}
            <BlockEditor initialContent={note.content} onChange={handleContentChange} />
          </div>

          {/* Subpages Section */}
          <div className="mt-16 pt-8 border-t border-[#222]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <Layers size={14} /> References / Sub-pages
              </h3>
              <button 
                onClick={addSubpage} 
                disabled={isPending} 
                className="flex items-center gap-1.5 text-xs font-medium bg-[#1a1a1a] border border-[#2a2a2a] hover:bg-[#222] hover:border-[#333] px-2.5 py-1.5 rounded-lg text-gray-300 transition-all"
              >
                <Plus size={14} className="text-indigo-400" /> New sub-page
              </button>
            </div>
            
            <div className={`grid grid-cols-1 ${note.children?.length > 1 ? 'sm:grid-cols-2' : ''} gap-3`}>
              {note.children?.map((child: any) => (
                <Link key={child.id} href={`/notes/${child.id}`} className="group/child flex items-center gap-3 p-3.5 rounded-xl border border-[#222] bg-[#1a1a1a]/50 hover:bg-[#222] hover:border-[#333] hover:shadow-lg transition-all duration-200">
                  <span className="text-xl bg-[#2a2a2a] group-hover/child:bg-[#333] p-1.5 rounded-lg transition-colors">
                    {child.icon || <FileText size={18} className="text-gray-400" />}
                  </span>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-200 group-hover/child:text-white transition-colors">{child.title || "Untitled"}</span>
                    <span className="text-[10px] text-gray-500 mt-0.5 max-h-0 overflow-hidden group-hover/child:max-h-10 transition-all duration-300">Open sub-page →</span>
                  </div>
                </Link>
              ))}
              
              {(!note.children || note.children.length === 0) && (
                <div 
                  onClick={addSubpage} 
                  className="col-span-full p-6 border-2 border-dashed border-[#222] hover:border-[#444] hover:bg-[#1a1a1a]/50 rounded-2xl text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2"
                >
                  <Plus size={24} className="text-gray-600" />
                  <p className="text-sm text-gray-500 font-medium tracking-wide leading-relaxed">
                    Create a blank sub-page<br/><span className="text-xs text-gray-600 font-normal">Build structure to your document</span>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
