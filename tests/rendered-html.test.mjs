import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";
import {
  activate,
  buildDailyQueue,
  completeDailyStep,
  earnOnce,
  makeStarterProgress,
  normalizeProgress,
  scheduleReview,
  similarityScore,
} from "../src/learning-engine.ts";
import {
  grammarPoints,
  listeningQuestions,
  mockExamQuestions,
  recognitionCharacters,
  sentenceChallenges,
  vocabulary,
} from "../src/hsk-data.ts";

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
  assert.match(source, /className="mobile-nav"/);
  assert.match(source, /className="lesson-next-bar"/);
  assert.match(source, /function appRouteFromHash/);
  assert.match(source, /window\.history\.pushState/);
  assert.match(source, /addEventListener\("popstate"/);
  assert.match(css, /\.mobile-nav\s*\{[^}]*display:\s*none/s);
  assert.match(css, /@media \(max-width:\s*850px\)[\s\S]*\.mobile-nav\s*\{[^}]*display:\s*grid/s);
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
  assert.ok(vocabulary.every((word) => word.example && word.collocation));
});

test("builds a bounded daily queue and schedules reviews by recall quality", () => {
  const progress = { ...makeStarterProgress("2026-08-20"), dailyNew: 8 };
  assert.equal(buildDailyQueue(progress, 300, 0).length, 8);
  assert.equal(scheduleReview(undefined, "again", 0).dueAt, 60_000);
  assert.equal(scheduleReview(undefined, "hard", 0).intervalDays, 1);
  assert.equal(scheduleReview(undefined, "good", 0).intervalDays, 2);
  assert.equal(scheduleReview(undefined, "easy", 0).intervalDays, 7);
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
  const normalized = normalizeProgress(stale, 300, "2026-08-19");
  assert.deepEqual(normalized.daily, []);
  assert.deepEqual(normalized.listeningDone, []);
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
