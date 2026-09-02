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

export type HskLevel = "1" | "2" | "3" | "4" | "5" | "6" | "7-9";

export type SkillArea = "vocabulary" | "grammar" | "listening" | "reading" | "sentence" | "speaking";

export type SkillStat = {
  attempts: number;
  correct: number;
  lastPracticed: string;
};

export type CorrectionItem = {
  id: string;
  level: HskLevel;
  skill: SkillArea;
  prompt: string;
  answer: string;
  options: string[];
  explanation: string;
  dueDate: string;
  correctStreak: number;
  misses: number;
};

export type StudyDay = {
  date: string;
  vocabularyQueue: number[];
  grammarQueue: number[];
  missionIndex: number;
  missionPhase: number;
  completedSteps: string[];
  replayCount: number;
};

export type LevelArchive = {
  mastered: number[];
  grammarMastered: number[];
  missions: number[];
  missionSteps: string[];
  missionSessionCount: number;
  daily: string[];
  dailyDate: string;
  cadenceDate: string;
  sessionCompletedDate: string;
  reviews: Record<string, ReviewState>;
  grammarReviews: Record<string, ReviewState>;
  earned: string[];
  dailyQueue: number[];
  dailyQueueDate: string;
  flashcardPosition: number;
  cardPosition: number;
  grammarQueue: number[];
  grammarQueueDate: string;
  grammarPosition: number;
  listeningDone: string[];
  builderDone: string[];
  pronunciationDone: string[];
  examHistory: ExamAttempt[];
};

export type Progress = {
  version: 13;
  selectedLevel: HskLevel;
  graduatedLevels: HskLevel[];
  levelArchives: Partial<Record<HskLevel, LevelArchive>>;
  studyHistory: Partial<Record<HskLevel, StudyDay[]>>;
  startedAt: string;
  streak: number;
  xp: number;
  /** Legacy fixed-time estimate retained only for backward-compatible backups. */
  minutes: number;
  trainingSeconds: number;
  trainingTodaySeconds: number;
  trainingDate: string;
  mastered: number[];
  grammarMastered: number[];
  missions: number[];
  missionSteps: string[];
  missionSessionCount: number;
  daily: string[];
  dailyDate: string;
  cadenceDate: string;
  sessionCompletedDate: string;
  lastActive: string;
  reviews: Record<string, ReviewState>;
  grammarReviews: Record<string, ReviewState>;
  earned: string[];
  dailyNew: number;
  showPinyin: boolean;
  onboarded: boolean;
  dailyQueue: number[];
  dailyQueueDate: string;
  flashcardPosition: number;
  cardPosition: number;
  grammarQueue: number[];
  grammarQueueDate: string;
  grammarPosition: number;
  listeningDone: string[];
  builderDone: string[];
  pronunciationDone: string[];
  examHistory: ExamAttempt[];
  skillStats: Record<string, SkillStat>;
  corrections: CorrectionItem[];
  pinyinConfidence: Record<string, number>;
};

export const DAY_MS = 86_400_000;
const HSK_LEVELS: HskLevel[] = ["1", "2", "3", "4", "5", "6", "7-9"];
const STUDY_HISTORY_LIMIT = 120;
const DAILY_STEP_IDS = ["flashcards", "review", "grammar", "listen", "build", "reading", "speak"] as const;

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

function isStudyDate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function addStudyDays(date: string, days: number) {
  const base = isStudyDate(date) ? new Date(`${date}T12:00:00`) : new Date();
  base.setDate(base.getDate() + days);
  return localDate(base);
}

export function studyDateTimestamp(date: string) {
  const timestamp = new Date(`${date}T12:00:00`).getTime();
  return Number.isFinite(timestamp) ? timestamp : Date.now();
}

export function isStudySessionComplete(daily: unknown): boolean {
  if (!Array.isArray(daily)) return false;
  const completed = new Set(daily);
  return DAILY_STEP_IDS.every((step) => completed.has(step));
}

function cleanDailySteps(daily: unknown) {
  const steps = Array.isArray(daily)
    ? [...new Set(daily.filter((step): step is string => DAILY_STEP_IDS.includes(step as typeof DAILY_STEP_IDS[number])))]
    : [];
  if (steps.includes("review") && !steps.includes("flashcards")) steps.unshift("flashcards");
  return steps;
}

export function makeStarterProgress(date = localDate()): Progress {
  return {
    version: 13,
    selectedLevel: "1",
    graduatedLevels: [],
    levelArchives: {},
    studyHistory: {},
    startedAt: date,
    streak: 0,
    xp: 0,
    minutes: 0,
    trainingSeconds: 0,
    trainingTodaySeconds: 0,
    trainingDate: date,
    mastered: [],
    grammarMastered: [],
    missions: [],
    missionSteps: [],
    missionSessionCount: 0,
    daily: [],
    dailyDate: date,
    cadenceDate: date,
    sessionCompletedDate: "",
    lastActive: "",
    reviews: {},
    grammarReviews: {},
    earned: [],
    dailyNew: 8,
    showPinyin: true,
    onboarded: false,
    dailyQueue: [],
    dailyQueueDate: "",
    flashcardPosition: 0,
    cardPosition: 0,
    grammarQueue: [],
    grammarQueueDate: "",
    grammarPosition: 0,
    listeningDone: [],
    builderDone: [],
    pronunciationDone: [],
    examHistory: [],
    skillStats: {},
    corrections: [],
    pinyinConfidence: {},
  };
}

function cleanIndexList(value: unknown) {
  return Array.isArray(value)
    ? [...new Set(value.filter((index): index is number => Number.isInteger(index) && index >= 0))]
    : [];
}

export function uniqueQueueState(value: unknown, position: unknown, itemCount: number) {
  const raw = Array.isArray(value)
    ? value.filter((index): index is number => Number.isInteger(index) && index >= 0 && index < itemCount)
    : [];
  const completedCount = Math.max(0, Math.min(raw.length, Number(position) || 0));
  const completed = new Set(cleanIndexList(raw.slice(0, completedCount)));
  const queue = cleanIndexList(raw);
  const nextPosition = queue.findIndex((index) => !completed.has(index));
  return { queue, position: nextPosition < 0 ? queue.length : nextPosition };
}

function cleanStudyDay(value: unknown): StudyDay | null {
  if (!value || typeof value !== "object") return null;
  const day = value as Partial<StudyDay>;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(day.date))) return null;
  const completedSteps = Array.isArray(day.completedSteps)
    ? [...new Set(day.completedSteps.filter((step): step is string => ["flashcards", "review", "grammar", "listen", "build", "reading", "speak"].includes(String(step))))]
    : [];
  if (completedSteps.includes("review") && !completedSteps.includes("flashcards")) completedSteps.unshift("flashcards");
  return {
    date: String(day.date),
    vocabularyQueue: cleanIndexList(day.vocabularyQueue),
    grammarQueue: cleanIndexList(day.grammarQueue),
    missionIndex: Math.max(0, Math.min(11, Number(day.missionIndex) || 0)),
    missionPhase: Math.max(0, Math.min(2, Number(day.missionPhase) || 0)),
    completedSteps,
    replayCount: Math.max(0, Number(day.replayCount) || 0),
  };
}

function mergeStudyDays(...groups: StudyDay[][]) {
  const merged = new Map<string, StudyDay>();
  for (const day of groups.flat()) {
    const prior = merged.get(day.date);
    merged.set(day.date, prior ? {
      ...prior,
      ...day,
      vocabularyQueue: [...new Set([...prior.vocabularyQueue, ...day.vocabularyQueue])],
      grammarQueue: [...new Set([...prior.grammarQueue, ...day.grammarQueue])],
      completedSteps: [...new Set([...prior.completedSteps, ...day.completedSteps])],
      replayCount: Math.max(prior.replayCount, day.replayCount),
    } : day);
  }
  return [...merged.values()].sort((a, b) => a.date.localeCompare(b.date)).slice(-STUDY_HISTORY_LIMIT);
}

function inferStudyDays(earned: unknown) {
  if (!Array.isArray(earned)) return [];
  const days = new Map<string, StudyDay>();
  const getDay = (date: string) => {
    const existing = days.get(date);
    if (existing) return existing;
    const created: StudyDay = { date, vocabularyQueue: [], grammarQueue: [], missionIndex: 0, missionPhase: 0, completedSteps: [], replayCount: 0 };
    days.set(date, created);
    return created;
  };
  for (const key of earned) {
    if (typeof key !== "string") continue;
    const dated = key.match(/^(\d{4}-\d{2}-\d{2}):(.*)$/);
    if (!dated) continue;
    const [, date, action] = dated;
    const review = action.match(/^review:(\d+)$/);
    const grammar = action.match(/^daily-grammar:(\d+)$/);
    const mission = action.match(/^mission-(listen|build):(\d+):(\d+)$/);
    const reading = action.match(/^reading:(\d+):(\d+)$/);
    const checkpoint = action.match(/^mission-checkpoint:(\d+):(\d+):(\d+)$/);
    if (!review && !grammar && !mission && !reading && !checkpoint) continue;
    const day = getDay(date);
    if (review) {
      day.vocabularyQueue.push(Number(review[1]));
      if (!day.completedSteps.includes("flashcards")) day.completedSteps.push("flashcards");
      if (!day.completedSteps.includes("review")) day.completedSteps.push("review");
    } else if (grammar) {
      day.grammarQueue.push(Number(grammar[1]));
      if (!day.completedSteps.includes("grammar")) day.completedSteps.push("grammar");
    } else if (mission) {
      day.missionIndex = Number(mission[2]);
      day.missionPhase = Number(mission[3]);
      const step = mission[1] === "listen" ? "listen" : "build";
      if (!day.completedSteps.includes(step)) day.completedSteps.push(step);
    } else if (reading) {
      day.missionIndex = Number(reading[1]);
      day.missionPhase = Number(reading[2]);
      if (!day.completedSteps.includes("reading")) day.completedSteps.push("reading");
    } else if (checkpoint) {
      day.missionIndex = Number(checkpoint[2]);
      day.missionPhase = Number(checkpoint[3]);
      if (!day.completedSteps.includes("speak")) day.completedSteps.push("speak");
    }
  }
  return [...days.values()].map((day) => ({
    ...day,
    vocabularyQueue: [...new Set(day.vocabularyQueue)],
    grammarQueue: [...new Set(day.grammarQueue)],
  }));
}

function studyDayFromSession(progress: Progress, date: string): StudyDay {
  const completedMission = progress.daily.includes("speak");
  const missionSequenceIndex = Math.max(0, progress.missionSessionCount - (completedMission ? 1 : 0));
  const missionCyclePosition = missionSequenceIndex % 36;
  return {
    date,
    vocabularyQueue: cleanIndexList(progress.dailyQueue),
    grammarQueue: cleanIndexList(progress.grammarQueue),
    missionIndex: Math.min(11, Math.floor(missionCyclePosition / 3)),
    missionPhase: missionCyclePosition % 3,
    completedSteps: [...progress.daily],
    replayCount: progress.studyHistory[progress.selectedLevel]?.find((day) => day.date === date)?.replayCount ?? 0,
  };
}

export function recordStudyDay(progress: Progress, date = progress.dailyDate || localDate()): Progress {
  if (!progress.onboarded || (!progress.dailyQueue.length && !progress.grammarQueue.length && !progress.daily.length)) return progress;
  const levelDays = progress.studyHistory[progress.selectedLevel] ?? [];
  const studyHistory = {
    ...progress.studyHistory,
    [progress.selectedLevel]: mergeStudyDays(levelDays, [studyDayFromSession(progress, date)]),
  };
  return { ...progress, studyHistory };
}

export function recordStudyDayReplay(progress: Progress, level: HskLevel, date: string): Progress {
  const levelDays = progress.studyHistory[level] ?? [];
  const studyHistory = {
    ...progress.studyHistory,
    [level]: levelDays.map((day) => day.date === date ? { ...day, replayCount: day.replayCount + 1 } : day),
  };
  return { ...progress, studyHistory };
}

export function buildDailyQueue(progress: Progress, vocabularySize: number, now = Date.now()) {
  const due = Object.entries(progress.reviews)
    .filter(([, review]) => review.dueAt <= now)
    .sort((a, b) => a[1].dueAt - b[1].dueAt)
    .map(([index]) => Number(index))
    .filter((index) => Number.isInteger(index) && index >= 0 && index < vocabularySize);
  const dueSet = new Set(due);
  const unseen: number[] = [];
  for (let index = 0; index < vocabularySize && unseen.length < progress.dailyNew; index += 1) {
    if (!progress.reviews[index] && !dueSet.has(index)) unseen.push(index);
  }
  return [...new Set([...due, ...unseen])];
}

export function buildDailyGrammarQueue(progress: Progress, grammarSize: number, now = Date.now()) {
  const due = Object.entries(progress.grammarReviews)
    .filter(([, review]) => review.dueAt <= now)
    .sort((a, b) => a[1].dueAt - b[1].dueAt)
    .slice(0, 2)
    .map(([index]) => Number(index));
  const dueSet = new Set(due);
  const nextUnseen = Array.from({ length: grammarSize }, (_, index) => index)
    .find((index) => !progress.grammarReviews[index] && !dueSet.has(index));
  if (nextUnseen !== undefined) return [...due, nextUnseen];
  if (due.length) return due;
  const maintenance = Object.entries(progress.grammarReviews)
    .filter(([index]) => Number(index) >= 0 && Number(index) < grammarSize)
    .sort((a, b) => a[1].lastReviewedAt - b[1].lastReviewedAt)[0];
  return maintenance ? [Number(maintenance[0])] : [];
}

export function normalizeProgress(raw: unknown, vocabularySize: number, grammarSize: number, date = localDate()): Progress {
  const starter = makeStarterProgress(date);
  if (!raw || typeof raw !== "object") return starter;
  const legacy = raw as Partial<Progress> & { lastVisit?: string };
  const migratedMissionSteps = Array.isArray(legacy.missionSteps)
    ? legacy.missionSteps
    : Array.from({ length: (legacy.missions?.length ?? 0) * 3 }, (_, index) => `${Math.floor(index / 3)}:${index % 3}`);
  const migrateVocabularyCadence = (Number(legacy.version) || 0) < 7;
  const reviews = { ...(legacy.reviews ?? {}) };
  const grammarReviews = { ...(legacy.grammarReviews ?? {}) };
  const levelArchives = {
    ...(legacy.levelArchives && typeof legacy.levelArchives === "object" ? legacy.levelArchives : {}),
  } as Partial<Record<HskLevel, LevelArchive>>;
  if (migrateVocabularyCadence) {
    for (const [index, review] of Object.entries(reviews)) {
      const intervalDays = Math.max(1, Number(review.repetitions) || 1);
      const lastReviewedAt = Number(review.lastReviewedAt) || Date.now();
      reviews[index] = { ...review, intervalDays, dueAt: cadenceDueAt(lastReviewedAt, intervalDays) };
    }
    for (const level of HSK_LEVELS) {
      const archive = levelArchives[level];
      if (!archive) continue;
      const migratedReviews = { ...(archive.reviews ?? {}) };
      for (const [index, review] of Object.entries(migratedReviews)) {
        const intervalDays = Math.max(1, Number(review.repetitions) || 1);
        const lastReviewedAt = Number(review.lastReviewedAt) || Date.now();
        migratedReviews[index] = { ...review, intervalDays, dueAt: cadenceDueAt(lastReviewedAt, intervalDays) };
      }
      levelArchives[level] = { ...archive, reviews: migratedReviews };
    }
  }
  for (const level of HSK_LEVELS) {
    const archive = levelArchives[level];
    if (!archive) continue;
    const archivedDaily = cleanDailySteps(archive.daily);
    const archivedComplete = isStudySessionComplete(archivedDaily);
    levelArchives[level] = {
      ...archive,
      daily: archivedDaily,
      cadenceDate: isStudyDate(archive.cadenceDate)
        ? archive.cadenceDate
        : isStudyDate(archive.dailyDate) ? archive.dailyDate : date,
      sessionCompletedDate: isStudyDate(archive.sessionCompletedDate)
        ? archive.sessionCompletedDate
        : (Number(legacy.version) || 0) < 12 && archivedComplete && isStudyDate(archive.dailyDate) ? archive.dailyDate : "",
    };
  }
  const rawHistory = legacy.studyHistory && typeof legacy.studyHistory === "object" ? legacy.studyHistory : {};
  const studyHistory: Partial<Record<HskLevel, StudyDay[]>> = {};
  for (const level of HSK_LEVELS) {
    const savedDays = Array.isArray(rawHistory[level])
      ? rawHistory[level].map(cleanStudyDay).filter((day): day is StudyDay => Boolean(day))
      : [];
    const levelEarned = level === (legacy.selectedLevel ?? "1") ? legacy.earned : legacy.levelArchives?.[level]?.earned;
    studyHistory[level] = mergeStudyDays(savedDays, inferStudyDays(levelEarned));
  }
  const selectedLevel = HSK_LEVELS.includes(legacy.selectedLevel as HskLevel) ? legacy.selectedLevel as HskLevel : "1";
  const selectedHistory = studyHistory[selectedLevel] ?? [];
  const repairCandidate = (Number(legacy.version) || 0) < 13
    && Boolean(legacy.onboarded)
    && cleanDailySteps(legacy.daily).length === 0
    ? [...selectedHistory].reverse().find((day) => {
      const isPartial = day.completedSteps.length > 0 && !isStudySessionComplete(day.completedSteps);
      const hasLaterGhostDay = selectedHistory.some((later) => later.date > day.date && later.completedSteps.length === 0);
      return isPartial && hasLaterGhostDay;
    })
    : undefined;
  if (repairCandidate) {
    studyHistory[selectedLevel] = selectedHistory.filter((day) => !(
      day.date > repairCandidate.date && day.completedSteps.length === 0
    ));
  }
  const sessionState: Partial<Progress> = repairCandidate ? {
    ...legacy,
    daily: repairCandidate.completedSteps,
    dailyDate: repairCandidate.date,
    cadenceDate: repairCandidate.date,
    sessionCompletedDate: "",
    dailyQueue: repairCandidate.vocabularyQueue,
    dailyQueueDate: repairCandidate.date,
    flashcardPosition: repairCandidate.completedSteps.includes("flashcards") ? repairCandidate.vocabularyQueue.length : 0,
    cardPosition: repairCandidate.completedSteps.includes("review") ? repairCandidate.vocabularyQueue.length : 0,
    grammarQueue: repairCandidate.grammarQueue,
    grammarQueueDate: repairCandidate.date,
    grammarPosition: repairCandidate.completedSteps.includes("grammar") ? repairCandidate.grammarQueue.length : 0,
  } : legacy;
  for (const index of legacy.mastered ?? []) {
    if (!reviews[index]) {
      reviews[index] = {
        dueAt: cadenceDueAt(Date.now(), 3),
        intervalDays: 3,
        repetitions: 3,
        lapses: 0,
        lastReviewedAt: Date.now(),
      };
    }
  }
  const restoredLegacyDaily = cleanDailySteps(sessionState.daily);
  const legacySessionComplete = isStudySessionComplete(restoredLegacyDaily);
  const inferredCompletedDate = isStudyDate(sessionState.sessionCompletedDate)
    ? sessionState.sessionCompletedDate
    : (Number(legacy.version) || 0) < 12 && legacySessionComplete && isStudyDate(sessionState.dailyDate) ? sessionState.dailyDate : "";
  const legacySessionFinished = legacySessionComplete && isStudyDate(inferredCompletedDate);
  const sameCalendarSession = sessionState.dailyDate === date;
  const completedOnThisCalendarDay = legacySessionFinished && inferredCompletedDate === date;
  const unfinishedOpenSession = Boolean(legacy.onboarded && isStudyDate(sessionState.dailyDate) && !legacySessionFinished);
  const keepExistingSession = sameCalendarSession || completedOnThisCalendarDay || unfinishedOpenSession;
  const priorCadenceDate = isStudyDate(sessionState.cadenceDate)
    ? sessionState.cadenceDate
    : isStudyDate(sessionState.dailyDate) ? sessionState.dailyDate : date;
  const cadenceDate = keepExistingSession
    ? priorCadenceDate
    : legacy.onboarded && isStudyDate(sessionState.dailyDate) ? addStudyDays(priorCadenceDate, 1) : priorCadenceDate;
  const dailyDate = keepExistingSession && isStudyDate(sessionState.dailyDate) ? sessionState.dailyDate : date;
  const restoredDaily = keepExistingSession ? restoredLegacyDaily : [];
  const sessionCompletedDate = keepExistingSession && legacySessionFinished ? inferredCompletedDate : "";
  const cadenceNow = studyDateTimestamp(cadenceDate);
  const progress: Progress = {
    ...starter,
    ...legacy,
    version: 13,
    selectedLevel,
    graduatedLevels: Array.isArray(legacy.graduatedLevels)
      ? [...new Set(legacy.graduatedLevels.filter((level): level is HskLevel => HSK_LEVELS.includes(level as HskLevel)))]
      : [],
    trainingSeconds: Number(legacy.version) >= 9 ? Math.max(0, Math.floor(Number(legacy.trainingSeconds) || 0)) : 0,
    trainingTodaySeconds: Number(legacy.version) >= 9 && legacy.trainingDate === date
      ? Math.max(0, Math.floor(Number(legacy.trainingTodaySeconds) || 0))
      : 0,
    trainingDate: date,
    levelArchives,
    studyHistory,
    reviews,
    grammarReviews,
    grammarMastered: Array.isArray(legacy.grammarMastered) ? legacy.grammarMastered : [],
    missionSteps: migratedMissionSteps,
    missionSessionCount: Math.max(Number(legacy.missionSessionCount) || 0, migratedMissionSteps.length),
    daily: restoredDaily,
    dailyDate,
    cadenceDate,
    sessionCompletedDate,
    listeningDone: keepExistingSession ? sessionState.listeningDone ?? [] : [],
    builderDone: keepExistingSession ? sessionState.builderDone ?? [] : [],
    pronunciationDone: keepExistingSession ? sessionState.pronunciationDone ?? [] : [],
    lastActive: legacy.lastActive ?? legacy.lastVisit ?? "",
    dailyNew: [5, 8, 10].includes(Number(legacy.dailyNew)) ? Number(legacy.dailyNew) : 8,
    earned: Array.isArray(legacy.earned) ? legacy.earned.slice(-1800) : [],
    examHistory: Array.isArray(legacy.examHistory) ? legacy.examHistory.slice(-20) : [],
    skillStats: legacy.skillStats && typeof legacy.skillStats === "object" ? legacy.skillStats : {},
    corrections: Array.isArray(legacy.corrections)
      ? legacy.corrections.filter((item): item is CorrectionItem => Boolean(item && typeof item === "object" && item.id && item.answer && item.dueDate)).slice(-200)
      : [],
    pinyinConfidence: legacy.pinyinConfidence && typeof legacy.pinyinConfidence === "object" ? legacy.pinyinConfidence : {},
  };
  if (!keepExistingSession || !sessionState.dailyQueueDate || !Array.isArray(sessionState.dailyQueue)) {
    progress.dailyQueue = buildDailyQueue(progress, vocabularySize, cadenceNow);
    progress.dailyQueueDate = dailyDate;
    progress.flashcardPosition = 0;
    progress.cardPosition = 0;
  } else {
    const uniqueVocabularyQueue = uniqueQueueState(sessionState.dailyQueue, sessionState.cardPosition, vocabularySize);
    progress.dailyQueue = uniqueVocabularyQueue.queue;
    progress.cardPosition = uniqueVocabularyQueue.position;
    progress.flashcardPosition = restoredDaily.includes("flashcards")
      ? progress.dailyQueue.length
      : Math.min(Math.max(0, Number(sessionState.flashcardPosition) || 0), progress.dailyQueue.length);
    progress.dailyQueueDate = dailyDate;
  }
  if (!keepExistingSession || !sessionState.grammarQueueDate || !Array.isArray(sessionState.grammarQueue)) {
    progress.grammarQueue = buildDailyGrammarQueue(progress, grammarSize, cadenceNow);
    progress.grammarQueueDate = dailyDate;
    progress.grammarPosition = 0;
  } else {
    progress.grammarQueue = sessionState.grammarQueue.filter((index) => Number.isInteger(index) && index >= 0 && index < grammarSize);
    progress.grammarPosition = Math.min(Number(sessionState.grammarPosition) || 0, progress.grammarQueue.length);
    progress.grammarQueueDate = dailyDate;
  }
  if (!repairCandidate && legacy.dailyDate && Array.isArray(legacy.dailyQueue)) {
    const legacySession = {
      ...progress,
      daily: Array.isArray(legacy.daily) ? legacy.daily : [],
      dailyQueue: legacy.dailyQueue,
      grammarQueue: Array.isArray(legacy.grammarQueue) ? legacy.grammarQueue : [],
      missionSessionCount: Number(legacy.missionSessionCount) || 0,
    };
    progress.studyHistory[progress.selectedLevel] = mergeStudyDays(
      progress.studyHistory[progress.selectedLevel] ?? [],
      [studyDayFromSession(legacySession, legacy.dailyDate)],
    );
  }
  return recordStudyDay(progress, progress.dailyDate);
}

function captureLevel(progress: Progress): LevelArchive {
  return {
    mastered: progress.mastered,
    grammarMastered: progress.grammarMastered,
    missions: progress.missions,
    missionSteps: progress.missionSteps,
    missionSessionCount: progress.missionSessionCount,
    daily: progress.daily,
    dailyDate: progress.dailyDate,
    cadenceDate: progress.cadenceDate,
    sessionCompletedDate: progress.sessionCompletedDate,
    reviews: progress.reviews,
    grammarReviews: progress.grammarReviews,
    earned: progress.earned,
    dailyQueue: progress.dailyQueue,
    dailyQueueDate: progress.dailyQueueDate,
    flashcardPosition: progress.flashcardPosition,
    cardPosition: progress.cardPosition,
    grammarQueue: progress.grammarQueue,
    grammarQueueDate: progress.grammarQueueDate,
    grammarPosition: progress.grammarPosition,
    listeningDone: progress.listeningDone,
    builderDone: progress.builderDone,
    pronunciationDone: progress.pronunciationDone,
    examHistory: progress.examHistory,
  };
}

function emptyLevel(date: string): LevelArchive {
  return {
    mastered: [],
    grammarMastered: [],
    missions: [],
    missionSteps: [],
    missionSessionCount: 0,
    daily: [],
    dailyDate: date,
    cadenceDate: date,
    sessionCompletedDate: "",
    reviews: {},
    grammarReviews: {},
    earned: [],
    dailyQueue: [],
    dailyQueueDate: "",
    flashcardPosition: 0,
    cardPosition: 0,
    grammarQueue: [],
    grammarQueueDate: "",
    grammarPosition: 0,
    listeningDone: [],
    builderDone: [],
    pronunciationDone: [],
    examHistory: [],
  };
}

export function switchProgressLevel(progress: Progress, selectedLevel: HskLevel, vocabularySize: number, grammarSize: number, date = localDate()): Progress {
  const recorded = recordStudyDay(progress);
  if (selectedLevel === recorded.selectedLevel) return recorded;
  const levelArchives = { ...recorded.levelArchives, [recorded.selectedLevel]: captureLevel(recorded) };
  const saved = { ...emptyLevel(date), ...(levelArchives[selectedLevel] ?? {}) };
  const restoredSavedDaily = cleanDailySteps(saved.daily);
  const savedSessionComplete = isStudySessionComplete(restoredSavedDaily);
  const inferredCompletedDate = isStudyDate(saved.sessionCompletedDate) ? saved.sessionCompletedDate : "";
  const savedSessionFinished = savedSessionComplete && isStudyDate(inferredCompletedDate);
  const keepExistingSession = saved.dailyDate === date
    || (savedSessionFinished && inferredCompletedDate === date)
    || (isStudyDate(saved.dailyDate) && !savedSessionFinished);
  const priorCadenceDate = isStudyDate(saved.cadenceDate)
    ? saved.cadenceDate
    : isStudyDate(saved.dailyDate) ? saved.dailyDate : date;
  const cadenceDate = keepExistingSession ? priorCadenceDate : addStudyDays(priorCadenceDate, 1);
  const dailyDate = keepExistingSession && isStudyDate(saved.dailyDate) ? saved.dailyDate : date;
  const savedDaily = keepExistingSession ? restoredSavedDaily : [];
  const sessionCompletedDate = keepExistingSession && savedSessionFinished ? inferredCompletedDate : "";
  const active: LevelArchive = {
    ...saved,
    grammarMastered: saved.grammarMastered ?? [],
    missionSessionCount: Math.max(saved.missionSessionCount ?? 0, saved.missionSteps?.length ?? 0),
    grammarReviews: saved.grammarReviews ?? {},
    grammarQueue: saved.grammarQueue ?? [],
    grammarQueueDate: saved.grammarQueueDate ?? "",
    grammarPosition: saved.grammarPosition ?? 0,
    daily: savedDaily,
    dailyDate,
    cadenceDate,
    sessionCompletedDate,
    listeningDone: keepExistingSession ? saved.listeningDone : [],
    builderDone: keepExistingSession ? saved.builderDone : [],
    pronunciationDone: keepExistingSession ? saved.pronunciationDone : [],
  };
  let switched: Progress = { ...recorded, ...active, selectedLevel, levelArchives };
  const cadenceNow = studyDateTimestamp(cadenceDate);
  if (!keepExistingSession || !active.dailyQueueDate || !Array.isArray(active.dailyQueue)) {
    switched = {
      ...switched,
      dailyQueue: buildDailyQueue(switched, vocabularySize, cadenceNow),
      dailyQueueDate: dailyDate,
      flashcardPosition: 0,
      cardPosition: 0,
    };
  } else {
    const uniqueVocabularyQueue = uniqueQueueState(active.dailyQueue, active.cardPosition, vocabularySize);
    switched.dailyQueue = uniqueVocabularyQueue.queue;
    switched.cardPosition = uniqueVocabularyQueue.position;
    switched.flashcardPosition = switched.daily.includes("flashcards")
      ? switched.dailyQueue.length
      : Math.min(Math.max(0, Number(active.flashcardPosition) || 0), switched.dailyQueue.length);
    switched.dailyQueueDate = dailyDate;
  }
  if (!keepExistingSession || !active.grammarQueueDate || !Array.isArray(active.grammarQueue)) {
    switched = {
      ...switched,
      grammarQueue: buildDailyGrammarQueue(switched, grammarSize, cadenceNow),
      grammarQueueDate: dailyDate,
      grammarPosition: 0,
    };
  } else {
    switched.grammarQueue = active.grammarQueue.filter((index) => Number.isInteger(index) && index >= 0 && index < grammarSize);
    switched.grammarPosition = Math.min(active.grammarPosition, switched.grammarQueue.length);
    switched.grammarQueueDate = dailyDate;
  }
  return recordStudyDay(switched);
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
  void minutes;
  const active = activate(progress, date);
  if (active.daily.includes(id)) return active;
  return { ...active, daily: [...active.daily, id] };
}

export function recordActiveStudySeconds(progress: Progress, seconds: number, date = localDate()) {
  const elapsed = Math.max(0, Math.min(300, Math.floor(Number(seconds) || 0)));
  if (!elapsed) return progress;
  const todaySeconds = progress.trainingDate === date ? progress.trainingTodaySeconds : 0;
  return {
    ...progress,
    trainingSeconds: progress.trainingSeconds + elapsed,
    trainingTodaySeconds: todaySeconds + elapsed,
    trainingDate: date,
  };
}

function coveredItemCount(items: Record<string, ReviewState>, total: number) {
  return Object.keys(items).filter((index) => {
    const value = Number(index);
    return Number.isInteger(value) && value >= 0 && value < total;
  }).length;
}

export function getLevelGraduationStatus(progress: Progress, vocabularySize: number, grammarSize: number, missionCount: number) {
  const vocabularyTaught = coveredItemCount(progress.reviews, vocabularySize);
  const grammarTaught = coveredItemCount(progress.grammarReviews, grammarSize);
  const missionsCompleted = new Set(progress.missions.filter((index) => index >= 0 && index < missionCount)).size;
  const pendingCorrections = progress.corrections.filter((item) => item.level === progress.selectedLevel).length;
  const bestCheckpointScore = progress.examHistory.reduce((best, attempt) => Math.max(best, attempt.score), 0);
  const requirements = {
    vocabulary: vocabularyTaught >= vocabularySize,
    grammar: grammarTaught >= grammarSize,
    missions: missionsCompleted >= missionCount,
    corrections: pendingCorrections === 0,
    checkpoint: bestCheckpointScore >= 80,
  };
  return {
    ready: Object.values(requirements).every(Boolean),
    requirements,
    vocabularyTaught,
    grammarTaught,
    missionsCompleted,
    pendingCorrections,
    bestCheckpointScore,
  };
}

export function markLevelGraduated(progress: Progress, level = progress.selectedLevel): Progress {
  if (progress.graduatedLevels.includes(level)) return progress;
  return { ...progress, graduatedLevels: [...progress.graduatedLevels, level] };
}

export function recordSkillAttempt(progress: Progress, skill: SkillArea, correct: boolean, date = localDate()): Progress {
  const prior = progress.skillStats[skill] ?? { attempts: 0, correct: 0, lastPracticed: "" };
  return {
    ...progress,
    skillStats: {
      ...progress.skillStats,
      [skill]: {
        attempts: prior.attempts + 1,
        correct: prior.correct + (correct ? 1 : 0),
        lastPracticed: date,
      },
    },
  };
}

export function recordWordConfidence(progress: Progress, level: HskLevel, index: number, correct: boolean): Progress {
  const key = `${level}:${index}`;
  const prior = progress.pinyinConfidence[key] ?? 0;
  return {
    ...progress,
    pinyinConfidence: {
      ...progress.pinyinConfidence,
      [key]: correct ? Math.min(5, prior + 1) : Math.max(0, prior - 1),
    },
  };
}

export function queueCorrection(progress: Progress, item: Omit<CorrectionItem, "correctStreak" | "misses">): Progress {
  const existing = progress.corrections.find((correction) => correction.id === item.id);
  const correction: CorrectionItem = {
    ...item,
    correctStreak: 0,
    misses: (existing?.misses ?? 0) + 1,
  };
  return {
    ...progress,
    corrections: [...progress.corrections.filter((candidate) => candidate.id !== item.id), correction].slice(-200),
  };
}

export function resolveCorrection(progress: Progress, id: string, date = localDate()): Progress {
  const tomorrow = new Date(`${date}T12:00:00`);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextDate = localDate(tomorrow);
  return {
    ...progress,
    corrections: progress.corrections.flatMap((item) => {
      if (item.id !== id) return [item];
      if (item.correctStreak >= 1) return [];
      return [{ ...item, correctStreak: 1, dueDate: nextDate }];
    }),
  };
}

export function dueCorrections(progress: Progress, level: HskLevel, date = localDate()) {
  return progress.corrections.filter((item) => item.level === level && item.dueDate <= date);
}

export function skillAccuracy(progress: Progress, skill: SkillArea) {
  const stat = progress.skillStats[skill];
  return stat?.attempts ? Math.round((stat.correct / stat.attempts) * 100) : 0;
}

function cadenceDueAt(now: number, intervalDays: number) {
  const due = new Date(now);
  due.setHours(0, 0, 0, 0);
  due.setDate(due.getDate() + intervalDays);
  return due.getTime();
}

export function scheduleCadenceReview(previous: ReviewState | undefined, now = Date.now()): ReviewState {
  const intervalDays = Math.max(1, (previous?.intervalDays ?? 0) + 1);
  return {
    dueAt: cadenceDueAt(now, intervalDays),
    intervalDays,
    repetitions: (previous?.repetitions ?? 0) + 1,
    lapses: previous?.lapses ?? 0,
    lastReviewedAt: now,
  };
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
