# StudyTrack — Feature Analysis & Roadmap

## ✅ What's Built (Current State)

| Feature | Status |
|---|---|
| Weekly calendar grid (Mon-Sun, 24h) | ✅ |
| Sidebar navigation | ✅ |
| Timer (start/stop, persists via Zustand) | ✅ |
| Time entry CRUD (create, edit, delete) | ✅ |
| Editable start/stop times (5-min intervals) | ✅ |
| Session notes | ✅ |
| Subjects with color coding | ✅ |
| Tasks with priority + due dates | ✅ |
| Reports (pie chart, heatmap, streak) | ✅ |
| Current time line indicator | ✅ |
| Keyboard shortcuts (T, S, ←, →) | ✅ |
| Dark theme | ✅ |

---

## 🔥 High-Impact Additions (Recommended Next)

### 1. **Pomodoro Mode**
- 25/5 or 50/10 configurable work/break cycles
- Audio notification when timer ends
- Auto-log completed pomodoros as time entries
- *Why*: #1 requested feature in study trackers

### 2. **Daily/Weekly Goals**
- Set target hours per day or per week (e.g. "Study 4h/day")
- Progress bar in sidebar or top bar
- *Why*: Goal-driven motivation, visible in every view

### 3. **Drag & Resize Calendar Entries**
- Drag entry bars to move them between days/times
- Resize by dragging top/bottom edges
- *Why*: Core UX expected from any calendar-based tracker

### 4. **Recurring Sessions**
- Template sessions that repeat (e.g. "Physics Lecture every Tue/Thu 10–11:30 AM")
- One-click to mark as completed
- *Why*: Students have fixed schedules

### 5. **Export/Import Data**
- Export as CSV/JSON for backup
- Import from Toggl, Clockify
- *Why*: Data portability, zero lock-in

---

## 📊 Analytics Enhancements

### 6. **Subject Breakdown Over Time** (Line Chart)
- Weekly trend: hours per subject across 4-8 weeks
- Spot which subjects are neglected

### 7. **Daily Distribution Heatmap**
- GitHub-style but show *which hours* you study most (morning vs night)
- Helps identify optimal study windows

### 8. **Exam Countdown Widget**
- Add exam dates → show "12 days until Physics Final"
- Auto-calculate recommended daily hours to reach goal

### 9. **Streak & Badges System**
- 7-day streak 🔥, 30-day streak, 100-hour milestone
- Gamification increases retention

---

## 🧠 Productivity Features

### 10. **Focus Mode / Do Not Disturb**
- Fullscreen timer overlay, hides everything else
- Optional ambient sounds (rain, café, lo-fi)
- Block notifications reminder

### 11. **Session Flashcards / Quick Review**
- Attach flashcards to a study session
- Review them when the session ends
- Spaced repetition scheduling

### 12. **Task ↔ Session Linking**
- Link tasks to time entries ("I worked on this task during this session")
- Track how much time each task consumed
- Auto-complete tasks after X hours logged

### 13. **Smart Suggestions**
- "You haven't studied Chemistry in 5 days"
- "You study best between 9-11 AM — block time?"
- Based on historical patterns

---

## 🎨 UX/UI Polish

### 14. **List View for Calendar** 
- The "List View" tab exists but doesn't work yet
- Show entries as a flat chronological list grouped by day

### 15. **Multi-Day View (Day/3-Day/Week)**
- Toggle between 1-day, 3-day, 7-day views
- Day view = more detail, week = overview

### 16. **Color Theme Picker**
- Dark/Light/OLED black modes
- Accent color customization beyond purple

### 17. **Mobile Responsive Layout**
- Collapsible sidebar on mobile
- Swipe to navigate weeks
- Bottom tab bar navigation

### 18. **Onboarding Walkthrough**
- First-time tooltip tour highlighting key features
- Currently just shows a name form

---

## 🔧 Technical/Infra

### 19. **PWA + Offline Support**
- Service worker, manifest.json
- Cache entries locally → sync when online
- Installable on phone home screen

### 20. **Data Backup / Sync**
- Auto-backup SQLite to cloud (Google Drive, Dropbox)
- Or add multi-device sync via Turso/Supabase

### 21. **Undo/Redo**
- Ctrl+Z to undo last delete/edit
- Toast notification: "Entry deleted — Undo"

---

## 🏆 Priority Recommendation

| Priority | Feature | Effort |
|---|---|---|
| 🥇 | Pomodoro Mode | Medium |
| 🥇 | Daily/Weekly Goals | Small |
| 🥇 | Drag & Resize Entries | Large |
| 🥈 | List View | Small |
| 🥈 | Task ↔ Session Linking | Medium |
| 🥈 | Subject Trend Chart | Small |
| 🥈 | Exam Countdown | Small |
| 🥉 | Focus Mode | Medium |
| 🥉 | PWA/Offline | Medium |
| 🥉 | Recurring Sessions | Medium |

> **My recommendation**: Start with **Daily Goals + Pomodoro Mode** — they're the highest-value, lowest-effort combo that transforms StudyTrack from "a tracker" into "a study system."
