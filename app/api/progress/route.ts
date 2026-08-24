import { getChatGPTUser } from "../../chatgpt-auth";
import { readLearnerProgress, writeLearnerProgress } from "../../../db/progress";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ available: false }, { status: 401 });
  const saved = await readLearnerProgress(user.userId);
  let progress: unknown = null;
  if (saved) {
    try {
      progress = JSON.parse(saved.payload);
    } catch {
      progress = null;
    }
  }
  return Response.json({
    available: true,
    user: { displayName: user.displayName, email: user.email },
    progress,
    updatedAt: saved?.updatedAt ?? 0,
  });
}

export async function PUT(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({ available: false }, { status: 401 });
  const body = await request.json() as { progress?: unknown; expectedUpdatedAt?: unknown };
  if (!body.progress || typeof body.progress !== "object") {
    return Response.json({ error: "A progress object is required." }, { status: 400 });
  }
  const expectedUpdatedAt = Number(body.expectedUpdatedAt);
  if (!Number.isFinite(expectedUpdatedAt) || expectedUpdatedAt < 0) {
    return Response.json({ error: "Refresh this app before syncing progress." }, { status: 428 });
  }
  const payload = JSON.stringify(body.progress);
  if (payload.length > 5_000_000) return Response.json({ error: "Progress backup is too large." }, { status: 413 });
  const result = await writeLearnerProgress(user.userId, payload, expectedUpdatedAt);
  if (result.status === "conflict") {
    let progress: unknown = null;
    try { progress = result.current ? JSON.parse(result.current.payload) : null; } catch { progress = null; }
    return Response.json({ available: true, conflict: true, progress, updatedAt: result.current?.updatedAt ?? 0 }, { status: 409 });
  }
  return Response.json({ available: true, updatedAt: result.updatedAt });
}
