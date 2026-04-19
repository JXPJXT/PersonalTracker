import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";
import {
  startOfWeek,
  addDays,
  setHours,
  setMinutes,
} from "date-fns";

const dbPath = path.join(process.cwd(), "dev.db");
const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Clean existing data
  await prisma.timeEntry.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.user.deleteMany();

  // Create user
  const user = await prisma.user.create({
    data: {
      name: "Student",
      email: "student@studytrack.local",
    },
  });

  // Create subjects
  const subjects = await Promise.all([
    prisma.subject.create({
      data: { name: "Mathematics", color: "#7c3aed", userId: user.id },
    }),
    prisma.subject.create({
      data: { name: "Physics", color: "#2563eb", userId: user.id },
    }),
    prisma.subject.create({
      data: { name: "Chemistry", color: "#16a34a", userId: user.id },
    }),
    prisma.subject.create({
      data: { name: "Programming", color: "#ea580c", userId: user.id },
    }),
  ]);

  // Get current week's Friday
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
  const friday = addDays(weekStart, 4); // Friday

  // Create sample entries on Friday
  const entries = [
    {
      description: "Linear Algebra - Eigenvalues",
      start: setMinutes(setHours(friday, 8), 0),
      stop: setMinutes(setHours(friday, 9), 30),
      subject: subjects[0], // Mathematics
    },
    {
      description: "Quantum Mechanics Lecture",
      start: setMinutes(setHours(friday, 10), 0),
      stop: setMinutes(setHours(friday, 11), 45),
      subject: subjects[1], // Physics
    },
    {
      description: "Organic Chemistry Lab Report",
      start: setMinutes(setHours(friday, 13), 0),
      stop: setMinutes(setHours(friday, 14), 30),
      subject: subjects[2], // Chemistry
    },
    {
      description: "React & TypeScript Project",
      start: setMinutes(setHours(friday, 15), 0),
      stop: setMinutes(setHours(friday, 17), 0),
      subject: subjects[3], // Programming
    },
  ];

  for (const entry of entries) {
    const durationInSeconds = Math.floor(
      (entry.stop.getTime() - entry.start.getTime()) / 1000
    );
    await prisma.timeEntry.create({
      data: {
        description: entry.description,
        start: entry.start,
        stop: entry.stop,
        durationInSeconds,
        subjectId: entry.subject.id,
        userId: user.id,
      },
    });
  }

  console.log("✅ Seed data created successfully!");
  console.log(`   User: ${user.name} (${user.email})`);
  console.log(`   Subjects: ${subjects.map((s) => s.name).join(", ")}`);
  console.log(`   Time entries: ${entries.length} entries on Friday`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
