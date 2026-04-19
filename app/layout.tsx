import type { Metadata } from "next";
import "./globals.css";
import { getUser } from "@/lib/actions";
import Sidebar from "@/components/sidebar/Sidebar";

export const metadata: Metadata = {
  title: "StudyTrack — Track Your Study Sessions",
  description:
    "A beautiful calendar-based study time tracker. Track your sessions, analyze progress, and build study streaks.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  return (
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
        {user ? (
          <div className="flex h-screen">
            <Sidebar userName={user.name} />
            <main className="flex-1 ml-[185px] flex flex-col h-screen overflow-hidden">
              {children}
            </main>
          </div>
        ) : (
          <>{children}</>
        )}
      </body>
    </html>
  );
}
