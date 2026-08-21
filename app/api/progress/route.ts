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
  const body = await request.json() as { progress?: unknown };
  if (!body.progress || typeof body.progress !== "object") {
    return Response.json({ error: "A progress object is required." }, { status: 400 });
  }
  const payload = JSON.stringify(body.progress);
  if (payload.length > 5_000_000) return Response.json({ error: "Progress backup is too large." }, { status: 413 });
  const updatedAt = await writeLearnerProgress(user.userId, payload);
  return Response.json({ available: true, updatedAt });
}
