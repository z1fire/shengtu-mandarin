import { env } from "cloudflare:workers";

const createProgressTable = `CREATE TABLE IF NOT EXISTS learner_progress (
  user_id TEXT PRIMARY KEY NOT NULL,
  payload TEXT NOT NULL,
  updated_at INTEGER NOT NULL
)`;

const createProgressHistoryTable = `CREATE TABLE IF NOT EXISTS learner_progress_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  payload TEXT NOT NULL,
  updated_at INTEGER NOT NULL,
  archived_at INTEGER NOT NULL
)`;

const createProgressHistoryIndex = `CREATE INDEX IF NOT EXISTS idx_learner_progress_history_user_archived
  ON learner_progress_history (user_id, archived_at DESC)`;

async function database() {
  if (!env.DB) throw new Error("Progress sync database is unavailable.");
  await env.DB.batch([
    env.DB.prepare(createProgressTable),
    env.DB.prepare(createProgressHistoryTable),
    env.DB.prepare(createProgressHistoryIndex),
  ]);
  return env.DB;
}

export async function readLearnerProgress(userId: string) {
  const db = await database();
  return db.prepare("SELECT payload, updated_at AS updatedAt FROM learner_progress WHERE user_id = ?")
    .bind(userId)
    .first<{ payload: string; updatedAt: number }>();
}

export type ProgressWriteResult =
  | { status: "saved"; updatedAt: number }
  | { status: "conflict"; current: { payload: string; updatedAt: number } | null };

export async function writeLearnerProgress(userId: string, payload: string, expectedUpdatedAt: number): Promise<ProgressWriteResult> {
  const db = await database();
  const current = await db.prepare("SELECT payload, updated_at AS updatedAt FROM learner_progress WHERE user_id = ?")
    .bind(userId)
    .first<{ payload: string; updatedAt: number }>();
  if ((!current && expectedUpdatedAt !== 0) || (current && current.updatedAt !== expectedUpdatedAt)) {
    return { status: "conflict", current: current ?? null };
  }

  if (current?.payload === payload) return { status: "saved", updatedAt: current.updatedAt };

  const updatedAt = Date.now();
  if (!current) {
    const inserted = await db.prepare(`INSERT INTO learner_progress (user_id, payload, updated_at)
      VALUES (?, ?, ?) ON CONFLICT(user_id) DO NOTHING`)
      .bind(userId, payload, updatedAt)
      .run();
    if (!inserted.meta.changes) {
      const latest = await readLearnerProgress(userId);
      return { status: "conflict", current: latest ?? null };
    }
    return { status: "saved", updatedAt };
  }

  const updated = await db.prepare(`UPDATE learner_progress SET payload = ?, updated_at = ?
    WHERE user_id = ? AND updated_at = ?`)
    .bind(payload, updatedAt, userId, expectedUpdatedAt)
    .run();
  if (!updated.meta.changes) {
    const latest = await readLearnerProgress(userId);
    return { status: "conflict", current: latest ?? null };
  }

  await db.batch([
    db.prepare(`INSERT INTO learner_progress_history (user_id, payload, updated_at, archived_at)
      VALUES (?, ?, ?, ?)`)
      .bind(userId, current.payload, current.updatedAt, updatedAt),
    db.prepare(`DELETE FROM learner_progress_history WHERE user_id = ? AND id NOT IN (
      SELECT id FROM learner_progress_history WHERE user_id = ? ORDER BY archived_at DESC, id DESC LIMIT 20
    )`).bind(userId, userId),
  ]);
  return { status: "saved", updatedAt };
}
