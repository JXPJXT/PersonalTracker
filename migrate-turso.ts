import { createClient } from "@libsql/client";
import * as fs from "fs";
import "dotenv/config";

const client = createClient({
  url: process.env.DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

async function main() {
  const sql = fs.readFileSync("schema.sql", "utf-8");
  // Split by ; and execute one by one
  const statements = sql
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const stmt of statements) {
    const cleanStmt = stmt.split("\n").filter(line => !line.startsWith("--")).join("\n").trim();
    if (!cleanStmt || cleanStmt.toUpperCase().startsWith("PRAGMA")) continue;
    try {
      console.log(`Executing: ${cleanStmt.substring(0, 50)}...`);
      await client.execute(cleanStmt);
    } catch (e: any) {
      if (e.message.includes("already exists")) {
        console.log(`Skipped: ${e.message}`);
      } else {
        console.error(`Error executing ${stmt.substring(0, 50)}...: ${e.message}`);
      }
    }
  }
  console.log("Migration complete.");
}

main().catch(console.error);
