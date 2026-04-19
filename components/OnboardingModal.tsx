"use client";

import { useState } from "react";
import { createUser } from "@/lib/actions";
import { BookOpen } from "lucide-react";
import { useRouter } from "next/navigation";

export default function OnboardingModal() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    setLoading(true);
    await createUser(name.trim(), email.trim());
    router.refresh();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card max-w-[400px]">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-[#7c3aed]/20 flex items-center justify-center mx-auto mb-4">
            <BookOpen size={32} className="text-[#7c3aed]" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">
            Welcome to StudyTrack 📚
          </h1>
          <p className="text-sm text-gray-400">
            Track your study sessions with a beautiful calendar view
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Name</label>
            <input
              type="text"
              className="input-field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              autoFocus
              required
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1.5 block">Email</label>
            <input
              type="email"
              className="input-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
            />
            <p className="text-[10px] text-gray-600 mt-1">
              Stored locally only — never sent anywhere
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || !name.trim() || !email.trim()}
            className="btn-primary w-full mt-2"
          >
            {loading ? "Setting up…" : "Get Started →"}
          </button>
        </form>
      </div>
    </div>
  );
}
