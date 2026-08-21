import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";
import {
  activate,
  buildDailyGrammarQueue,
  buildDailyQueue,
  completeDailyStep,
  earnOnce,
  makeStarterProgress,
  normalizeProgress,
  recordStudyDay,
  recordStudyDayReplay,
  scheduleCadenceReview,
  scheduleReview,
  similarityScore,
  switchProgressLevel,
} from "../src/learning-engine.ts";
import {
  grammarPoints,
  listeningQuestions,
  mockExamQuestions,
  recognitionCharacters,
  sentenceChallenges,
  vocabulary,
} from "../src/hsk-data.ts";
import {
  getCumulativeCharacters,
  getCumulativeVocabulary,
  getCourseMissions,
  getLibraryGrammar,
  getStudyCharacters,
  getStudyVocabulary,
  levelMeta,
  levelOrder,
} from "../src/level-content.ts";
import {
  buildGrammarMixerFrame,
  initialMixerSelections,
  mixerExpectedTokens,
} from "../src/grammar-mixer.ts";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the finished Mandarin course", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /Shēngtú — HSK 1 Mandarin Sprint/i);
  assert.match(html, /Stop studying Mandarin/);
  assert.match(html, /Continue:[\s\S]{0,40}Recall/);
  assert.match(html, /MISSION[\s\S]{0,30}01[\s\S]{0,30}DAY[\s\S]{0,30}1[\s\S]{0,20}\/ 3/);
  assert.match(html, /Grammar coverage/);
  assert.match(html, /0[\s\S]{0,20}\/5 complete/);
  assert.match(html, /aria-label="App navigation"/);
  assert.match(html, />Today<\/button>/);
  assert.match(html, />Course<\/button>/);
  assert.match(html, />Library<\/button>/);
  assert.match(html, /manifest\.webmanifest/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/i);
});

test("uses focused app views instead of one scrolling curriculum page", async () => {
  const source = await readFile(new URL("../src/MandarinApp.tsx", import.meta.url), "utf8");
  const css = await readFile(new URL("../src/mandarin.css", import.meta.url), "utf8");
  assert.match(source, /type AppView = "today" \| "course" \| "library" \| "exam" \| "progress"/);
  assert.match(source, /todayScreen === "plan"/);
  assert.match(source, /todayScreen === "lesson"/);
  assert.match(source, /appView === "course"/);
  assert.match(source, /libraryView === "grammar"/);
  assert.match(source, /type PracticeMode = "flashcards" \| "grammar" \| "listening" \| "builder" \| "speaking"/);
  assert.match(source, /function completeMissionCheckpoint/);
  assert.match(source, /missionSteps/);
  assert.match(source, /libraryVocabulary\.length\.toLocaleString\(\).*Words/);
  assert.match(source, /recognitionCharacters\.length\.toLocaleString\(\).*Characters/);
  assert.match(source, /grammarPoints\.length.*Grammar/);
  assert.match(source, /showLevelPicker/);
  assert.match(source, /function chooseLevel/);
  assert.match(source, /FULL-SYLLABUS GRAMMAR/);
  assert.match(source, /grammarMastered/);
  assert.match(source, /type GrammarStage = "learn" \| "recall"/);
  assert.match(source, /dailyGrammarStage === "learn"/);
  assert.match(source, /grammarPracticeStage === "learn"/);
  assert.match(source, /Hide the lesson &amp; start recall/);
  assert.match(source, /LESSON HIDDEN/);
  assert.match(source, /The pattern and model stay hidden until you answer correctly/);
  assert.match(source, /Why this works/);
  assert.match(source, /grammarChoicePool/);
  assert.match(source, /function GrammarPatternMixer/);
  assert.match(source, /MIX &amp; MATCH PATTERN LAB/);
  assert.match(source, /Build with vocabulary/);
  assert.match(source, /Hear my sentence/);
  assert.doesNotMatch(source, /Try again\. Match the target to:|Try again\. Build:/);
  assert.match(source, /promptLengthClass/);
  assert.match(source, /aria-label="Search characters"/);
  assert.match(source, /aria-label="Search grammar"/);
  assert.match(source, /className="mobile-nav"/);
  assert.match(source, /className="lesson-next-bar"/);
  assert.match(source, /function appRouteFromHash/);
  assert.match(source, /window\.history\.pushState/);
  assert.match(source, /addEventListener\("popstate"/);
  assert.match(source, /Study history/);
  assert.match(source, /function startStudyDayReplay/);
  assert.match(source, /Repeating \{studyDayLabel/);
  assert.match(source, /today’s course position is unchanged/);
  assert.match(source, /function advanceVocabularyCard/);
  assert.match(source, /function reviewTodaysRecallAgain/);
  assert.match(source, /Review today’s cards again/);
  assert.match(source, /return dates, XP, and completion stay unchanged/);
  assert.match(source, /AUTOMATIC RECALL CADENCE/);
  assert.match(source, /No rating needed/);
  assert.match(source, /EXAMPLE SENTENCE/);
  assert.match(source, /activeWord\.examplePinyin/);
  assert.match(source, /activeWord\.exampleTranslation/);
  assert.match(source, /Play example sentence/);
  assert.doesNotMatch(source, /gradeCard|>Again <|>Hard <|>Good <|>Easy </);
  const advanceSource = source.slice(source.indexOf("function advanceVocabularyCard"), source.indexOf("function answerListening"));
  assert.ok(advanceSource.indexOf("currentRecallReplayPosition !== null") < advanceSource.indexOf("scheduleCadenceReview"));
  assert.match(css, /\.mobile-nav\s*\{[^}]*display:\s*none/s);
  assert.match(css, /@media \(max-width:\s*850px\)[\s\S]*\.mobile-nav\s*\{[^}]*display:\s*grid/s);
  assert.match(css, /\.history-sheet/);
  assert.match(css, /\.replay-banner/);
});

test("ships the complete Level 1 curriculum and practice pools", () => {
  assert.equal(vocabulary.length, 300);
  assert.equal(recognitionCharacters.length, 246);
  assert.equal(grammarPoints.length, 70);
  assert.equal(listeningQuestions.length, 20);
  assert.equal(sentenceChallenges.length, 16);
  assert.equal(mockExamQuestions.length, 40);
  assert.equal(mockExamQuestions.filter((question) => question.section === "Listening").length, 20);
  assert.equal(mockExamQuestions.filter((question) => question.section === "Reading").length, 20);
  assert.ok(vocabulary.every((word) => word.example && word.examplePinyin && word.exampleTranslation && word.collocation));
  assert.ok(vocabulary.every((word) => !/\p{Script=Han}/u.test(word.examplePinyin)));
  assert.deepEqual(
    vocabulary.find((word) => word.hanzi === "爱"),
    {
      hanzi: "爱",
      pinyin: "ài",
      meaning: "to love; love",
      example: "我爱我的家人。",
      examplePinyin: "Wǒ ài wǒ de jiārén.",
      exampleTranslation: "I love my family.",
      collocation: "爱家人",
    },
  );
});

test("ships every official HSK level with cumulative searchable inventories", () => {
  const expectedWords = { "1": 300, "2": 200, "3": 500, "4": 1000, "5": 1600, "6": 1800, "7-9": 5600 };
  const expectedCharacters = { "1": 246, "2": 125, "3": 284, "4": 441, "5": 431, "6": 413, "7-9": 1148 };
  assert.deepEqual(levelOrder, ["1", "2", "3", "4", "5", "6", "7-9"]);
  for (const level of levelOrder) {
    assert.equal(getStudyVocabulary(level).length, expectedWords[level]);
    assert.ok(getStudyVocabulary(level).every((word) => word.meaning.length <= 135));
    assert.equal(getStudyCharacters(level).length, expectedCharacters[level]);
    assert.equal(getLibraryGrammar(level).length, levelMeta[level].grammarTargets);
  }
  assert.equal(getCumulativeVocabulary("7-9").length, 11000);
  assert.equal(getCumulativeCharacters("7-9").length, 3088);
  assert.equal(getStudyVocabulary("3").find((word) => word.hanzi === "除了")?.meaning, "apart from; besides; in addition to");
});

test("builds a vocabulary pattern mixer for every HSK grammar target", () => {
  for (const level of levelOrder) {
    const words = getCumulativeVocabulary(level);
    const fallbackFormula = getCourseMissions(level)[0].grammarFormula;
    for (const point of getLibraryGrammar(level, false)) {
      const frame = buildGrammarMixerFrame(point, fallbackFormula, words);
      const slots = frame.parts.filter((part) => part.type === "slot");
      assert.ok(slots.length > 0, `${level} ${point.title} has no vocabulary slots`);
      assert.ok(slots.every((slot) => slot.options.length >= 3), `${level} ${point.title} has too few word choices`);
      const tokens = mixerExpectedTokens(frame, initialMixerSelections(frame));
      assert.ok(tokens.length >= 2, `${level} ${point.title} has too few sentence pieces`);
      assert.doesNotMatch(tokens.join(""), /subject|object|noun|verb|adjective|content|predicate/i, `${level} ${point.title} leaks a placeholder`);
    }
  }
  const identity = buildGrammarMixerFrame(getLibraryGrammar("1", false)[0], "subject + 是 + noun", getCumulativeVocabulary("1"));
  assert.deepEqual(mixerExpectedTokens(identity, initialMixerSelections(identity)), ["我", "是", "学生"]);
});

test("provides complete pinyin with no Chinese-character leakage for every mission", () => {
  for (const level of levelOrder) {
    const missions = getCourseMissions(level);
    assert.equal(missions.length, 12);
    for (const mission of missions) {
      assert.ok(mission.pinyin.trim(), `${level} ${mission.title} is missing pinyin`);
      assert.doesNotMatch(mission.pinyin, /\p{Script=Han}/u, `${level} ${mission.title} leaks Hanzi into pinyin`);
    }
  }
});

test("builds the daily queue and advances vocabulary on a fixed calendar cadence", () => {
  const progress = { ...makeStarterProgress("2026-08-20"), dailyNew: 8 };
  assert.equal(buildDailyQueue(progress, 300, 0).length, 8);
  const day1 = new Date(2026, 7, 20, 15).getTime();
  const first = scheduleCadenceReview(undefined, day1);
  assert.equal(first.intervalDays, 1);
  assert.equal(first.dueAt, new Date(2026, 7, 21).getTime());
  const second = scheduleCadenceReview(first, new Date(2026, 7, 21, 9).getTime());
  assert.equal(second.intervalDays, 2);
  assert.equal(second.dueAt, new Date(2026, 7, 23).getTime());
  const third = scheduleCadenceReview(second, new Date(2026, 7, 23, 20).getTime());
  assert.equal(third.intervalDays, 3);
  assert.equal(third.dueAt, new Date(2026, 7, 26).getTime());

  const everyDueCard = {
    ...progress,
    reviews: Object.fromEntries(Array.from({ length: 30 }, (_, index) => [index, { ...first, dueAt: 0 }])),
  };
  assert.equal(buildDailyQueue(everyDueCard, 100, 0).length, 38);
});

test("guarantees a new grammar target while retaining due reviews", () => {
  const progress = {
    ...makeStarterProgress("2026-08-20"),
    grammarReviews: {
      0: { dueAt: 0, intervalDays: 2, repetitions: 1, lapses: 0, lastReviewedAt: 0 },
      1: { dueAt: 10_000, intervalDays: 2, repetitions: 1, lapses: 0, lastReviewedAt: 1 },
    },
  };
  assert.deepEqual(buildDailyGrammarQueue(progress, 70, 0), [0, 2]);
  const fullyIntroduced = {
    ...progress,
    grammarReviews: Object.fromEntries(Array.from({ length: 3 }, (_, index) => [index, { dueAt: 99_000, intervalDays: 7, repetitions: 2, lapses: 0, lastReviewedAt: index }])),
  };
  assert.deepEqual(buildDailyGrammarQueue(fullyIntroduced, 3, 0), [0]);
});

test("eventually introduces every word and grammar target when daily queues are completed", () => {
  let progress = { ...makeStarterProgress("2026-08-20"), dailyNew: 5 };
  for (let day = 0; day < 40; day += 1) {
    const wordQueue = buildDailyQueue(progress, 200, 0);
    const grammarQueue = buildDailyGrammarQueue(progress, 25, 0);
    progress = {
      ...progress,
      reviews: {
        ...progress.reviews,
        ...Object.fromEntries(wordQueue.map((index) => [index, { dueAt: Number.MAX_SAFE_INTEGER, intervalDays: 7, repetitions: 1, lapses: 0, lastReviewedAt: day }])),
      },
      grammarReviews: {
        ...progress.grammarReviews,
        ...Object.fromEntries(grammarQueue.map((index) => [index, { dueAt: Number.MAX_SAFE_INTEGER, intervalDays: 7, repetitions: 1, lapses: 0, lastReviewedAt: day }])),
      },
    };
  }
  assert.equal(Object.keys(progress.reviews).length, 200);
  assert.equal(Object.keys(progress.grammarReviews).length, 25);
});

test("resets daily work, calculates real streaks, and prevents repeat rewards", () => {
  const starter = makeStarterProgress("2026-08-18");
  const firstDay = activate(starter, "2026-08-18");
  const nextDay = activate(firstDay, "2026-08-19");
  const afterGap = activate(nextDay, "2026-08-21");
  assert.equal(firstDay.streak, 1);
  assert.equal(nextDay.streak, 2);
  assert.equal(afterGap.streak, 1);

  const once = earnOnce(starter, "word:1", 5, "2026-08-18");
  assert.equal(earnOnce(once, "word:1", 5, "2026-08-18").xp, 5);
  assert.equal(completeDailyStep(once, "review", 5, "2026-08-18").minutes, 5);

  const stale = { ...once, daily: ["review"], dailyDate: "2026-08-18", listeningDone: ["l01"] };
  const normalized = normalizeProgress(stale, 300, 70, "2026-08-19");
  assert.deepEqual(normalized.daily, []);
  assert.deepEqual(normalized.listeningDone, []);

  const legacyMissionProgress = normalizeProgress({ ...stale, version: 2, missions: [0, 1], missionSteps: undefined }, 300, 70, "2026-08-19");
  assert.equal(legacyMissionProgress.version, 7);
  assert.deepEqual(legacyMissionProgress.missionSteps, ["0:0", "0:1", "0:2", "1:0", "1:1", "1:2"]);
  assert.equal(legacyMissionProgress.missionSessionCount, 6);
  assert.equal(legacyMissionProgress.grammarQueue.at(-1), 0);

  const lastReviewedAt = new Date(2026, 7, 15, 18).getTime();
  const cadenceMigration = normalizeProgress({
    ...makeStarterProgress("2026-08-18"),
    version: 6,
    reviews: { 4: { dueAt: lastReviewedAt + 21 * 86_400_000, intervalDays: 21, repetitions: 3, lapses: 0, lastReviewedAt } },
  }, 300, 70, "2026-08-18");
  assert.equal(cadenceMigration.reviews[4].intervalDays, 3);
  assert.equal(cadenceMigration.reviews[4].dueAt, new Date(2026, 7, 18).getTime());
});

test("archives exact study days and preserves repeat counts across dates", () => {
  const studied = recordStudyDay({
    ...makeStarterProgress("2026-08-18"),
    onboarded: true,
    daily: ["review", "grammar", "listen", "build", "speak"],
    dailyQueue: [2, 4, 2, 8],
    dailyQueueDate: "2026-08-18",
    grammarQueue: [1, 3],
    grammarQueueDate: "2026-08-18",
    missionSessionCount: 1,
  }, "2026-08-18");
  const day = studied.studyHistory["1"].find((item) => item.date === "2026-08-18");
  assert.deepEqual(day.vocabularyQueue, [2, 4, 8]);
  assert.deepEqual(day.grammarQueue, [1, 3]);
  assert.equal(day.missionIndex, 0);
  assert.equal(day.missionPhase, 0);
  assert.deepEqual(day.completedSteps, ["review", "grammar", "listen", "build", "speak"]);

  const replayed = recordStudyDayReplay(studied, "1", "2026-08-18");
  assert.equal(replayed.studyHistory["1"][0].replayCount, 1);

  const migrated = normalizeProgress({
    ...makeStarterProgress("2026-08-18"),
    onboarded: true,
    dailyDate: "2026-08-18",
    dailyQueueDate: "2026-08-18",
    dailyQueue: [5, 9],
    grammarQueueDate: "2026-08-18",
    grammarQueue: [2],
    earned: [
      "2026-08-17:review:7",
      "2026-08-17:daily-grammar:4",
      "2026-08-17:mission-listen:1:2",
      "2026-08-17:mission-build:1:2",
      "2026-08-17:mission-checkpoint:0:1:2",
    ],
  }, 300, 70, "2026-08-19");
  const recovered = migrated.studyHistory["1"].find((item) => item.date === "2026-08-17");
  assert.deepEqual(recovered.vocabularyQueue, [7]);
  assert.deepEqual(recovered.grammarQueue, [4]);
  assert.equal(recovered.missionIndex, 1);
  assert.equal(recovered.missionPhase, 2);
  assert.ok(recovered.completedSteps.includes("speak"));
});

test("keeps spaced-repetition and mission progress separate by HSK level", () => {
  const level1 = {
    ...makeStarterProgress("2026-08-20"),
    mastered: [1, 2],
    grammarMastered: [0],
    missions: [0],
    reviews: { 1: scheduleReview(undefined, "good", 0) },
    grammarReviews: { 0: scheduleReview(undefined, "good", 0) },
  };
  const level2 = switchProgressLevel(level1, "2", 200, 75, "2026-08-20");
  assert.equal(level2.selectedLevel, "2");
  assert.deepEqual(level2.mastered, []);
  assert.deepEqual(level2.grammarMastered, []);
  assert.deepEqual(level2.levelArchives["1"].mastered, [1, 2]);
  assert.deepEqual(level2.levelArchives["1"].grammarMastered, [0]);
  const restored = switchProgressLevel({ ...level2, mastered: [3], missions: [1] }, "1", 300, 70, "2026-08-20");
  assert.deepEqual(restored.mastered, [1, 2]);
  assert.deepEqual(restored.grammarMastered, [0]);
  assert.deepEqual(restored.missions, [0]);
  assert.deepEqual(restored.levelArchives["2"].mastered, [3]);
});

test("scores speech transcripts by the full target instead of two hardcoded phrases", () => {
  assert.equal(similarityScore("你好我叫安娜", "你好我叫安娜"), 100);
  assert.ok(similarityScore("我想喝一杯茶", "我想喝茶") >= 60);
  assert.ok(similarityScore("我想喝一杯茶", "今天天气很好") < 50);
});

test("static Pages build has absolute social metadata and offline assets", async () => {
  const html = await readFile(new URL("../docs/index.html", import.meta.url), "utf8");
  assert.match(html, /https:\/\/z1fire\.github\.io\/shengtu-mandarin\/og\.png/);
  assert.match(html, /manifest\.webmanifest/);
  await Promise.all([
    access(new URL("../docs/sw.js", import.meta.url)),
    access(new URL("../docs/manifest.webmanifest", import.meta.url)),
    access(new URL("../docs/favicon.svg", import.meta.url)),
  ]);
});
