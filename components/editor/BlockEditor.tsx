"use client";

import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";

interface BlockEditorProps {
  initialContent: string;
  onChange: (content: string) => void;
}

export default function BlockEditor({ initialContent, onChange }: BlockEditorProps) {
  let initialBlocks = undefined;
  try {
    if (initialContent && initialContent.trim() !== "") {
      const parsed = JSON.parse(initialContent);
      if (Array.isArray(parsed) && parsed.length > 0) {
        initialBlocks = parsed;
      }
    }
  } catch (e) {
    console.error("Failed to parse initial content blocks", e);
  }

  const editor = useCreateBlockNote({
    initialContent: initialBlocks,
    uploadFile: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      return data.url;
    },
  });

  return (
    <BlockNoteView
      editor={editor}
      theme="dark"
      onChange={() => {
        onChange(JSON.stringify(editor.document));
      }}
      className="notion-style-editor"
      data-theming-css-variables
    />
  );
}
