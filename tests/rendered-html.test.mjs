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
  dueCorrections,
  queueCorrection,
  recordStudyDay,
  recordStudyDayReplay,
  recordSkillAttempt,
  recordWordConfidence,
  resolveCorrection,
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
  updateMixerSelection,
} from "../src/grammar-mixer.ts";
import {
  buildGradedReading,
  buildMissionConversation,
  buildMissionDictation,
  buildRecallChallenge,
} from "../src/learning-experience.ts";

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
  assert.match(html, /0[\s\S]{0,20}\/6 complete/);
  assert.match(html, /Listening ladder/);
  assert.match(html, /Read in context/);
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
  assert.match(source, /type PracticeMode = "flashcards" \| "grammar" \| "listening" \| "builder" \| "reading" \| "speaking"/);
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
  assert.match(source, /ANSWER WITHOUT SELF-RATING/);
  assert.match(source, /AUTOMATIC CORRECTION LOOP/);
  assert.match(source, /LISTENING LADDER/);
  assert.match(source, /GRADED READING/);
  assert.match(source, /EXPANDING CONVERSATION/);
  assert.match(source, /OBJECTIVE ACCURACY/);
  assert.match(source, /\/api\/progress/);
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

test("keeps grammar mixer vocabulary logically compatible in both directions", () => {
  const words = getCumulativeVocabulary("1");
  const grammar = getLibraryGrammar("1", false);
  const frameFor = (formula) => buildGrammarMixerFrame(grammar.find((point) => point.formula === formula), "subject + 是 + noun", words);
  const slot = (frame, id) => frame.parts.find((part) => part.type === "slot" && part.id === id);
  const optionIndex = (part, hanzi) => part.options.findIndex((option) => option.hanzi === hanzi);
  const selected = (part, selections) => part.options[selections[part.id]].hanzi;

  const identity = frameFor("subject + 是 + noun");
  const identityNoun = slot(identity, "noun");
  assert.ok(identityNoun.options.some((word) => word.hanzi === "学生"));
  assert.ok(identityNoun.options.some((word) => word.hanzi === "老师"));
  assert.ok(identityNoun.options.every((word) => !["书", "苹果", "茶", "衣服"].includes(word.hanzi)));

  const counted = frameFor("number + measure word + noun");
  const countedNoun = slot(counted, "noun");
  const measure = slot(counted, "measure word");
  let countedSelections = initialMixerSelections(counted);
  countedSelections = updateMixerSelection(counted, countedSelections, countedNoun.id, optionIndex(countedNoun, "书")).selections;
  assert.equal(selected(measure, countedSelections), "本");
  countedSelections = updateMixerSelection(counted, countedSelections, measure.id, optionIndex(measure, "件")).selections;
  assert.equal(selected(countedNoun, countedSelections), "衣服");

  const completed = frameFor("verb + 了 + object");
  const verb = slot(completed, "verb");
  const object = slot(completed, "object");
  let actionSelections = initialMixerSelections(completed);
  actionSelections = updateMixerSelection(completed, actionSelections, verb.id, optionIndex(verb, "喝")).selections;
  assert.equal(selected(object, actionSelections), "茶");
  actionSelections = updateMixerSelection(completed, actionSelections, object.id, optionIndex(object, "苹果")).selections;
  assert.equal(selected(verb, actionSelections), "吃");

  const located = frameFor("noun + 在 + place + 上 / 下 / 里 / 外");
  const locatedNoun = slot(located, "noun");
  const place = slot(located, "place");
  const locationUpdate = updateMixerSelection(located, initialMixerSelections(located), locatedNoun.id, optionIndex(locatedNoun, "衣服"));
  assert.equal(selected(place, locationUpdate.selections), "商店");
  assert.match(locationUpdate.note, /natural situation/);
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

test("objectively scores practice and resolves misses over two correct days", () => {
  let progress = makeStarterProgress("2026-08-20");
  progress = recordSkillAttempt(progress, "vocabulary", false, "2026-08-20");
  progress = recordWordConfidence(progress, "1", 4, false);
  progress = queueCorrection(progress, {
    id: "vocabulary:1:4",
    level: "1",
    skill: "vocabulary",
    prompt: "to drink",
    answer: "喝",
    options: ["吃", "喝", "看"],
    explanation: "喝 means to drink.",
    dueDate: "2026-08-20",
  });
  assert.equal(progress.skillStats.vocabulary.attempts, 1);
  assert.equal(progress.skillStats.vocabulary.correct, 0);
  assert.equal(dueCorrections(progress, "1", "2026-08-20").length, 1);

  progress = resolveCorrection(progress, "vocabulary:1:4", "2026-08-20");
  assert.equal(dueCorrections(progress, "1", "2026-08-20").length, 0);
  assert.equal(dueCorrections(progress, "1", "2026-08-21").length, 1);
  progress = resolveCorrection(progress, "vocabulary:1:4", "2026-08-21");
  assert.equal(progress.corrections.length, 0);

  progress = recordWordConfidence(progress, "1", 4, true);
  progress = recordWordConfidence(progress, "1", 4, true);
  progress = recordWordConfidence(progress, "1", 4, true);
  assert.equal(progress.pinyinConfidence["1:4"], 3);
});

test("builds recall, dictation, reading, and expanding conversation exercises for every level", () => {
  for (const level of levelOrder) {
    const words = getStudyVocabulary(level);
    const missions = getCourseMissions(level);
    for (const repetitions of [0, 1, 2]) {
      const challenge = buildRecallChallenge(0, words, repetitions);
      assert.ok(challenge.options.includes(challenge.answer));
      assert.ok(challenge.options.length >= 3);
    }
    const dictation = buildMissionDictation(missions, 0);
    assert.match(dictation.masked, /＿＿/);
    assert.ok(dictation.options.includes(dictation.answer));
    const reading = buildGradedReading(missions, 0, 2);
    assert.equal(reading.lines.length, 2);
    assert.ok(reading.options.includes(reading.answer));
    assert.equal(buildMissionConversation(missions[0], 0).length, 2);
    assert.equal(buildMissionConversation(missions[0], 1).length, 3);
    assert.equal(buildMissionConversation(missions[0], 2).length, 4);
  }
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
  assert.equal(legacyMissionProgress.version, 8);
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
    daily: ["review", "grammar", "listen", "build", "reading", "speak"],
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
  assert.deepEqual(day.completedSteps, ["review", "grammar", "listen", "build", "reading", "speak"]);

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
    access(new URL("../docs/icons/icon-192.png", import.meta.url)),
    access(new URL("../docs/icons/icon-512.png", import.meta.url)),
    access(new URL("../docs/icons/icon-maskable-512.png", import.meta.url)),
    access(new URL("../docs/icons/apple-touch-icon.png", import.meta.url)),
  ]);
});

test("ships an Android-installable PWA with a guided install fallback", async () => {
  const manifest = JSON.parse(await readFile(new URL("../public/manifest.webmanifest", import.meta.url), "utf8"));
  const serviceWorker = await readFile(new URL("../public/sw.js", import.meta.url), "utf8");
  const source = await readFile(new URL("../src/MandarinApp.tsx", import.meta.url), "utf8");
  const appCss = await readFile(new URL("../src/mandarin.css", import.meta.url), "utf8");
  const layoutSource = await readFile(new URL("../app/layout.tsx", import.meta.url), "utf8");
  const versionSource = await readFile(new URL("../src/app-version.ts", import.meta.url), "utf8");
  const pagesHtml = await readFile(new URL("../pages-site/index.html", import.meta.url), "utf8");

  assert.equal(manifest.id, "./");
  assert.equal(manifest.start_url, "./#today");
  assert.equal(manifest.scope, "./");
  assert.equal(manifest.display, "standalone");
  assert.equal(manifest.orientation, "portrait-primary");
  assert.equal(manifest.prefer_related_applications, false);
  assert.ok(manifest.icons.some((icon) => icon.sizes === "192x192" && icon.purpose === "any"));
  assert.ok(manifest.icons.some((icon) => icon.sizes === "512x512" && icon.purpose === "any"));
  assert.ok(manifest.icons.some((icon) => icon.sizes === "512x512" && icon.purpose === "maskable"));
  assert.equal(manifest.shortcuts.length, 3);
  assert.deepEqual(
    manifest.shortcuts.map((shortcut) => shortcut.icons[0].src),
    [
      "https://z1fire.github.io/shengtu-mandarin/icons/shortcut-today-dark.png",
      "https://z1fire.github.io/shengtu-mandarin/icons/shortcut-library-dark.png",
      "https://z1fire.github.io/shengtu-mandarin/icons/shortcut-progress-dark.png",
    ],
  );
  assert.ok(manifest.shortcuts.every((shortcut) => shortcut.icons[0].purpose === "any"));

  for (const [file, size] of [["icon-192.png", 192], ["icon-512.png", 512], ["icon-maskable-512.png", 512], ["apple-touch-icon.png", 180], ["shortcut-today.png", 192], ["shortcut-library.png", 192], ["shortcut-progress.png", 192], ["shortcut-today-dark.png", 192], ["shortcut-library-dark.png", 192], ["shortcut-progress-dark.png", 192]]) {
    const png = await readFile(new URL(`../public/icons/${file}`, import.meta.url));
    assert.equal(png.subarray(1, 4).toString("ascii"), "PNG");
    assert.equal(png.readUInt32BE(16), size);
    assert.equal(png.readUInt32BE(20), size);
  }

  assert.match(serviceWorker, /shengtu-v20/);
  assert.match(serviceWorker, /request\.mode === "navigate"/);
  assert.match(serviceWorker, /url\.pathname\.includes\("\/api\/"\)/);
  assert.match(serviceWorker, /icon-maskable-512\.png/);
  assert.match(serviceWorker, /shortcut-today\.png/);
  assert.match(serviceWorker, /shortcut-library\.png/);
  assert.match(serviceWorker, /shortcut-progress\.png/);
  assert.match(serviceWorker, /shortcut-today-dark\.png/);
  assert.match(serviceWorker, /shortcut-library-dark\.png/);
  assert.match(serviceWorker, /shortcut-progress-dark\.png/);
  assert.match(source, /beforeinstallprompt/);
  assert.match(source, /appinstalled/);
  assert.match(source, /Install app/);
  assert.match(source, /Add to Home screen/);
  assert.match(source, /display-mode: standalone/);
  assert.match(source, /updateViaCache: "none"/);
  assert.match(source, /audioRecallPrompt/);
  assert.match(source, /prompt-audio-actions/);
  assert.match(appCss, /\.study-card\.audio-recall-prompt \.card-audio-actions/);
  assert.match(appCss, /\.study-card\.audio-recall-prompt \.audio-link \{[^}]*background: var\(--ink\)/);
  assert.match(layoutSource, /rel="manifest"/);
  assert.match(layoutSource, /crossOrigin="use-credentials"/);
  assert.match(source, /className="app-version"/);
  assert.match(source, /v\{APP_VERSION\}/);
  assert.match(versionSource, /APP_VERSION = "1\.2\.5"/);
  assert.match(pagesHtml, /mobile-web-app-capable/);
  assert.match(pagesHtml, /apple-touch-icon\.png/);
  assert.match(pagesHtml, /viewport-fit=cover/);
});

test("configures authenticated cross-device progress sync with a device-local fallback", async () => {
  const hosting = JSON.parse(await readFile(new URL("../.openai/hosting.json", import.meta.url), "utf8"));
  const route = await readFile(new URL("../app/api/progress/route.ts", import.meta.url), "utf8");
  const persistence = await readFile(new URL("../db/progress.ts", import.meta.url), "utf8");
  const schema = await readFile(new URL("../db/schema.ts", import.meta.url), "utf8");
  const migration = await readFile(new URL("../drizzle/0001_stiff_stryfe.sql", import.meta.url), "utf8");
  const source = await readFile(new URL("../src/MandarinApp.tsx", import.meta.url), "utf8");
  const css = await readFile(new URL("../src/mandarin.css", import.meta.url), "utf8");
  assert.equal(hosting.d1, "DB");
  assert.match(route, /getChatGPTUser/);
  assert.match(route, /readLearnerProgress/);
  assert.match(route, /writeLearnerProgress/);
  assert.match(route, /expectedUpdatedAt/);
  assert.match(route, /status: 409/);
  assert.match(route, /status: 428/);
  assert.match(schema, /learner_progress/);
  assert.match(schema, /learnerProgressHistory/);
  assert.match(migration, /learner_progress_history/);
  assert.match(persistence, /WHERE user_id = \? AND updated_at = \?/);
  assert.match(persistence, /LIMIT 20/);
  assert.match(source, /ACCOUNT &amp; SYNC/);
  assert.match(source, /\/signin-with-chatgpt\?return_to=%2F/);
  assert.match(source, /\/signout-with-chatgpt\?return_to=%2F/);
  assert.match(source, /Open the synced app/);
  assert.match(source, /Two progress copies were found/);
  assert.match(source, /syncReady && !syncConflict/);
  assert.match(source, /Device-only copy/);
  assert.match(css, /\.account-sheet/);
  assert.match(css, /\.sync-conflict-sheet/);
  assert.match(css, /\.device-only-banner/);
});
