export type ReviewGrade = "again" | "hard" | "good" | "easy";

export type ReviewState = {
  dueAt: number;
  intervalDays: number;
  repetitions: number;
  lapses: number;
  lastReviewedAt: number;
};

export type ExamAttempt = {
  date: string;
  score: number;
  correct: number;
  total: number;
};

export type Progress = {
  version: 3;
  startedAt: string;
  streak: number;
  xp: number;
  minutes: number;
  mastered: number[];
  missions: number[];
  missionSteps: string[];
  daily: string[];
  dailyDate: string;
  lastActive: string;
  reviews: Record<string, ReviewState>;
  earned: string[];
  dailyNew: number;
  showPinyin: boolean;
  onboarded: boolean;
  dailyQueue: number[];
  dailyQueueDate: string;
  cardPosition: number;
  listeningDone: string[];
  builderDone: string[];
  pronunciationDone: string[];
  examHistory: ExamAttempt[];
};

export const DAY_MS = 86_400_000;

export function localDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function daysBetween(from: string, to: string) {
  const [fy, fm, fd] = from.split("-").map(Number);
  const [ty, tm, td] = to.split("-").map(Number);
  return Math.round((Date.UTC(ty, tm - 1, td) - Date.UTC(fy, fm - 1, fd)) / DAY_MS);
}

export function makeStarterProgress(date = localDate()): Progress {
  return {
    version: 3,
    startedAt: date,
    streak: 0,
    xp: 0,
    minutes: 0,
    mastered: [],
    missions: [],
    missionSteps: [],
    daily: [],
    dailyDate: date,
    lastActive: "",
    reviews: {},
    earned: [],
    dailyNew: 8,
    showPinyin: true,
    onboarded: false,
    dailyQueue: [],
    dailyQueueDate: "",
    cardPosition: 0,
    listeningDone: [],
    builderDone: [],
    pronunciationDone: [],
    examHistory: [],
  };
}

export function buildDailyQueue(progress: Progress, vocabularySize: number, now = Date.now()) {
  const due = Object.entries(progress.reviews)
    .filter(([, review]) => review.dueAt <= now)
    .sort((a, b) => a[1].dueAt - b[1].dueAt)
    .slice(0, 24)
    .map(([index]) => Number(index));
  const dueSet = new Set(due);
  const unseen: number[] = [];
  for (let index = 0; index < vocabularySize && unseen.length < progress.dailyNew; index += 1) {
    if (!progress.reviews[index] && !dueSet.has(index)) unseen.push(index);
  }
  return [...due, ...unseen];
}

export function normalizeProgress(raw: unknown, vocabularySize: number, date = localDate()): Progress {
  const starter = makeStarterProgress(date);
  if (!raw || typeof raw !== "object") return starter;
  const legacy = raw as Partial<Progress> & { lastVisit?: string };
  const migratedMissionSteps = Array.isArray(legacy.missionSteps)
    ? legacy.missionSteps
    : Array.from({ length: (legacy.missions?.length ?? 0) * 3 }, (_, index) => `${Math.floor(index / 3)}:${index % 3}`);
  const reviews = { ...(legacy.reviews ?? {}) };
  for (const index of legacy.mastered ?? []) {
    if (!reviews[index]) {
      reviews[index] = {
        dueAt: Date.now() + 7 * DAY_MS,
        intervalDays: 7,
        repetitions: 3,
        lapses: 0,
        lastReviewedAt: Date.now(),
      };
    }
  }
  const dailyDate = legacy.dailyDate === date ? date : date;
  const progress: Progress = {
    ...starter,
    ...legacy,
    version: 3,
    reviews,
    missionSteps: migratedMissionSteps,
    daily: legacy.dailyDate === date ? legacy.daily ?? [] : [],
    dailyDate,
    listeningDone: legacy.dailyDate === date ? legacy.listeningDone ?? [] : [],
    builderDone: legacy.dailyDate === date ? legacy.builderDone ?? [] : [],
    pronunciationDone: legacy.dailyDate === date ? legacy.pronunciationDone ?? [] : [],
    lastActive: legacy.lastActive ?? legacy.lastVisit ?? "",
    dailyNew: [5, 8, 10].includes(Number(legacy.dailyNew)) ? Number(legacy.dailyNew) : 8,
    earned: Array.isArray(legacy.earned) ? legacy.earned.slice(-1800) : [],
    examHistory: Array.isArray(legacy.examHistory) ? legacy.examHistory.slice(-20) : [],
  };
  if (legacy.dailyQueueDate !== date || !Array.isArray(legacy.dailyQueue)) {
    progress.dailyQueue = buildDailyQueue(progress, vocabularySize);
    progress.dailyQueueDate = date;
    progress.cardPosition = 0;
  } else {
    progress.dailyQueue = legacy.dailyQueue.filter((index) => Number.isInteger(index) && index >= 0 && index < vocabularySize);
    progress.cardPosition = Math.min(Number(legacy.cardPosition) || 0, progress.dailyQueue.length);
  }
  return progress;
}

export function activate(progress: Progress, date = localDate()): Progress {
  if (progress.lastActive === date) return progress;
  const gap = progress.lastActive ? daysBetween(progress.lastActive, date) : 0;
  return {
    ...progress,
    streak: gap === 1 ? progress.streak + 1 : 1,
    lastActive: date,
  };
}

export function earnOnce(progress: Progress, key: string, amount: number, date = localDate()) {
  const active = activate(progress, date);
  if (active.earned.includes(key)) return active;
  return { ...active, xp: active.xp + amount, earned: [...active.earned, key].slice(-1800) };
}

export function completeDailyStep(progress: Progress, id: string, minutes: number, date = localDate()) {
  const active = activate(progress, date);
  if (active.daily.includes(id)) return active;
  return { ...active, daily: [...active.daily, id], minutes: active.minutes + minutes };
}

export function scheduleReview(previous: ReviewState | undefined, grade: ReviewGrade, now = Date.now()): ReviewState {
  const repetitions = previous?.repetitions ?? 0;
  const priorInterval = previous?.intervalDays ?? 0;
  let intervalDays = 0;
  let dueAt = now + 60_000;
  let nextRepetitions = repetitions;
  let lapses = previous?.lapses ?? 0;

  if (grade === "again") {
    nextRepetitions = 0;
    lapses += 1;
  } else if (grade === "hard") {
    intervalDays = Math.max(1, Math.round(priorInterval * 1.2) || 1);
    dueAt = now + intervalDays * DAY_MS;
    nextRepetitions += 1;
  } else if (grade === "good") {
    intervalDays = repetitions === 0 ? 2 : Math.max(2, Math.round(priorInterval * 2.2));
    dueAt = now + intervalDays * DAY_MS;
    nextRepetitions += 1;
  } else {
    intervalDays = repetitions === 0 ? 7 : Math.max(7, Math.round(priorInterval * 3.2));
    dueAt = now + intervalDays * DAY_MS;
    nextRepetitions += 1;
  }

  return { dueAt, intervalDays, repetitions: nextRepetitions, lapses, lastReviewedAt: now };
}

export function similarityScore(expected: string, heard: string) {
  const clean = (value: string) => value.replace(/[\s，。！？,.!?、]/g, "").toLowerCase();
  const source = clean(expected);
  const target = clean(heard);
  if (!source || !target) return 0;
  const rows = source.length + 1;
  const cols = target.length + 1;
  const matrix = Array.from({ length: rows }, () => Array<number>(cols).fill(0));
  for (let row = 0; row < rows; row += 1) matrix[row][0] = row;
  for (let col = 0; col < cols; col += 1) matrix[0][col] = col;
  for (let row = 1; row < rows; row += 1) {
    for (let col = 1; col < cols; col += 1) {
      matrix[row][col] = Math.min(
        matrix[row - 1][col] + 1,
        matrix[row][col - 1] + 1,
        matrix[row - 1][col - 1] + (source[row - 1] === target[col - 1] ? 0 : 1),
      );
    }
  }
  return Math.max(0, Math.round((1 - matrix[source.length][target.length] / Math.max(source.length, target.length)) * 100));
}
