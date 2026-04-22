import { getUser, getFlashcardDecks, getDueFlashcards } from "@/lib/actions";
import FlashcardsClient from "./FlashcardsClient";
import { isAuthenticated } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function FlashcardsPage() {
  if (!(await isAuthenticated())) redirect("/login");
  const user = await getUser();

  const decks = await getFlashcardDecks(user.id);
  const dueCards = await getDueFlashcards(user.id);

  const serializedDecks = decks.map((d: any) => ({
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
  }));

  const serializedDueCards = dueCards.map((c: any) => ({
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
  }));

  const subjects = user.subjects.map((s: any) => ({
    id: s.id,
    name: s.name,
    color: s.color,
  }));

  return (
    <FlashcardsClient
      userId={user.id}
      decks={serializedDecks}
      dueCards={serializedDueCards}
      subjects={subjects}
    />
  );
}
