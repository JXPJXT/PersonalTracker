# Hosting StudyTrack for Free (Student Guide)

As a student, you want to keep costs at absolute $0 while hosting a full-stack Next.js app with a database and image uploads. Vercel is great, but its serverless nature means the local SQLite database (`dev.db`) and local image uploads (`/public/uploads`) will be wiped out repeatedly. 

Here is the exact stack you should use to get StudyTrack online perfectly for **$0/month**.

## 1. The Database: Turso (Free SQLite in the Cloud)
Turso is a cloud database built on SQLite (which is what we are currently using!). This makes it the absolute easiest migration path for StudyTrack.
- **Cost:** Free tier includes 9GB of storage and 1 billion site reads a month.
- **Migration:** 
  1. Go to [turso.tech](https://turso.tech) and create a free account.
  2. Create a new database.
  3. Get your `DATABASE_URL` and `TURSO_AUTH_TOKEN`.
  4. In `prisma/schema.prisma`, change your provider to `sqlite` (already done) but use the LibSQL driver adapter. (I can help you swap the Prisma driver to `libsql` when you are ready).

## 2. Image Uploads: UploadThing or Vercel Blob
AWS S3 is industry standard, but it can accidentally charge you if you mess up permissions. For students, these two alternatives are much safer and easier to use with Next.js:
- **Vercel Blob:** Native to Vercel. Gives you 250MB free per month and avoids setting up complicated AWS buckets.
- **UploadThing:** Created specifically for Next.js developers. Totally free for small apps and has a much better developer experience than AWS S3. 
- **Migration:** We just need to change the `/api/upload/route.ts` I created earlier to upload to one of these services instead of `fs.writeFile`.

## 3. App Hosting: Vercel or Render
- **Vercel:** (Recommended) Next.js is built by Vercel, so it hosts perfectly for free. Connect your GitHub repository, and it auto-deploys.
- **Render:** An alternative if you want a constant server running instead of Vercel's "serverless" model, but Vercel is generally faster and easier.

## 4. Authentication: Clerk (Free)
Right now, the app hardcodes the user session to `cmo6qofa60000p85fkvwol3r0`. If you host this publicly, everyone will share your data!
- **Clerk.com:** Add Clerk for authentication. Their free tier gives you 10,000 active users a month. It provides a drop-in login/signup page and Google OAuth.

---

# 🚀 Room for Improvement (Product Roadmap)

StudyTrack is an incredible local "Second Brain" right now. If you want to continue turning it into a world-class Notion competitor, here are the highest-impact improvements we can make:

### 1. The Global Command Center (Highly Recommended)
Right now, your Habits, Study time, and Sleep are tracked on separate pages. 
- **The Upgrade:** Build a central dashboard that correlates this data. (e.g. "When you sleep 8+ hours, your focus study time increases by 20%").
- **Widgets:** A drag-and-drop grid page containing your active tasks, today's schedule, and pending flashcards all in one view.

### 2. BlockNote Editor Upgrades
We have the Notion editor, but we can make it even smarter:
- **Bi-directional linking:** Typing `[[` inside the editor brings up a pop-up to link to another note.
- **Database Embeds:** Allowing users to type `/tasks` inside a note and embedding a mini task-board directly into the page.

### 3. Flashcards Spaced Repetition (AI)
Currently, Flashcards use a standard interval. 
- **The Upgrade:** Pass your study metrics to an AI model to dynamically generate new flashcards from your Notes, or dynamically adjust the difficulty gradient based on your sleep log from the Habit tracker.

### 4. Advanced Graph View
The Knowledge Map is a great start. 
- **The Upgrade:** Add physics to the map so nodes repel each other (like Obsidian), and allow filtering the graph by Subject or clicking a node to slide open the Document Editor overlay on the right side of the screen.

### Next Steps...
If you're ready to host, I can rewrite the database Prisma adapter for Turso and update the Image Uploads to Vercel right now! Just say the word.
