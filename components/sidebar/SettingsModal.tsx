"use client";

import { useState } from "react";
import { Download, X } from "lucide-react";
import { exportData } from "@/lib/actions";

interface SettingsModalProps {
  userId: string;
  onClose: () => void;
}

export default function SettingsModal({ userId, onClose }: SettingsModalProps) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const data = await exportData(userId);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `studytrack-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      alert("Failed to export data.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] w-full max-w-sm rounded-xl shadow-2xl overflow-hidden shadow-black/50 slide-up">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#2a2a2a] flex justify-between items-center bg-[#111]">
          <h2 className="text-lg font-semibold text-white">Settings</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors bg-[#222] p-1.5 rounded-md hover:bg-[#333]"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-6">
          <div>
            <h3 className="text-sm font-medium text-gray-300 mb-3 uppercase tracking-wider">Data Management</h3>
            <div className="bg-[#222] rounded-lg p-4 border border-[#333]">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-white mb-1">Export Data</div>
                  <div className="text-xs text-gray-500">Download your sessions, subjects, tasks, and flashcards as JSON.</div>
                </div>
                <button
                  onClick={handleExport}
                  disabled={exporting}
                  className="shrink-0 ml-4 bg-[#7c3aed] hover:bg-[#6d28d9] disabled:opacity-50 text-white rounded-lg p-2.5 transition-colors"
                  title="Export to JSON"
                >
                  <Download size={16} />
                </button>
              </div>
            </div>
          </div>
          
          <div className="pb-2">
            <p className="text-xs text-gray-600 italic">
              Note: More settings options (Import, Themes, Notifications) can be added here in the future.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
