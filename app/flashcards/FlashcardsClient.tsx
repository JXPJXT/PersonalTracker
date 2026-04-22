"use client";

import { useState, useTransition } from "react";
import {
  createFlashcardDeck,
  deleteFlashcardDeck,
  createFlashcard,
  updateFlashcard,
  deleteFlashcard,
  reviewFlashcard,
  getFlashcardDecks,
  getDueFlashcards,
} from "@/lib/actions";
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Layers,
  RotateCcw,
  Brain,
  SparklesIcon,
  ChevronRight,
  Check,
  X,
  Pencil,
} from "lucide-react";
import ConfirmModal from "@/components/ui/ConfirmModal";

interface Subject {
  id: string;
  name: string;
  color: string;
}

interface CardData {
  id: string;
  front: string;
  back: string;
  ease: number;
  interval: number;
  repetitions: number;
  nextReview: string;
  lastReview: string | null;
}

interface DeckData {
  id: string;
  name: string;
  subjectId: string | null;
  subject: Subject | null;
  cardCount: number;
  cards: CardData[];
}

interface DueCardData {
  id: string;
  front: string;
  back: string;
  deckId: string;
  deckName: string;
  subjectColor: string;
  subjectName: string | null;
  ease: number;
  interval: number;
  repetitions: number;
  nextReview: string;
}

interface FlashcardsClientProps {
  userId: string;
  decks: DeckData[];
  dueCards: DueCardData[];
  subjects: Subject[];
}

export default function FlashcardsClient({
  userId,
  decks: initialDecks,
  dueCards: initialDueCards,
  subjects,
}: FlashcardsClientProps) {
  const [decks, setDecks] = useState(initialDecks);
  const [dueCards, setDueCards] = useState(initialDueCards);
  const [isPending, startTransition] = useTransition();

  // UI states
  const [showNewDeck, setShowNewDeck] = useState(false);
  const [deckName, setDeckName] = useState("");
  const [deckSubjectId, setDeckSubjectId] = useState<string | null>(null);
  const [expandedDeckId, setExpandedDeckId] = useState<string | null>(null);

  // Modal confirm state
  const [confirmModal, setConfirmModal] = useState<{isOpen: boolean, id: string | null}>({isOpen: false, id: null});

  // New card form
  const [showNewCard, setShowNewCard] = useState<string | null>(null); // deckId
  const [cardFront, setCardFront] = useState("");
  const [cardBack, setCardBack] = useState("");

  // Edit card
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [editFront, setEditFront] = useState("");
  const [editBack, setEditBack] = useState("");

  // Review mode
  const [reviewMode, setReviewMode] = useState(false);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [reviewCards, setReviewCards] = useState<DueCardData[]>([]);

  const refreshData = async () => {
    const freshDecks = await getFlashcardDecks(userId);
    setDecks(
      freshDecks.map((d: any) => ({
        id: d.id,
        name: d.name,
        subjectId: d.subjectId,
        subject: d.subject
          ? { id: d.subject.id, name: d.subject.name, color: d.subject.color }
          : null,
        cardCount: d._count.cards,
        cards: d.cards.map((c: any) => ({
          id: c.id,
          front: c.front,
          back: c.back,
          ease: c.ease,
          interval: c.interval,
          repetitions: c.repetitions,
          nextReview: c.nextReview.toISOString(),
          lastReview: c.lastReview?.toISOString() || null,
        })),
      }))
    );
    const freshDue = await getDueFlashcards(userId);
    setDueCards(
      freshDue.map((c) => ({
        id: c.id,
        front: c.front,
        back: c.back,
        deckId: c.deckId,
        deckName: c.deck.name,
        subjectColor: c.deck.subject?.color || "#666",
        subjectName: c.deck.subject?.name || null,
        ease: c.ease,
        interval: c.interval,
        repetitions: c.repetitions,
        nextReview: c.nextReview.toISOString(),
      }))
    );
  };

  const handleCreateDeck = async () => {
    if (!deckName.trim()) return;
    startTransition(async () => {
      await createFlashcardDeck({
        name: deckName.trim(),
        subjectId: deckSubjectId,
        userId,
      });
      await refreshData();
      setDeckName("");
      setDeckSubjectId(null);
      setShowNewDeck(false);
    });
  };

  const handleDeleteDeck = (id: string) => {
    startTransition(async () => {
      await deleteFlashcardDeck(id);
      await refreshData();
    });
  };

  const handleCreateCard = async (deckId: string) => {
    if (!cardFront.trim() || !cardBack.trim()) return;
    startTransition(async () => {
      await createFlashcard({
        front: cardFront.trim(),
        back: cardBack.trim(),
        deckId,
      });
      await refreshData();
      setCardFront("");
      setCardBack("");
      setShowNewCard(null);
    });
  };

  const handleUpdateCard = async (id: string) => {
    if (!editFront.trim() || !editBack.trim()) return;
    startTransition(async () => {
      await updateFlashcard(id, {
        front: editFront.trim(),
        back: editBack.trim(),
      });
      await refreshData();
      setEditingCardId(null);
    });
  };

  const handleDeleteCard = (id: string) => {
    startTransition(async () => {
      await deleteFlashcard(id);
      await refreshData();
    });
  };

  const startReview = () => {
    setReviewCards([...dueCards]);
    setCurrentReviewIndex(0);
    setShowAnswer(false);
    setReviewMode(true);
  };

  const handleReview = async (quality: number) => {
    const card = reviewCards[currentReviewIndex];
    startTransition(async () => {
      await reviewFlashcard(card.id, quality);
      if (currentReviewIndex < reviewCards.length - 1) {
        setCurrentReviewIndex((i) => i + 1);
        setShowAnswer(false);
      } else {
        setReviewMode(false);
        await refreshData();
      }
    });
  };

  // ─── Review Mode ─────────────────────────────────────────────
  if (reviewMode && reviewCards.length > 0) {
    const card = reviewCards[currentReviewIndex];
    const progress = ((currentReviewIndex + 1) / reviewCards.length) * 100;

    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        {/* Progress bar */}
        <div className="w-full max-w-lg mb-8">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
            <span>
              Card {currentReviewIndex + 1} of {reviewCards.length}
            </span>
            <button
              onClick={() => {
                setReviewMode(false);
                refreshData();
              }}
              className="text-gray-500 hover:text-white transition-colors"
            >
              Exit Review
            </button>
          </div>
          <div className="h-1.5 bg-[#222] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#7c3aed] rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Deck/Subject info */}
        <div className="flex items-center gap-2 mb-4">
          {card.subjectName && (
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: card.subjectColor }}
            />
          )}
          <span className="text-xs text-gray-500">{card.deckName}</span>
        </div>

        {/* Card */}
        <div
          className="w-full max-w-lg cursor-pointer"
          onClick={() => !showAnswer && setShowAnswer(true)}
        >
          <div className="bg-[#222] rounded-2xl border border-[#333] p-8 min-h-[240px] flex flex-col items-center justify-center text-center">
            <p className="text-xs text-gray-500 mb-4 uppercase tracking-wider">
              {showAnswer ? "Answer" : "Question"}
            </p>
            <p className={`text-lg ${showAnswer ? "text-emerald-400" : "text-white"} font-medium leading-relaxed`}>
              {showAnswer ? card.back : card.front}
            </p>
            {!showAnswer && (
              <p className="text-xs text-gray-600 mt-6">Click to reveal answer</p>
            )}
          </div>
        </div>

        {/* Rating buttons */}
        {showAnswer && (
          <div className="mt-6 flex gap-3">
            <button
              onClick={() => handleReview(1)}
              disabled={isPending}
              className="px-5 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm hover:bg-red-500/20 transition-all"
            >
              Again
              <span className="block text-[10px] text-red-400/60 mt-0.5">1 day</span>
            </button>
            <button
              onClick={() => handleReview(3)}
              disabled={isPending}
              className="px-5 py-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm hover:bg-amber-500/20 transition-all"
            >
              Hard
              <span className="block text-[10px] text-amber-400/60 mt-0.5">~3 days</span>
            </button>
            <button
              onClick={() => handleReview(4)}
              disabled={isPending}
              className="px-5 py-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 text-sm hover:bg-blue-500/20 transition-all"
            >
              Good
              <span className="block text-[10px] text-blue-400/60 mt-0.5">~{Math.round(card.interval * card.ease)} days</span>
            </button>
            <button
              onClick={() => handleReview(5)}
              disabled={isPending}
              className="px-5 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm hover:bg-emerald-500/20 transition-all"
            >
              Easy
              <span className="block text-[10px] text-emerald-400/60 mt-0.5">~{Math.round(card.interval * card.ease * 1.3)} days</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  // ─── Main Deck View ──────────────────────────────────────────
  const totalCards = decks.reduce((sum, d) => sum + d.cardCount, 0);

  return (
    <div className="p-8 max-w-3xl mx-auto overflow-y-auto h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Layers size={24} />
            Flashcards
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            {decks.length} decks · {totalCards} cards · {dueCards.length} due for
            review
          </p>
        </div>
        <div className="flex gap-2">
          {dueCards.length > 0 && (
            <button onClick={startReview} className="btn-primary">
              <Brain size={16} />
              Review ({dueCards.length})
            </button>
          )}
          <button
            onClick={() => setShowNewDeck(true)}
            className="btn-ghost"
            disabled={isPending}
          >
            <Plus size={16} />
            New Deck
          </button>
        </div>
      </div>

      {/* Due cards banner */}
      {dueCards.length > 0 && (
        <div className="mb-6 p-4 bg-[#7c3aed]/10 border border-[#7c3aed]/30 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#7c3aed]/20 flex items-center justify-center">
              <SparklesIcon size={18} className="text-[#7c3aed]" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">
                {dueCards.length} card{dueCards.length !== 1 ? "s" : ""} ready for review
              </p>
              <p className="text-xs text-gray-400">
                Spaced repetition keeps your memory sharp
              </p>
            </div>
          </div>
          <button
            onClick={startReview}
            className="flex items-center gap-1 text-sm text-[#7c3aed] hover:text-[#a78bfa] transition-colors"
          >
            Start Review <ChevronRight size={14} />
          </button>
        </div>
      )}

      {/* New deck form */}
      {showNewDeck && (
        <div className="mb-6 p-5 bg-[#222] rounded-xl border border-[#333]">
          <h3 className="text-sm font-medium text-white mb-4">Create Deck</h3>
          <div className="space-y-3">
            <input
              type="text"
              value={deckName}
              onChange={(e) => setDeckName(e.target.value)}
              className="input-field"
              placeholder="Deck name"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateDeck();
                if (e.key === "Escape") setShowNewDeck(false);
              }}
            />
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">
                Subject (optional)
              </label>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setDeckSubjectId(null)}
                  className={`px-2.5 py-1.5 text-xs rounded-lg border transition-all ${
                    deckSubjectId === null
                      ? "border-white/30 bg-white/10 text-white"
                      : "border-[#333] text-gray-500 hover:border-[#444]"
                  }`}
                >
                  None
                </button>
                {subjects.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setDeckSubjectId(s.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg border transition-all ${
                      deckSubjectId === s.id
                        ? "border-white/30 bg-white/10 text-white"
                        : "border-[#333] text-gray-500 hover:border-[#444]"
                    }`}
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
            <div className="flex gap-2 pt-1">
              <button onClick={() => setShowNewDeck(false)} className="btn-ghost">
                Cancel
              </button>
              <button
                onClick={handleCreateDeck}
                className="btn-primary"
                disabled={isPending}
              >
                {isPending ? "Creating…" : "Create Deck"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deck list */}
      <div className="space-y-3">
        {decks.map((deck) => {
          const isExpanded = expandedDeckId === deck.id;
          const dueCount = deck.cards.filter(
            (c) => new Date(c.nextReview) <= new Date()
          ).length;

          return (
            <div
              key={deck.id}
              className="bg-[#222] rounded-xl border border-[#2a2a2a] hover:border-[#333] transition-all group/deck"
            >
              {/* Deck header */}
              <div
                className="flex items-center gap-3 p-4 cursor-pointer"
                onClick={() =>
                  setExpandedDeckId(isExpanded ? null : deck.id)
                }
              >
                {deck.subject && (
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: deck.subject.color }}
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">
                      {deck.name}
                    </span>
                    {dueCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-[#7c3aed]/20 text-[#7c3aed] text-[10px] font-medium">
                        {dueCount} due
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">
                    {deck.cardCount} card{deck.cardCount !== 1 ? "s" : ""}
                    {deck.subject && ` · ${deck.subject.name}`}
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmModal({ isOpen: true, id: deck.id });
                  }}
                  className="p-1.5 hover:bg-red-500/20 rounded opacity-0 group-hover/deck:opacity-100 transition-all"
                >
                  <Trash2 size={13} className="text-red-400" />
                </button>
                {isExpanded ? (
                  <ChevronUp size={14} className="text-gray-400" />
                ) : (
                  <ChevronDown size={14} className="text-gray-400" />
                )}
              </div>

              {/* Expanded: cards list */}
              {isExpanded && (
                <div className="border-t border-[#2a2a2a] px-4 pb-4">
                  <div className="space-y-2 pt-3">
                    {deck.cards.map((card) => {
                      const isEditing = editingCardId === card.id;
                      const isDue = new Date(card.nextReview) <= new Date();

                      if (isEditing) {
                        return (
                          <div
                            key={card.id}
                            className="p-3 bg-[#1a1a1a] rounded-lg space-y-2"
                          >
                            <input
                              type="text"
                              value={editFront}
                              onChange={(e) => setEditFront(e.target.value)}
                              className="input-field text-sm"
                              placeholder="Front (question)"
                              autoFocus
                            />
                            <input
                              type="text"
                              value={editBack}
                              onChange={(e) => setEditBack(e.target.value)}
                              className="input-field text-sm"
                              placeholder="Back (answer)"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => setEditingCardId(null)}
                                className="text-xs text-gray-500 hover:text-white transition-colors"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleUpdateCard(card.id)}
                                className="text-xs text-[#7c3aed] hover:text-[#a78bfa] transition-colors"
                                disabled={isPending}
                              >
                                Save
                              </button>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={card.id}
                          className="flex items-center gap-3 px-3 py-2.5 bg-[#1a1a1a] rounded-lg group/card"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white truncate">
                              {card.front}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {card.back}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {isDue && (
                              <span className="w-2 h-2 rounded-full bg-[#7c3aed] animate-pulse" />
                            )}
                            <span className="text-[10px] text-gray-600">
                              {card.repetitions > 0
                                ? `×${card.repetitions}`
                                : "New"}
                            </span>
                            <button
                              onClick={() => {
                                setEditingCardId(card.id);
                                setEditFront(card.front);
                                setEditBack(card.back);
                              }}
                              className="p-1 hover:bg-[#333] rounded opacity-0 group-hover/card:opacity-100 transition-all"
                            >
                              <Pencil size={11} className="text-gray-400" />
                            </button>
                            <button
                              onClick={() => handleDeleteCard(card.id)}
                              className="p-1 hover:bg-red-500/20 rounded opacity-0 group-hover/card:opacity-100 transition-all"
                            >
                              <Trash2 size={11} className="text-red-400" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Add card form */}
                  {showNewCard === deck.id ? (
                    <div className="mt-3 p-3 bg-[#1a1a1a] rounded-lg space-y-2">
                      <input
                        type="text"
                        value={cardFront}
                        onChange={(e) => setCardFront(e.target.value)}
                        className="input-field text-sm"
                        placeholder="Front (question)"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Escape") setShowNewCard(null);
                        }}
                      />
                      <input
                        type="text"
                        value={cardBack}
                        onChange={(e) => setCardBack(e.target.value)}
                        className="input-field text-sm"
                        placeholder="Back (answer)"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleCreateCard(deck.id);
                          if (e.key === "Escape") setShowNewCard(null);
                        }}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowNewCard(null)}
                          className="text-xs text-gray-500 hover:text-white transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleCreateCard(deck.id)}
                          className="text-xs text-[#7c3aed] hover:text-[#a78bfa] transition-colors"
                          disabled={isPending}
                        >
                          {isPending ? "Adding…" : "Add Card"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setShowNewCard(deck.id);
                        setCardFront("");
                        setCardBack("");
                      }}
                      className="mt-3 flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#7c3aed] transition-colors"
                    >
                      <Plus size={12} />
                      Add card
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty state */}
      {decks.length === 0 && (
        <div className="text-center py-20">
          <Layers size={40} className="text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">No flashcard decks yet</p>
          <p className="text-sm text-gray-600 mt-1">
            Create a deck and add cards to start reviewing
          </p>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title="Delete Deck"
        description="Are you sure you want to delete this deck and all its flashcards? This action cannot be undone."
        onConfirm={() => {
          if (confirmModal.id) {
            handleDeleteDeck(confirmModal.id);
          }
        }}
        onCancel={() => setConfirmModal({ isOpen: false, id: null })}
        danger={true}
      />
    </div>
  );
}
