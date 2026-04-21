# 🧠 StudyTracker
**The Ultimate Self-Hosted Second Brain & Productivity Hub**

StudyTracker is a unified workspace designed to replace Notion, Anki, Forest, and Apple Journal—all in one hyper-fast, offline-first local application. Built with Next.js, Prisma, and wrapped seamlessly in Electron, it gives you full control over your data without sacrificing premium aesthetics.

![StudyTracker Architecture UI](https://via.placeholder.com/1000x500?text=StudyTracker+Second+Brain)

## ✨ Core Modules

- 📝 **Notion-Style Documents:** A flawless, block-based rich text editor featuring bi-directional `/` commands, drag-and-drop mechanics, embedded covers, icons, and infinite sub-page nesting.
- ⏱️ **Focus Mode (Flow State):** A distraction-free, fullscreen timer overlay mimicking *Forest*. Features ambient audio (Lo-Fi, Rain, Café), dynamic breathing animations, and deep-work duration tracking.
- ✅ **Task Management:** Real-time synchronization of priorities, due dates, and auto-completing study sessions.
- 🗂️ **Spaced Repetition (Flashcards):** Built-in native flashcards with spaced repetition algorithms linked directly to your active study subjects.
- 📖 **Daily Journal & Habits:** Comprehensive heatmaps, GitHub-style contribution graphs, and daily reflection widgets.
- 📊 **Global Command Center:** A heavily optimized, dashboard aggregating real-time data from every module into a unified morning briefing.

## 🛠 Tech Stack
- **Frontend:** Next.js 14 (App Router), React, Tailwind CSS, Lucide Icons
- **Backend:** Prisma ORM, Local SQLite (`dev.db`), Server Actions
- **Desktop Wrapper:** Electron, Concurrently
- **Rich Text:** BlockNote React
- **Charts:** Recharts

---

## 🚀 Getting Started

If you are cloning this repository to run on your own machine, you only need **Node.js** installed. No complicated Python or Rust build tools are required!

### 1. Installation
Clone the repository and install all Node dependencies:
```bash
git clone https://github.com/YourUsername/PersonalTracker.git
cd PersonalTracker
npm install
```

### 2. Database Setup
Since user data is strictly local, you need to instantiate your personal SQLite database:
```bash
npx prisma generate
npx prisma db push
```

*(Optional)* If you want to populate the database with demo data, run:
```bash
npm run prisma:seed
```

### 3. Running the App

You have two ways to run the application depending on your workflow:

#### A. Web Browser Mode
To run it like a standard local web app:
```bash
npm run dev
```
Then navigate to `http://localhost:3000` in Google Chrome or Edge.

#### B. Native Desktop Application (Recommended)
To run StudyTracker as a standalone, distraction-free desktop application:
```bash
npm run desktop
```
This will automatically boot the database, initialize the Next.js server, and bind it to a native Chromium Electron window.

---

## 💻 Building the Stealth Windows Launcher (`.exe`)

For maximum convenience on Windows, you can compile the incredibly lightweight `StudyTrackerLauncher.cs` script into a clean `.exe` application. This launcher silently boots the Next/Electron stack without leaving an ugly, black terminal window open on your screen!

Ensure you have run `npm install` first, then run this command native to Windows to generate the launcher:

```CMD
C:\Windows\Microsoft.NET\Framework64\v4.0.30319\csc.exe -target:winexe -out:StudyTracker.exe StudyTrackerLauncher.cs
```

You can now pin `StudyTracker.exe` to your Windows Taskbar and launch your entire Second Brain with one double-click.

---

## 🤝 Contributing
Feel free to fork this project and submit pull requests. Future roadmap items include:
- Interactive Kanban Boards for the Task module.
- True physics-based Force Graph view for bi-directional link visualization.
- Cross-device syncing via Turso & Vercel Blob integrations.

## 📄 License
MIT License - Free to use, modify, and distribute for your own personal productivity journey.
