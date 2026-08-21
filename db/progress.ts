import { env } from "cloudflare:workers";

const createProgressTable = `CREATE TABLE IF NOT EXISTS learner_progress (
  user_id TEXT PRIMARY KEY NOT NULL,
  payload TEXT NOT NULL,
  updated_at INTEGER NOT NULL
)`;

async function database() {
  if (!env.DB) throw new Error("Progress sync database is unavailable.");
  await env.DB.prepare(createProgressTable).run();
  return env.DB;
}

export async function readLearnerProgress(userId: string) {
  const db = await database();
  return db.prepare("SELECT payload, updated_at AS updatedAt FROM learner_progress WHERE user_id = ?")
    .bind(userId)
    .first<{ payload: string; updatedAt: number }>();
}

export async function writeLearnerProgress(userId: string, payload: string) {
  const db = await database();
  const updatedAt = Date.now();
  await db.prepare(`INSERT INTO learner_progress (user_id, payload, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET payload = excluded.payload, updated_at = excluded.updated_at`)
    .bind(userId, payload, updatedAt)
    .run();
  return updatedAt;
}
