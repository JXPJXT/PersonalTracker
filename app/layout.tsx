import type { Metadata } from "next";
import "./globals.css";
import { getUser, getGoals, getTodayStudyTime, getWeekStudyTime } from "@/lib/actions";
import { isAuthenticated } from "@/lib/auth";
import Sidebar from "@/components/sidebar/Sidebar";
import FocusModeWrapper from "@/components/focus/FocusModeWrapper";

export const metadata: Metadata = {
  title: "StudyTrack — Track Your Study Sessions",
  description:
    "A beautiful calendar-based study time tracker. Track your sessions, analyze progress, and build study streaks.",
  manifest: "/manifest.json",
};

export const viewport = {
  themeColor: '#0a0a0a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

import { ClerkProvider } from "@clerk/nextjs";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authed = await isAuthenticated();

  // If not logged in, render children directly (login page)
  if (!authed) {
    return (
      <ClerkProvider>
        <html lang="en">
          <head>
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link
              rel="preconnect"
              href="https://fonts.gstatic.com"
              crossOrigin="anonymous"
            />
            <link
              href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
              rel="stylesheet"
            />
          </head>
          <body>{children}</body>
        </html>
      </ClerkProvider>
    );
  }

  // Authenticated — load user data and render full app
  const user = await getUser();

  const [goals, todayTime, weekTime] = await Promise.all([
    getGoals(user.id),
    getTodayStudyTime(user.id),
    getWeekStudyTime(user.id),
  ]);

  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link
            rel="preconnect"
            href="https://fonts.gstatic.com"
            crossOrigin="anonymous"
          />
          <link
            href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
            rel="stylesheet"
          />
        </head>
        <body>
          <div className="flex h-screen">
            <Sidebar
              user={user}
              goals={goals}
              initialTodayTime={todayTime}
              initialWeekTime={weekTime}
            />
            <main className="flex-1 ml-[185px] flex flex-col h-screen overflow-hidden">
              {children}
            </main>
            <FocusModeWrapper
              subjects={user.subjects.map((s) => ({
                id: s.id,
                name: s.name,
                color: s.color,
              }))}
            />
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}
