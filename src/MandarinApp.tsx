"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  grammarPoints,
  listeningQuestions,
  missions,
  mockExamQuestions,
  pronunciationDrills,
  recognitionCharacters,
  sentenceChallenges,
  vocabulary,
} from "./hsk-data";
import {
  buildDailyQueue,
  completeDailyStep,
  earnOnce,
  localDate,
  makeStarterProgress,
  normalizeProgress,
  scheduleReview,
  similarityScore,
  type Progress,
  type ReviewGrade,
} from "./learning-engine";
import "./mandarin.css";

type PracticeMode = "flashcards" | "grammar" | "listening" | "builder" | "speaking";
type AppView = "today" | "course" | "library" | "exam" | "progress";
type LibraryView = "words" | "characters" | "grammar";

const STORAGE_KEY = "shengtu-hsk1-progress";
const today = localDate();

const missionGrammarMap = [
  [0, 5, 8], [1, 3, 37], [17, 19, 34], [9, 53, 11],
  [46, 49, 50], [57, 43, 62], [38, 35, 26], [13, 66, 22],
  [59, 60, 18], [2, 55, 40], [4, 54, 67], [20, 7, 23],
];

const missionBuilders = [
  { tokens: ["你好", "我叫", "安娜", "你呢"], answer: "你好我叫安娜你呢" },
  { tokens: ["我家", "有", "四口", "人"], answer: "我家有四口人" },
  { tokens: ["我要", "一杯茶", "和", "十个饺子"], answer: "我要一杯茶和十个饺子" },
  { tokens: ["我", "早上七点", "起床"], answer: "我早上七点起床" },
  { tokens: ["现在", "九点半"], answer: "现在九点半" },
  { tokens: ["请问", "医院", "在哪里"], answer: "请问医院在哪里" },
  { tokens: ["这个", "多少钱", "太贵了"], answer: "这个多少钱太贵了" },
  { tokens: ["我", "在大学", "学习中文"], answer: "我在大学学习中文" },
  { tokens: ["我", "坐火车", "去学校"], answer: "我坐火车去学校" },
  { tokens: ["明天", "会", "下雨吗"], answer: "明天会下雨吗" },
  { tokens: ["我", "生病了", "想去医院"], answer: "我生病了想去医院" },
  { tokens: ["我", "会说", "一点儿中文了"], answer: "我会说一点儿中文了" },
];

const missionPhaseCopy = [
  { title: "Build the language", detail: "Learn the key words and one grammar pattern." },
  { title: "Connect the pieces", detail: "Understand and produce the mission language." },
  { title: "Perform the mission", detail: "Complete the role-play without reading." },
];

function shuffle<T>(items: T[]) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }
  return copy;
}

function speak(text: string, rate = 0.82) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "zh-CN";
  utterance.rate = rate;
  const voices = window.speechSynthesis.getVoices();
  const chineseVoice = voices.find((voice) => voice.lang.toLowerCase().startsWith("zh"));
  if (chineseVoice) utterance.voice = chineseVoice;
  window.speechSynthesis.speak(utterance);
}

function dueLabel(grade: ReviewGrade, reviewDays: number) {
  if (grade === "again") return "1 min";
  if (grade === "hard") return `${Math.max(1, reviewDays)} day`;
  if (grade === "good") return reviewDays ? `${Math.max(2, Math.round(reviewDays * 2.2))} days` : "2 days";
  return reviewDays ? `${Math.max(7, Math.round(reviewDays * 3.2))} days` : "7 days";
}

function appRouteFromHash(hash: string): { view: AppView; library?: LibraryView; lesson?: boolean } {
  const route = hash.replace(/^#/, "");
  if (route === "course" || route === "exam" || route === "progress") return { view: route };
  if (route.startsWith("library/")) {
    const library = route.split("/")[1];
    return { view: "library", library: library === "characters" || library === "grammar" ? library : "words" };
  }
  return { view: "today", lesson: route === "today/lesson" };
}

export default function MandarinApp() {
  const [progress, setProgress] = useState<Progress>(() => makeStarterProgress(today));
  const [ready, setReady] = useState(false);
  const [onboardingGoal, setOnboardingGoal] = useState(8);
  const [appView, setAppView] = useState<AppView>("today");
  const [todayScreen, setTodayScreen] = useState<"plan" | "lesson">("plan");
  const [libraryView, setLibraryView] = useState<LibraryView>("words");
  const [practice, setPractice] = useState<PracticeMode>("flashcards");
  const [cardRevealed, setCardRevealed] = useState(false);
  const [search, setSearch] = useState("");
  const [characterSearch, setCharacterSearch] = useState("");
  const [grammarSearch, setGrammarSearch] = useState("");
  const [showAllWords, setShowAllWords] = useState(false);
  const [showAllCharacters, setShowAllCharacters] = useState(false);
  const [grammarFilter, setGrammarFilter] = useState("All");
  const [showAllGrammar, setShowAllGrammar] = useState(false);
  const [grammarPractice, setGrammarPractice] = useState<number | null>(null);
  const [grammarOptions, setGrammarOptions] = useState<string[]>([]);
  const [grammarResult, setGrammarResult] = useState("");
  const [dailyGrammarResult, setDailyGrammarResult] = useState("");
  const [missionListenResult, setMissionListenResult] = useState("");
  const [listenOrder] = useState(() => shuffle(listeningQuestions.map((_, index) => index)));
  const [listenPosition, setListenPosition] = useState(0);
  const activeListening = listeningQuestions[listenOrder[listenPosition] ?? 0];
  const [listenOptions, setListenOptions] = useState(() => shuffle(listeningQuestions[listenOrder[0] ?? 0].options));
  const [listenResult, setListenResult] = useState<string | null>(null);
  const [buildIndex, setBuildIndex] = useState(0);
  const [wordBank, setWordBank] = useState(() => shuffle(sentenceChallenges[0].tokens));
  const [built, setBuilt] = useState<string[]>([]);
  const [buildResult, setBuildResult] = useState<string | null>(null);
  const [missionWordBank, setMissionWordBank] = useState(() => shuffle(missionBuilders[0].tokens));
  const [missionBuilt, setMissionBuilt] = useState<string[]>([]);
  const [missionBuildResult, setMissionBuildResult] = useState("");
  const [pronunciationIndex, setPronunciationIndex] = useState(0);
  const [showSoundGym, setShowSoundGym] = useState(false);
  const [speechText, setSpeechText] = useState("Listen, shadow, then record the line.");
  const [speechScore, setSpeechScore] = useState<number | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [missionSpeechText, setMissionSpeechText] = useState("Listen once, shadow twice, then perform the mission line without reading.");
  const [missionSpeechScore, setMissionSpeechScore] = useState<number | null>(null);
  const [isMissionListening, setIsMissionListening] = useState(false);
  const [examStarted, setExamStarted] = useState(false);
  const [examIndex, setExamIndex] = useState(0);
  const [examAnswers, setExamAnswers] = useState<Record<string, string>>({});
  const [examOptions, setExamOptions] = useState<Record<string, string[]>>({});
  const [examRemaining, setExamRemaining] = useState(40 * 60);
  const [examResult, setExamResult] = useState<{ correct: number; score: number } | null>(null);
  const [toast, setToast] = useState("");
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        const parsed = stored ? JSON.parse(stored) : null;
        const normalized = normalizeProgress(parsed, vocabulary.length, today);
        setProgress(normalized);
        setOnboardingGoal(normalized.dailyNew);
      } catch {
        setProgress(normalizeProgress(null, vocabulary.length, today));
      }
      const route = appRouteFromHash(window.location.hash);
      setAppView(route.view);
      if (route.library) setLibraryView(route.library);
      if (route.lesson) setTodayScreen("lesson");
      setReady(true);
    }, 0);
    if ("serviceWorker" in navigator) navigator.serviceWorker.register(new URL("./sw.js", window.location.href).pathname).catch(() => undefined);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleHistory = () => {
      const route = appRouteFromHash(window.location.hash);
      setAppView(route.view);
      setTodayScreen(route.lesson ? "lesson" : "plan");
      if (route.library) setLibraryView(route.library);
      window.scrollTo({ top: 0 });
    };
    window.addEventListener("popstate", handleHistory);
    return () => window.removeEventListener("popstate", handleHistory);
  }, []);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }, [progress, ready]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const finishExam = useCallback(() => {
    const correct = mockExamQuestions.filter((question) => examAnswers[question.id] === question.answer).length;
    const score = Math.round((correct / mockExamQuestions.length) * 100);
    setExamResult({ correct, score });
    setProgress((current) => {
      const attempt = { date: today, score, correct, total: mockExamQuestions.length };
      const withAttempt = { ...current, examHistory: [...current.examHistory, attempt].slice(-20) };
      return earnOnce(withAttempt, `${today}:mock-complete`, 50, today);
    });
    setToast(`Mock complete · ${score}%`);
  }, [examAnswers]);

  useEffect(() => {
    if (!examStarted || examResult) return;
    if (examRemaining <= 0) {
      const timeout = window.setTimeout(finishExam, 0);
      return () => window.clearTimeout(timeout);
    }
    const timer = window.setInterval(() => setExamRemaining((seconds) => Math.max(0, seconds - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [examRemaining, examResult, examStarted, finishExam]);

  const filteredWords = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return vocabulary;
    return vocabulary.filter((word) => `${word.hanzi} ${word.pinyin} ${word.meaning} ${word.example} ${word.collocation}`.toLowerCase().includes(query));
  }, [search]);

  const filteredGrammar = grammarPoints.filter((point) => {
    const matchesFilter = grammarFilter === "All" || point.group === grammarFilter;
    const query = grammarSearch.trim().toLowerCase();
    return matchesFilter && (!query || `${point.title} ${point.formula} ${point.example} ${point.pinyin} ${point.translation} ${point.label}`.toLowerCase().includes(query));
  });
  const filteredCharacters = recognitionCharacters.filter((character) => {
    const query = characterSearch.trim().toLowerCase();
    if (!query) return true;
    const samples = vocabulary.filter((word) => word.hanzi.includes(character));
    return `${character} ${samples.map((word) => `${word.hanzi} ${word.pinyin} ${word.meaning}`).join(" ")}`.toLowerCase().includes(query);
  });
  const visibleGrammar = showAllGrammar || grammarFilter !== "All" || grammarSearch ? filteredGrammar : filteredGrammar.slice(0, 20);
  const visibleWords = showAllWords || search ? filteredWords : filteredWords.slice(0, 24);
  const dayPercent = Math.round((progress.daily.length / 5) * 100);
  const coursePercent = Math.round((progress.mastered.length / vocabulary.length) * 100);
  const activeWordIndex = progress.dailyQueue[progress.cardPosition];
  const activeWord = activeWordIndex === undefined ? null : vocabulary[activeWordIndex];
  const activeReview = activeWordIndex === undefined ? undefined : progress.reviews[activeWordIndex];
  const queuePercent = progress.dailyQueue.length ? Math.round((progress.cardPosition / progress.dailyQueue.length) * 100) : 100;
  const activeSentence = sentenceChallenges[buildIndex];
  const activePronunciation = pronunciationDrills[pronunciationIndex];
  const completedMissionToday = progress.daily.includes("speak");
  const missionSequenceIndex = Math.min(35, Math.max(0, progress.missionSteps.length - (completedMissionToday ? 1 : 0)));
  const activeMissionIndex = Math.min(missions.length - 1, Math.floor(missionSequenceIndex / 3));
  const missionPhase = missionSequenceIndex % 3;
  const activeMission = missions[activeMissionIndex];
  const missionBuilder = missionBuilders[activeMissionIndex];
  const dailyGrammarIndex = missionGrammarMap[activeMissionIndex][missionPhase];
  const dailyGrammar = grammarPoints[dailyGrammarIndex];
  const dailyGrammarOptions = useMemo(() => shuffle([
    dailyGrammar.example,
    ...grammarPoints.filter((_, index) => index !== dailyGrammarIndex).slice((dailyGrammarIndex + 7) % 60, ((dailyGrammarIndex + 7) % 60) + 2).map((point) => point.example),
  ]), [dailyGrammar, dailyGrammarIndex]);
  const missionListenOptions = useMemo(() => shuffle([
    activeMission.translation,
    missions[(activeMissionIndex + 4) % missions.length].translation,
    missions[(activeMissionIndex + 7) % missions.length].translation,
  ]), [activeMission, activeMissionIndex]);
  const missionReady = ["review", "grammar", "listen", "build"].every((step) => progress.daily.includes(step));
  const examQuestion = mockExamQuestions[examIndex];
  const examMinutes = String(Math.floor(examRemaining / 60)).padStart(2, "0");
  const examSeconds = String(examRemaining % 60).padStart(2, "0");

  useEffect(() => {
    if (!ready) return;
    const timer = window.setTimeout(() => {
      setMissionWordBank(shuffle(missionBuilders[activeMissionIndex].tokens));
      setMissionBuilt([]);
      setMissionBuildResult("");
      setMissionListenResult("");
      setDailyGrammarResult("");
      setMissionSpeechText("Listen once, shadow twice, then perform the mission line without reading.");
      setMissionSpeechScore(null);
      const focusIndexes = activeMission.words.split(" · ").map((term) => vocabulary.findIndex((word) => word.hanzi === term)).filter((index) => index >= 0);
      if (!focusIndexes.length) return;
      setProgress((current) => {
        const completed = current.dailyQueue.slice(0, current.cardPosition);
        const remaining = current.dailyQueue.slice(current.cardPosition);
        const priority = focusIndexes.filter((index) => !completed.includes(index));
        const reordered = [...new Set([...priority, ...remaining])].slice(0, Math.max(remaining.length, priority.length));
        const dailyQueue = [...completed, ...reordered];
        return dailyQueue.every((value, index) => value === current.dailyQueue[index]) && dailyQueue.length === current.dailyQueue.length
          ? current
          : { ...current, dailyQueue };
      });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [activeMission, activeMissionIndex, missionPhase, ready]);

  const dailySteps = [
    { id: "review", mode: "flashcards" as const, time: 5, title: "Retrieval warm-up", detail: progress.dailyQueue.length ? `${progress.dailyQueue.length} scheduled words` : "Queue complete", accent: "coral" },
    { id: "grammar", mode: "grammar" as const, time: 5, title: "Grammar focus", detail: dailyGrammar.title, accent: "yellow" },
    { id: "listen", mode: "listening" as const, time: 6, title: "Mission listening", detail: `Understand: ${activeMission.title}`, accent: "blue" },
    { id: "build", mode: "builder" as const, time: 6, title: "Build the mission", detail: activeMission.phrase, accent: "coral" },
    { id: "speak", mode: "speaking" as const, time: 8, title: "Mission checkpoint", detail: missionReady ? "Ready for the role-play" : "Complete the earlier steps first", accent: "jade" },
  ];
  const practiceOrder: PracticeMode[] = ["flashcards", "grammar", "listening", "builder", "speaking"];
  const practiceLabels: Record<PracticeMode, string> = { flashcards: "Recall", grammar: "Grammar", listening: "Listening", builder: "Sentence lab", speaking: "Mission speaking" };
  const nextRecommended = dailySteps.find((step) => !progress.daily.includes(step.id))?.mode ?? "flashcards";
  const nextPractice = practiceOrder[(practiceOrder.indexOf(practice) + 1) % practiceOrder.length];

  function navigate(view: AppView) {
    const hash = view === "today" ? "#today" : `#${view}`;
    if (window.location.hash !== hash) window.history.pushState(null, "", hash);
    setAppView(view);
    if (view === "today") setTodayScreen("plan");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openLibrary(view: LibraryView) {
    const hash = `#library/${view}`;
    if (window.location.hash !== hash) window.history.pushState(null, "", hash);
    setAppView("library");
    setLibraryView(view);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goToPractice(mode: PracticeMode) {
    if (window.location.hash !== "#today/lesson") window.history.pushState(null, "", "#today/lesson");
    setAppView("today");
    setTodayScreen("lesson");
    setPractice(mode);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function startCourse() {
    setProgress((current) => {
      const configured = { ...current, onboarded: true, dailyNew: onboardingGoal };
      return { ...configured, dailyQueue: buildDailyQueue(configured, vocabulary.length), dailyQueueDate: today, cardPosition: 0 };
    });
    setToast(`Daily goal set to ${onboardingGoal} new words`);
    goToPractice("flashcards");
  }

  function gradeCard(grade: ReviewGrade) {
    if (activeWordIndex === undefined) return;
    setProgress((current) => {
      const scheduled = scheduleReview(current.reviews[activeWordIndex], grade);
      const queue = [...current.dailyQueue];
      if (grade === "again") queue.splice(Math.min(current.cardPosition + 3, queue.length), 0, activeWordIndex);
      let next: Progress = {
        ...current,
        reviews: { ...current.reviews, [activeWordIndex]: scheduled },
        dailyQueue: queue,
        cardPosition: current.cardPosition + 1,
        mastered: scheduled.repetitions >= 3
          ? current.mastered.includes(activeWordIndex) ? current.mastered : [...current.mastered, activeWordIndex]
          : current.mastered.filter((index) => index !== activeWordIndex),
      };
      next = earnOnce(next, `${today}:review:${activeWordIndex}`, grade === "again" ? 2 : 5, today);
      if (next.cardPosition >= next.dailyQueue.length) next = completeDailyStep(next, "review", 5, today);
      return next;
    });
    setCardRevealed(false);
    setToast(grade === "again" ? "Scheduled again in this session" : `Next review: ${dueLabel(grade, activeReview?.intervalDays ?? 0)}`);
  }

  function answerListening(answer: string) {
    const correct = answer === activeListening.answer;
    setListenResult(correct ? `Correct — ${activeListening.prompt}` : "Not yet. Replay and listen for the key words.");
    if (!correct) return;
    setProgress((current) => {
      const done = current.listeningDone.includes(activeListening.id) ? current.listeningDone : [...current.listeningDone, activeListening.id];
      let next = { ...current, listeningDone: done };
      next = earnOnce(next, `${today}:listen:${activeListening.id}`, 8, today);
      return next;
    });
    setToast("Meaning caught · +8 XP");
  }

  function nextListening() {
    const next = (listenPosition + 1) % listenOrder.length;
    setListenPosition(next);
    setListenOptions(shuffle(listeningQuestions[listenOrder[next]].options));
    setListenResult(null);
  }

  function addToken(token: string, index: number) {
    setBuilt((current) => [...current, token]);
    setWordBank((current) => current.filter((_, itemIndex) => itemIndex !== index));
    setBuildResult(null);
  }

  function removeToken(token: string, index: number) {
    setBuilt((current) => current.filter((_, itemIndex) => itemIndex !== index));
    setWordBank((current) => [...current, token]);
    setBuildResult(null);
  }

  function resetBuilder(next = false) {
    const index = next ? (buildIndex + 1) % sentenceChallenges.length : buildIndex;
    setBuildIndex(index);
    setWordBank(shuffle(sentenceChallenges[index].tokens));
    setBuilt([]);
    setBuildResult(null);
  }

  function checkBuilder() {
    const correct = built.join("") === activeSentence.answer;
    setBuildResult(correct ? `Correct — ${activeSentence.translation}` : "Almost. Move one token at a time or reset and try the Mandarin order.");
    if (!correct) return;
    setProgress((current) => {
      const done = current.builderDone.includes(activeSentence.id) ? current.builderDone : [...current.builderDone, activeSentence.id];
      let next = { ...current, builderDone: done };
      next = earnOnce(next, `${today}:builder:${activeSentence.id}`, 10, today);
      return next;
    });
    setToast("Sentence built · +10 XP");
  }

  function completePronunciation(message: string) {
    setProgress((current) => {
      const done = current.pronunciationDone.includes(activePronunciation.id) ? current.pronunciationDone : [...current.pronunciationDone, activePronunciation.id];
      let next = { ...current, pronunciationDone: done };
      next = earnOnce(next, `${today}:speak:${activePronunciation.id}`, 12, today);
      return next;
    });
    setToast(message);
  }

  function startSpeechCheck() {
    type RecognitionLike = {
      lang: string;
      interimResults: boolean;
      maxAlternatives: number;
      start: () => void;
      onresult: (event: unknown) => void;
      onerror: () => void;
      onend: () => void;
    };
    type RecognitionWindow = { SpeechRecognition?: new () => RecognitionLike; webkitSpeechRecognition?: new () => RecognitionLike };
    const recognitionWindow = window as unknown as RecognitionWindow;
    const RecognitionCtor = recognitionWindow.SpeechRecognition ?? recognitionWindow.webkitSpeechRecognition;
    if (!RecognitionCtor) {
      setSpeechText("Automatic word checking is unavailable in this browser. Shadow three times, then use the honest self-check.");
      speak(activePronunciation.hanzi, 0.7);
      return;
    }
    const recognition = new RecognitionCtor();
    recognition.lang = "zh-CN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const speechEvent = event as { results: { [key: number]: { [key: number]: { transcript: string } } } };
      const transcript = speechEvent.results[0][0].transcript;
      const score = similarityScore(activePronunciation.hanzi, transcript);
      setSpeechScore(score);
      setSpeechText(`Heard: ${transcript} · word match ${score}%`);
      if (score >= 65) completePronunciation("Words recognized · now self-check the tone contour");
    };
    recognition.onerror = () => setSpeechText("I couldn’t hear that clearly. Move closer and try once more.");
    recognition.onend = () => setIsListening(false);
    setSpeechText(`Listening… say: ${activePronunciation.hanzi}`);
    setSpeechScore(null);
    setIsListening(true);
    recognition.start();
  }

  function openGrammarPractice(index: number) {
    const point = grammarPoints[index];
    const distractors = shuffle(grammarPoints.filter((_, itemIndex) => itemIndex !== index)).slice(0, 2).map((item) => item.example);
    setGrammarPractice(index);
    setGrammarOptions(shuffle([point.example, ...distractors]));
    setGrammarResult("");
    window.setTimeout(() => document.querySelector(".grammar-drill")?.scrollIntoView({ behavior: "smooth", block: "center" }), 0);
  }

  function answerGrammar(option: string) {
    if (grammarPractice === null) return;
    const point = grammarPoints[grammarPractice];
    const correct = option === point.example;
    setGrammarResult(correct ? `Correct — ${point.formula}` : `Try again. Build: ${point.formula}`);
    if (!correct) return;
    setProgress((current) => earnOnce(current, `${today}:grammar:${grammarPractice}`, 6, today));
    setToast("Grammar recalled · +6 XP");
  }

  function answerDailyGrammar(option: string) {
    const correct = option === dailyGrammar.example;
    setDailyGrammarResult(correct ? `Correct — ${dailyGrammar.formula}` : `Try again. Use the pattern: ${dailyGrammar.formula}`);
    if (!correct) return;
    setProgress((current) => {
      let next = earnOnce(current, `${today}:daily-grammar:${activeMissionIndex}:${missionPhase}`, 8, today);
      next = completeDailyStep(next, "grammar", 5, today);
      return next;
    });
    setToast("Grammar focus complete · +8 XP");
  }

  function answerMissionListening(option: string) {
    const correct = option === activeMission.translation;
    setMissionListenResult(correct ? `Correct — ${activeMission.phrase}` : "Not yet. Replay the phrase and listen for the mission words.");
    if (!correct) return;
    setProgress((current) => {
      let next = earnOnce(current, `${today}:mission-listen:${activeMissionIndex}:${missionPhase}`, 8, today);
      next = completeDailyStep(next, "listen", 6, today);
      return next;
    });
    setToast("Mission understood · +8 XP");
  }

  function addMissionToken(token: string, index: number) {
    setMissionBuilt((current) => [...current, token]);
    setMissionWordBank((current) => current.filter((_, itemIndex) => itemIndex !== index));
    setMissionBuildResult("");
  }

  function removeMissionToken(token: string, index: number) {
    setMissionBuilt((current) => current.filter((_, itemIndex) => itemIndex !== index));
    setMissionWordBank((current) => [...current, token]);
    setMissionBuildResult("");
  }

  function resetMissionBuilder() {
    setMissionWordBank(shuffle(missionBuilder.tokens));
    setMissionBuilt([]);
    setMissionBuildResult("");
  }

  function checkMissionBuilder() {
    const correct = missionBuilt.join("") === missionBuilder.answer;
    setMissionBuildResult(correct ? `Correct — ${activeMission.translation}` : "Almost. Move one piece at a time or reset and rebuild the mission line.");
    if (!correct) return;
    setProgress((current) => {
      let next = earnOnce(current, `${today}:mission-build:${activeMissionIndex}:${missionPhase}`, 10, today);
      next = completeDailyStep(next, "build", 6, today);
      return next;
    });
    setToast("Mission line built · +10 XP");
  }

  function startMissionSpeechCheck() {
    type RecognitionLike = {
      lang: string;
      interimResults: boolean;
      maxAlternatives: number;
      start: () => void;
      onresult: (event: unknown) => void;
      onerror: () => void;
      onend: () => void;
    };
    type RecognitionWindow = { SpeechRecognition?: new () => RecognitionLike; webkitSpeechRecognition?: new () => RecognitionLike };
    const recognitionWindow = window as unknown as RecognitionWindow;
    const RecognitionCtor = recognitionWindow.SpeechRecognition ?? recognitionWindow.webkitSpeechRecognition;
    if (!RecognitionCtor) {
      setMissionSpeechText("Automatic word checking is unavailable here. Perform the line aloud, then use the honest self-check.");
      speak(activeMission.phrase, 0.7);
      return;
    }
    const recognition = new RecognitionCtor();
    recognition.lang = "zh-CN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const speechEvent = event as { results: { [key: number]: { [key: number]: { transcript: string } } } };
      const transcript = speechEvent.results[0][0].transcript;
      const score = similarityScore(activeMission.phrase, transcript);
      setMissionSpeechScore(score);
      setMissionSpeechText(score >= 65
        ? `Heard: ${transcript} · word match ${score}%. Now self-check tones and fluency.`
        : `Heard: ${transcript} · word match ${score}%. Shadow twice and try again.`);
    };
    recognition.onerror = () => setMissionSpeechText("I couldn’t hear that clearly. Move closer and try once more.");
    recognition.onend = () => setIsMissionListening(false);
    setMissionSpeechText(`Listening… perform: ${activeMission.phrase}`);
    setMissionSpeechScore(null);
    setIsMissionListening(true);
    recognition.start();
  }

  function completeMissionCheckpoint() {
    if (!missionReady) {
      setToast("Finish review, grammar, listening, and building first");
      return;
    }
    const missionStepKey = `${activeMissionIndex}:${missionPhase}`;
    setProgress((current) => {
      const missionSteps = current.missionSteps.includes(missionStepKey) ? current.missionSteps : [...current.missionSteps, missionStepKey];
      let next = { ...current, missionSteps };
      next = earnOnce(next, `${today}:mission-checkpoint:${missionStepKey}`, 20, today);
      next = completeDailyStep(next, "speak", 8, today);
      if (missionPhase === 2) {
        next = { ...next, missions: next.missions.includes(activeMissionIndex) ? next.missions : [...next.missions, activeMissionIndex] };
        next = earnOnce(next, `mission:${activeMissionIndex}`, 25, today);
      }
      return next;
    });
    setToast(missionPhase === 2 ? "Mission complete · course advanced" : `Mission day ${missionPhase + 1} complete`);
  }

  function studyWord(index: number) {
    setProgress((current) => {
      const remaining = current.dailyQueue.slice(current.cardPosition).includes(index);
      if (remaining) return current;
      const queue = [...current.dailyQueue];
      queue.splice(current.cardPosition, 0, index);
      return { ...current, dailyQueue: queue };
    });
    setCardRevealed(false);
    goToPractice("flashcards");
    setToast("Added to today’s review queue");
  }

  function startMockExam() {
    const optionMap = Object.fromEntries(mockExamQuestions.map((question) => [question.id, shuffle(question.options)]));
    setExamStarted(true);
    setExamIndex(0);
    setExamAnswers({});
    setExamOptions(optionMap);
    setExamRemaining(40 * 60);
    setExamResult(null);
  }

  function exportProgress() {
    const blob = new Blob([JSON.stringify(progress, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `shengtu-progress-${today}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setToast("Progress backup downloaded");
  }

  async function importProgress(file: File | undefined) {
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      const imported = normalizeProgress(parsed, vocabulary.length, today);
      setProgress(imported);
      setOnboardingGoal(imported.dailyNew);
      setToast("Progress restored");
    } catch {
      setToast("That backup file could not be read");
    }
  }

  function resetProgress() {
    if (!window.confirm("Reset all Shēngtú progress on this device? Export a backup first if you may want it later.")) return;
    const starter = normalizeProgress(null, vocabulary.length, today);
    window.localStorage.removeItem(STORAGE_KEY);
    setProgress(starter);
    setOnboardingGoal(starter.dailyNew);
    setToast("Progress reset");
  }

  return (
    <main className="site-shell">
      <header className="topbar">
        <button className="brand" onClick={() => navigate("today")} aria-label="Open today"><span className="brand-mark">声</span><span><strong>SHĒNGTÚ</strong><small>MANDARIN, IN MOTION</small></span></button>
        <nav className="nav-links" aria-label="Primary navigation">
          <button className={appView === "today" ? "active" : ""} onClick={() => navigate("today")}>Today</button>
          <button className={appView === "course" ? "active" : ""} onClick={() => navigate("course")}>Course</button>
          <button className={appView === "library" ? "active" : ""} onClick={() => openLibrary("words")}>Library</button>
          <button className={appView === "exam" ? "active" : ""} onClick={() => navigate("exam")}>Mock exam</button>
          <button className={appView === "progress" ? "active" : ""} onClick={() => navigate("progress")}>Progress</button>
        </nav>
        <div className="header-actions"><span className="streak-pill"><span>火</span> {progress.streak} day streak</span><button className="round-button" onClick={() => setProgress((current) => ({ ...current, showPinyin: !current.showPinyin }))} title="Toggle pinyin">{progress.showPinyin ? "PĪN" : "汉"}</button></div>
      </header>

      <div className="app-content">
      {appView === "today" && todayScreen === "plan" && <>
      <section className="hero" id="top">
        <div className="hero-copy">
          <div className="eyebrow"><span>HSK 3.0</span> LEVEL 1 · CURRENT SYLLABUS</div>
          <h1>Stop studying Mandarin.<br /><em>Start using it.</em></h1>
          <p className="hero-lede">A guided, speaking-first HSK 1 course that schedules the right words each day—never all 300 at once.</p>
          <div className="hero-actions"><button className="primary-button" onClick={() => goToPractice(nextRecommended)}>Continue: {practiceLabels[nextRecommended]} <span>→</span></button><button className="text-button" onClick={() => navigate("course")}><span className="play-dot">▶</span> See the 6-week path</button></div>
          <div className="hero-proof"><div><strong>300</strong><span>core words</span></div><div><strong>246</strong><span>recognition characters</span></div><div><strong>70</strong><span>grammar targets</span></div><div><strong>40m</strong><span>full mock exam</span></div></div>
        </div>

        <aside className="today-card" aria-label="Today’s lesson plan">
          <div className="today-card-head"><div><span className="micro-label">MISSION {String(activeMissionIndex + 1).padStart(2, "0")} · DAY {missionPhase + 1} / 3</span><h2>{activeMission.title}</h2></div><div className="progress-orb" style={{ "--progress": `${dayPercent * 3.6}deg` } as React.CSSProperties}><span>{dayPercent}%</span></div></div>
          <div className="mission-day-note"><strong>{missionPhaseCopy[missionPhase].title}</strong><span>{missionPhaseCopy[missionPhase].detail}</span></div>
          <button className="phrase-card" onClick={() => speak(activeMission.phrase)} aria-label="Play today’s phrase"><span className="sound-button">▶</span><span><strong>{activeMission.phrase}</strong>{progress.showPinyin && <small>{activeMission.pinyin}</small>}<em>{activeMission.translation}</em></span></button>
          <div className="task-list">
            {dailySteps.map((step) => { const done = progress.daily.includes(step.id); return <button key={step.id} className={`task-row ${done ? "done" : ""}`} onClick={() => goToPractice(step.mode)}><span className={`task-time ${step.accent}`}>{done ? "✓" : String(step.time).padStart(2, "0")}</span><span><strong>{step.title}</strong><small>{step.detail}</small></span><span className="task-arrow">{done ? "DONE" : "START →"}</span></button>; })}
          </div>
          <div className="today-foot"><span>30 focused minutes</span><span>{progress.daily.length}/5 complete</span></div>
        </aside>
      </section>

      <section className="method-strip" aria-label="Learning method"><span className="strip-title">THE FAST-FLUENCY LOOP</span><div><b>01</b><span>Notice<small>meaning first</small></span></div><span className="strip-arrow">→</span><div><b>02</b><span>Hear<small>Mandarin model</small></span></div><span className="strip-arrow">→</span><div><b>03</b><span>Say<small>out loud</small></span></div><span className="strip-arrow">→</span><div><b>04</b><span>Recall<small>on schedule</small></span></div></section>
      </>}

      {appView === "today" && todayScreen === "lesson" && (
      <section className="section practice-section" id="practice">
        <div className="lesson-toolbar"><button onClick={() => navigate("today")}>← Today’s plan</button><span>Mission {activeMissionIndex + 1} · day {missionPhase + 1}/3 · step {practiceOrder.indexOf(practice) + 1} of 5</span></div>
        <div className="section-heading two-column-heading"><div><span className="section-kicker">TODAY’S GUIDED LESSON</span><h2>{practiceLabels[practice]}</h2></div><p>Focus on one step. Your plan updates automatically when you hit today’s target.</p></div>
        <div className="practice-tabs" role="tablist" aria-label="Today’s lesson steps">{([ ["flashcards", "01", "Recall"], ["grammar", "02", "Grammar"], ["listening", "03", "Listening"], ["builder", "04", "Build"], ["speaking", "05", "Mission"] ] as [PracticeMode, string, string][]).map(([mode, number, label]) => { const step = dailySteps.find((item) => item.mode === mode); const done = step ? progress.daily.includes(step.id) : false; return <button key={mode} className={`${practice === mode ? "active" : ""} ${done ? "complete" : ""}`} onClick={() => setPractice(mode)} role="tab" aria-selected={practice === mode}><span>{done ? "✓" : number}</span>{label}</button>; })}</div>

        <div className="practice-stage">
          {practice === "flashcards" && (
            <div className="flashcard-lab">
              <div className="lab-instructions"><span className="micro-label">SPACED RECALL · {Math.min(progress.cardPosition + 1, progress.dailyQueue.length)} / {progress.dailyQueue.length}</span><h3>Say it before you flip it.</h3><p>Today mixes up to {progress.dailyNew} new words with reviews that are actually due. Grade your recall honestly; the next date changes with every answer.</p><div className="lab-progress"><span style={{ width: `${queuePercent}%` }} /></div></div>
              {activeWord ? <><div className={`study-card ${cardRevealed ? "revealed" : ""}`}><button className="card-face-button" onClick={() => setCardRevealed((value) => !value)} aria-label="Flip vocabulary card">{!cardRevealed ? <><span className="card-caption">SAY IN MANDARIN</span><strong className="english-prompt">{activeWord.meaning}</strong><span className="flip-hint">Tap to reveal ↗</span></> : <><span className="card-caption">LISTEN & SHADOW</span><strong className="hanzi-prompt">{activeWord.hanzi}</strong>{progress.showPinyin && <span className="pinyin-prompt">{activeWord.pinyin}</span>}<span className="card-example">{activeWord.example}</span></>}</button>{cardRevealed && <button className="audio-link" onClick={() => speak(activeWord.hanzi)}>▶ Play Mandarin</button>}</div><div className="confidence-buttons four"><button onClick={() => gradeCard("again")}>Again <small>1 min</small></button><button onClick={() => gradeCard("hard")}>Hard <small>{dueLabel("hard", activeReview?.intervalDays ?? 0)}</small></button><button onClick={() => gradeCard("good")}>Good <small>{dueLabel("good", activeReview?.intervalDays ?? 0)}</small></button><button onClick={() => gradeCard("easy")}>Easy <small>{dueLabel("easy", activeReview?.intervalDays ?? 0)}</small></button></div></> : <div className="queue-complete"><span>好</span><h3>Today’s recall is complete.</h3><p>No need to review all 300. Come back tomorrow for newly due cards and {progress.dailyNew} new words.</p><button className="primary-button" onClick={() => goToPractice("grammar")}>Continue to grammar <span>→</span></button></div>}
            </div>
          )}

          {practice === "grammar" && <div className="grammar-lesson">
            <div className="lab-instructions"><span className="micro-label">DAILY GRAMMAR · TARGET {dailyGrammarIndex + 1} / {grammarPoints.length}</span><h3>{dailyGrammar.title}</h3><p>Notice one useful pattern, hear it in context, then retrieve the Mandarin sentence from its meaning.</p><button className="slow-link" onClick={() => openLibrary("grammar")}>Browse all 70 grammar targets →</button></div>
            <div className="grammar-teach-card"><span>{dailyGrammar.label}</span><code>{dailyGrammar.formula}</code><button className="grammar-model" onClick={() => speak(dailyGrammar.example)}><span>▶</span><strong>{dailyGrammar.example}</strong>{progress.showPinyin && <small>{dailyGrammar.pinyin}</small>}<em>{dailyGrammar.translation}</em></button><h4>Which Mandarin sentence means “{dailyGrammar.translation}”?</h4><div className="grammar-choices">{dailyGrammarOptions.map((option, index) => <button key={option} onClick={() => answerDailyGrammar(option)} disabled={dailyGrammarResult.startsWith("Correct")}><span>{String.fromCharCode(65 + index)}</span>{option}</button>)}</div>{dailyGrammarResult && <div className={`result-note ${dailyGrammarResult.startsWith("Correct") ? "correct" : ""}`}>{dailyGrammarResult}</div>}</div>
          </div>}

          {practice === "listening" && <div className="required-practice-wrap"><div className="listening-lab mission-listening"><div className="lab-instructions"><span className="micro-label">MISSION LISTENING · DAY {missionPhase + 1} / 3</span><h3>Understand it before you read it.</h3><p>Play the real-life mission line and choose its meaning. Characters stay hidden until you catch the message.</p><button className="big-listen-button" onClick={() => speak(activeMission.phrase)}><span>▶</span> Play mission line</button><button className="slow-link" onClick={() => speak(activeMission.phrase, 0.62)}>Play slower</button></div><div className="answer-stack">{missionListenOptions.map((option, index) => <button key={option} onClick={() => answerMissionListening(option)} disabled={missionListenResult.startsWith("Correct")}><span>{String.fromCharCode(65 + index)}</span>{option}</button>)}{missionListenResult && <div className={`result-note ${missionListenResult.startsWith("Correct") ? "correct" : ""}`}>{missionListenResult}</div>}</div></div><details className="extra-practice"><summary>Extra listening reps <span>20-question practice bank</span></summary><div className="listening-lab"><div className="lab-instructions"><span className="micro-label">OPTIONAL LISTENING · {listenPosition + 1} / {listeningQuestions.length}</span><h3>Keep training your ear.</h3><p>This practice bank awards extra XP without changing today’s required mission.</p><button className="big-listen-button" onClick={() => speak(activeListening.prompt)}><span>▶</span> Play Mandarin</button><button className="slow-link" onClick={() => speak(activeListening.prompt, 0.62)}>Play slower</button></div><div className="answer-stack">{listenOptions.map((option, index) => <button key={option} onClick={() => answerListening(option)} disabled={listenResult?.startsWith("Correct")}><span>{String.fromCharCode(65 + index)}</span>{option}</button>)}{listenResult && <div className={`result-note ${listenResult.startsWith("Correct") ? "correct" : ""}`}>{listenResult}<button onClick={nextListening}>Next →</button></div>}</div></div></details></div>}

          {practice === "builder" && <div className="required-practice-wrap"><div className="builder-lab mission-builder"><div className="lab-instructions"><span className="micro-label">BUILD THE MISSION · DAY {missionPhase + 1} / 3</span><h3>Assemble the line you will perform.</h3><p>{activeMission.translation} Put the Mandarin into its natural order. Tap a placed piece to move it back.</p></div><div className="builder-board"><div className="sentence-line">{missionBuilt.length ? missionBuilt.map((token, index) => <button key={`${token}-${index}`} onClick={() => removeMissionToken(token, index)}>{token}</button>) : <span>Tap the pieces below to build the mission line…</span>}</div><div className="word-bank">{missionWordBank.map((token, index) => <button key={`${token}-${index}`} onClick={() => addMissionToken(token, index)}>{token}</button>)}</div><div className="builder-actions"><button onClick={resetMissionBuilder}>Reset</button><button className="check-button" onClick={checkMissionBuilder} disabled={!missionBuilt.length}>Check mission line</button></div>{missionBuildResult && <div className={`result-note ${missionBuildResult.startsWith("Correct") ? "correct" : ""}`}>{missionBuildResult}</div>}</div></div><details className="extra-practice"><summary>Extra sentence reps <span>16-challenge practice bank</span></summary><div className="builder-lab"><div className="lab-instructions"><span className="micro-label">OPTIONAL SENTENCE LAB · {buildIndex + 1} / {sentenceChallenges.length}</span><h3>Build another thought.</h3><p>{activeSentence.translation} This practice bank awards extra XP without changing today’s required mission.</p></div><div className="builder-board"><div className="sentence-line">{built.length ? built.map((token, index) => <button key={`${token}-${index}`} onClick={() => removeToken(token, index)}>{token}</button>) : <span>Tap words below to build the sentence…</span>}</div><div className="word-bank">{wordBank.map((token, index) => <button key={`${token}-${index}`} onClick={() => addToken(token, index)}>{token}</button>)}</div><div className="builder-actions"><button onClick={() => resetBuilder()}>Reset</button><button className="check-button" onClick={checkBuilder} disabled={!built.length}>Check sentence</button></div>{buildResult && <div className={`result-note ${buildResult.startsWith("Correct") ? "correct" : ""}`}>{buildResult}<button onClick={() => resetBuilder(true)}>Next →</button></div>}</div></div></details></div>}

          {practice === "speaking" && <div className="mission-checkpoint"><div className="checkpoint-intro"><span className="micro-label">REAL-LIFE CHECKPOINT · MISSION {activeMissionIndex + 1} · DAY {missionPhase + 1} / 3</span><h3>{missionPhase === 2 ? "Perform it without reading." : "Prove today’s mission skill."}</h3><p>{missionPhaseCopy[missionPhase].detail} Listen once, shadow twice, then look away and deliver the line naturally.</p><div className="checkpoint-readiness">{dailySteps.slice(0, 4).map((step) => <span key={step.id} className={progress.daily.includes(step.id) ? "ready" : ""}>{progress.daily.includes(step.id) ? "✓" : "○"} {step.title}</span>)}</div></div><div className="speech-console mission-speech-console"><button className="speaker-orb" onClick={() => speak(activeMission.phrase, 0.7)} aria-label="Play mission phrase">声<span>▶ MODEL</span></button><strong>{activeMission.phrase}</strong>{progress.showPinyin && <p>{activeMission.pinyin}</p>}<em>{activeMission.translation}</em><button className={`record-button ${isMissionListening ? "recording" : ""}`} onClick={startMissionSpeechCheck}><span>●</span>{isMissionListening ? "Listening…" : "Perform my line"}</button><div className="speech-feedback">{missionSpeechText}</div>{missionSpeechScore !== null && <div className="speech-meter"><i style={{ width: `${missionSpeechScore}%` }} /></div>}<button className="checkpoint-button" onClick={completeMissionCheckpoint} disabled={!missionReady || completedMissionToday}>{completedMissionToday ? "✓ Checkpoint complete" : missionPhase === 2 ? "I performed it · complete mission" : "I performed it · complete today"}</button><small className="speech-honesty">Recognition checks words, not tone accuracy. Complete only after an honest self-check.</small></div><div className="sound-gym-toggle"><button onClick={() => setShowSoundGym((value) => !value)}>{showSoundGym ? "Close sound gym" : "Open optional sound gym"}</button><span>Keep all {pronunciationDrills.length} pronunciation drills available for extra practice.</span></div>{showSoundGym && <div className="speaking-lab pronunciation-lab sound-gym"><div className="lab-instructions"><span className="micro-label">OPTIONAL TONE & SOUND GYM · {pronunciationIndex + 1} / {pronunciationDrills.length}</span><h3>Train the sound, not just the word.</h3><p>{activePronunciation.cue}</p><div className="tone-map" aria-label="Mandarin tone contours"><span>1 ˉ<small>high</small></span><span>2 ˊ<small>rise</small></span><span>3 ˇ<small>dip</small></span><span>4 ˋ<small>fall</small></span><span>·<small>light</small></span></div></div><div><div className="pronunciation-picker">{pronunciationDrills.map((drill, index) => <button key={drill.id} className={index === pronunciationIndex ? "active" : ""} onClick={() => { setPronunciationIndex(index); setSpeechScore(null); setSpeechText("Listen, shadow, then record the line."); }}>{drill.focus}</button>)}</div><div className="speech-console"><button className="speaker-orb" onClick={() => speak(activePronunciation.hanzi, 0.7)} aria-label="Play phrase">声<span>▶ MODEL</span></button><strong>{activePronunciation.hanzi}</strong>{progress.showPinyin && <p>{activePronunciation.pinyin}</p>}<button className={`record-button ${isListening ? "recording" : ""}`} onClick={startSpeechCheck}><span>●</span>{isListening ? "Listening…" : "Record my line"}</button><div className="speech-feedback">{speechText}</div>{speechScore !== null && <div className="speech-meter"><i style={{ width: `${speechScore}%` }} /></div>}<div className="self-checks"><button onClick={() => completePronunciation("Pronunciation drill recorded · +12 XP")}>Tone contour felt accurate</button><button onClick={() => { setSpeechText("Replay slowly and exaggerate the contour once, then repeat naturally."); speak(activePronunciation.hanzi, 0.58); }}>Needs another round</button></div><small className="speech-honesty">Browser recognition checks the words, not pitch. Use the tone cue and an honest self-check.</small></div></div></div>}</div>}
        </div>
        <div className="lesson-next-bar"><button onClick={() => navigate("today")}>Save & return to plan</button><div><span>UP NEXT</span><strong>{practiceLabels[nextPractice]}</strong></div><button className="next-step-button" onClick={() => setPractice(nextPractice)}>Continue →</button></div>
      </section>
      )}

      {appView === "course" && (
        <section className="section path-section app-view" id="path">
          <div className="view-intro"><span className="view-icon">路</span><div><span className="section-kicker">COURSE</span><h1>Your 6-week route</h1><p>Two real-life missions per week. Each mission unfolds across three guided days and completes automatically after its final speaking checkpoint.</p></div></div>
          <div className="section-heading path-heading"><div><h2>Twelve real-life<br /><em>missions.</em></h2></div><div className="route-summary"><strong>{progress.missions.length}/12</strong><span>missions complete</span><div><i style={{ width: `${(progress.missions.length / missions.length) * 100}%` }} /></div></div></div>
          <div className="mission-grid">{missions.map((mission, index) => { const done = progress.missions.includes(index); const current = index === activeMissionIndex && !done; const locked = index > activeMissionIndex; return <article key={mission.title} className={`mission-card ${done ? "complete" : ""} ${current ? "current" : ""} ${locked ? "locked" : ""}`}><div className="mission-top"><span>W{mission.week} · {String(index + 1).padStart(2, "0")}</span><button onClick={() => current && goToPractice(nextRecommended)} disabled={!current}>{done ? "✓ DONE" : current ? `DAY ${missionPhase + 1} / 3 · CONTINUE` : "LOCKED"}</button></div><h3>{mission.title}</h3><p>{mission.subtitle}</p>{current && <div className="mission-progress"><span style={{ width: `${((missionPhase + (completedMissionToday ? 1 : 0)) / 3) * 100}%` }} /></div>}<div className="mission-words">{mission.words}</div><button className="mission-phrase" onClick={() => speak(mission.phrase)}><span>▶</span><strong>{mission.phrase}</strong>{progress.showPinyin && <small>{mission.pinyin}</small>}</button></article>; })}</div>
        </section>
      )}

      {appView === "library" && libraryView !== "grammar" && (
        <section className="section vocabulary-section app-view" id="vocabulary">
          <div className="view-intro light-view"><span className="view-icon">库</span><div><span className="section-kicker">LIBRARY</span><h1>Explore the syllabus</h1><p>Reference material lives here. Your required work is always waiting under Today.</p></div></div>
          <div className="library-tabs" role="tablist" aria-label="Library sections">
            <button className={libraryView === "words" ? "active" : ""} onClick={() => openLibrary("words")}>300 Words</button>
            <button className={libraryView === "characters" ? "active" : ""} onClick={() => openLibrary("characters")}>246 Characters</button>
            <button onClick={() => openLibrary("grammar")}>70 Grammar</button>
          </div>
          {libraryView === "words" && <>
            <div className="section-heading vocabulary-heading"><div><span className="section-kicker">COMPLETE HSK 1 WORD BANK</span><h2>All 300 words.<br /><em>With context.</em></h2></div><div className="vocab-tools"><label><span>⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search 汉字, pinyin, English, or examples" aria-label="Search vocabulary" /></label><button onClick={() => setProgress((current) => ({ ...current, showPinyin: !current.showPinyin }))}>{progress.showPinyin ? "Hide pinyin" : "Show pinyin"}</button></div></div>
            <div className="vocab-status"><span><b>{progress.mastered.length}</b> stable words</span><div><i style={{ width: `${coursePercent}%` }} /></div><span>{coursePercent}%</span></div>
            <div className="word-grid">{visibleWords.map((word) => { const originalIndex = vocabulary.indexOf(word); const mastered = progress.mastered.includes(originalIndex); const learned = Boolean(progress.reviews[originalIndex]); return <article key={`${word.hanzi}-${originalIndex}`} className={mastered ? "mastered" : ""}><button className="word-audio" onClick={() => speak(word.hanzi)} aria-label={`Play ${word.hanzi}`}>▶</button><strong>{word.hanzi}</strong>{progress.showPinyin && <span>{word.pinyin}</span>}<p>{word.meaning}</p><div className="word-context"><b>{word.example}</b><small>{word.collocation}</small>{word.note && <em>{word.note}</em>}</div><button className="master-button" onClick={() => studyWord(originalIndex)}>{mastered ? "✓ Stable · review now" : learned ? "Learning · review now" : "+ Add to today"}</button></article>; })}</div>
            {!search && <button className="load-more" onClick={() => setShowAllWords((value) => !value)}>{showAllWords ? "Show the focused set" : `Explore all ${vocabulary.length} words`} <span>↓</span></button>}
          </>}
          {libraryView === "characters" && <><label className="library-search"><span>⌕</span><input value={characterSearch} onChange={(event) => setCharacterSearch(event.target.value)} placeholder="Search character, word, pinyin, or meaning" aria-label="Search characters" /></label><div className="character-bank standalone"><div><span className="section-kicker">CHARACTER RECOGNITION</span><h3>{characterSearch ? `${filteredCharacters.length} matching characters.` : "Recognize all 246."}</h3><p>HSK 1 tests listening and reading—not handwriting. Tap a character to hear a syllabus word that uses it.</p></div><div className="character-grid">{(showAllCharacters || characterSearch ? filteredCharacters : filteredCharacters.slice(0, 80)).map((character, index) => { const sample = vocabulary.find((word) => word.hanzi.includes(character)); return <button key={`${character}-${index}`} onClick={() => speak(sample?.hanzi ?? character)} title={sample ? `${sample.hanzi} · ${sample.meaning}` : character}>{character}</button>; })}{!characterSearch && <button className="character-more" onClick={() => setShowAllCharacters((value) => !value)}>{showAllCharacters ? "−" : `+${recognitionCharacters.length - 80}`}</button>}</div></div></>}
        </section>
      )}

      {appView === "library" && libraryView === "grammar" && (
        <section className="section grammar-section app-view" id="grammar">
          <div className="view-intro"><span className="view-icon">文</span><div><span className="section-kicker">LIBRARY</span><h1>Grammar patterns</h1><p>Browse or practice any target without losing your place in today’s lesson.</p></div></div>
          <div className="library-tabs" role="tablist" aria-label="Library sections"><button onClick={() => openLibrary("words")}>300 Words</button><button onClick={() => openLibrary("characters")}>246 Characters</button><button className="active" onClick={() => openLibrary("grammar")}>70 Grammar</button></div>
          <div className="section-heading grammar-heading"><div><span className="section-kicker">ALL 70 GRAMMAR TARGETS</span><h2>Patterns you can<br /><em>retrieve today.</em></h2></div><p>Every target has a usable frame, syllabus-level example, audio, and a meaning-to-Mandarin recall check.</p></div>
          <label className="library-search"><span>⌕</span><input value={grammarSearch} onChange={(event) => setGrammarSearch(event.target.value)} placeholder="Search pattern, example, pinyin, or meaning" aria-label="Search grammar" /></label>
          <div className="filter-row">{["All", "Core", "Questions", "Time", "Place", "Actions"].map((filter) => <button key={filter} className={grammarFilter === filter ? "active" : ""} onClick={() => { setGrammarFilter(filter); setShowAllGrammar(filter !== "All"); }}>{filter}</button>)}</div>
          {grammarPractice !== null && <div className="grammar-drill"><button className="close-drill" onClick={() => setGrammarPractice(null)} aria-label="Close grammar practice">×</button><span className="micro-label">RECALL CHECK · TARGET {grammarPractice + 1}</span><h3>Which Mandarin sentence means “{grammarPoints[grammarPractice].translation}”?</h3><div>{grammarOptions.map((option) => <button key={option} onClick={() => answerGrammar(option)}>{option}</button>)}</div>{grammarResult && <p className={grammarResult.startsWith("Correct") ? "correct" : ""}>{grammarResult}</p>}</div>}
          <div className="grammar-grid">{visibleGrammar.map((point) => { const globalIndex = grammarPoints.indexOf(point); return <article key={`${point.title}-${globalIndex}`}><div className="grammar-card-top"><span>{String(globalIndex + 1).padStart(2, "0")} · {point.label}</span><button onClick={() => speak(point.example)}>▶</button></div><h3>{point.title}</h3><code>{point.formula}</code><div className="grammar-example"><strong>{point.example}</strong>{progress.showPinyin && <span>{point.pinyin}</span>}<small>{point.translation}</small></div><button className="grammar-practice-button" onClick={() => openGrammarPractice(globalIndex)}>Practice this target →</button></article>; })}</div>
          {grammarFilter === "All" && !grammarSearch && <button className="grammar-more" onClick={() => setShowAllGrammar((value) => !value)}>{showAllGrammar ? "Show the 20 essential targets" : `Show all ${grammarPoints.length} targets`}</button>}
        </section>
      )}

      {appView === "exam" && (
      <section className="section exam-section app-view" id="exam">
        <div className="view-intro"><span className="view-icon">考</span><div><span className="section-kicker">MOCK EXAM</span><h1>Test your foundation</h1><p>This is optional assessment—not today’s required lesson. Take it when you want a full readiness check.</p></div></div>
        {!examStarted ? <><div className="exam-card"><div className="exam-copy"><span className="section-kicker light">HSK 3.0 · LEVEL 1 PRACTICE MOCK</span><h2>Know the test.<br /><em>Train beyond it.</em></h2><p>Run a complete 40-question simulation: 20 listening and 20 reading questions in 40 minutes, followed by scoring and wrong-answer explanations.</p><button className="exam-start" onClick={startMockExam}>Start the 40-minute mock →</button><a href="https://www.chinesetest.cn/syllabus" target="_blank" rel="noreferrer">View official HSK 3.0 resources ↗</a></div><div className="exam-structure"><div><span>01</span><strong>Listening</strong><b>20</b><small>questions · play each prompt</small></div><div><span>02</span><strong>Reading</strong><b>20</b><small>questions · meaning and patterns</small></div><div className="exam-total"><span>TOTAL</span><strong>40 questions</strong><b>40 min</b></div></div></div><p className="rollout-note"><strong>Before you register</strong> HSK 3.0 is the current syllabus, but test availability and administration can vary by center. Confirm the format with your chosen test center.</p></> : <div className="mock-shell">{!examResult ? <><div className="mock-top"><div><span className="micro-label">{examQuestion.section.toUpperCase()} · {examIndex + 1} / 40</span><div className="mock-progress"><i style={{ width: `${((examIndex + 1) / 40) * 100}%` }} /></div></div><strong>{examMinutes}:{examSeconds}</strong></div><div className="mock-question">{examQuestion.section === "Listening" ? <><button className="big-listen-button" onClick={() => speak(examQuestion.prompt)}><span>▶</span> Play question</button><p>Choose the meaning you hear.</p></> : <><strong lang="zh-CN">{examQuestion.prompt}</strong><p>Choose the best meaning.</p></>}<div className="mock-options">{(examOptions[examQuestion.id] ?? examQuestion.options).map((option, index) => <button key={option} className={examAnswers[examQuestion.id] === option ? "selected" : ""} onClick={() => setExamAnswers((current) => ({ ...current, [examQuestion.id]: option }))}><span>{String.fromCharCode(65 + index)}</span>{option}</button>)}</div></div><div className="mock-actions"><button onClick={() => setExamIndex((index) => Math.max(0, index - 1))} disabled={examIndex === 0}>← Previous</button>{examIndex < 39 ? <button onClick={() => setExamIndex((index) => index + 1)}>Next →</button> : <button onClick={finishExam}>Submit mock</button>}</div></> : <div className="mock-results"><span className="result-ring">{examResult.score}%</span><h2>{examResult.correct}/40 correct</h2><p>{examResult.score >= 80 ? "Strong result. Review the misses, then keep training speaking beyond the test." : examResult.score >= 60 ? "Foundation reached. Review every miss before your next attempt." : "Keep building the daily loop, then retry after more scheduled review."}</p><h3>Wrong-answer review</h3><div className="wrong-list">{mockExamQuestions.filter((question) => examAnswers[question.id] !== question.answer).map((question) => <article key={question.id}><span>{question.section} · {question.id.toUpperCase()}</span><strong>{question.prompt}</strong><p>Your answer: {examAnswers[question.id] ?? "No answer"}</p><p>Correct: {question.answer}</p><small>{question.explanation}</small></article>)}</div><button className="primary-button" onClick={startMockExam}>Try a fresh attempt <span>→</span></button></div>}</div>}
      </section>
      )}

      {appView === "progress" && (
        <section className="section progress-section app-view" id="progress">
          <div className="view-intro"><span className="view-icon">我</span><div><span className="section-kicker">PROGRESS</span><h1>Your learning record</h1><p>See momentum, protect your data, and understand where HSK 1 fits in the longer journey.</p></div></div>
          <div className="section-heading progress-heading"><div><span className="section-kicker">YOUR MOMENTUM</span><h2>Small proof,<br /><em>every day.</em></h2></div><div className="progress-tools"><button onClick={exportProgress}>Export backup</button><button onClick={() => importRef.current?.click()}>Import backup</button><button className="danger-link" onClick={resetProgress}>Reset</button><input ref={importRef} type="file" accept="application/json" onChange={(event) => void importProgress(event.target.files?.[0])} hidden /></div></div>
          <div className="stat-grid"><article className="stat-card coral"><span>火</span><strong>{progress.streak}</strong><p>day streak</p><small>Counts practice days, not visits.</small></article><article className="stat-card jade"><span>字</span><strong>{progress.mastered.length}</strong><p>stable words</p><small>Earned after repeated successful reviews.</small></article><article className="stat-card blue"><span>时</span><strong>{progress.minutes}</strong><p>minutes trained</p><small>Uses each task’s real target time.</small></article><article className="stat-card yellow"><span>光</span><strong>{progress.xp}</strong><p>practice XP</p><small>Every reward can be earned only once.</small></article></div>
          <div className="backup-note"><strong>Your progress is protected.</strong><span>It saves automatically on this device. Export a backup before clearing browser data or moving to another device. The app shell also works offline after your first visit.</span></div>
          <div className="level-roadmap"><div><span className="section-kicker">THE LONG GAME</span><h3>HSK 1 is the launchpad—not fluency.</h3><p>Finish this foundation, then keep the same speak-first loop through every level.</p></div><ol>{[1, 2, 3, 4, 5, 6, "7–9"].map((level, index) => <li key={String(level)} className={index === 0 ? "current" : "locked"}><span>{index === 0 ? "NOW" : "LOCKED"}</span><strong>HSK {level}</strong><small>{index === 0 ? "Daily life basics" : index < 3 ? "Everyday independence" : index < 6 ? "Work & study fluency" : "Professional mastery"}</small></li>)}</ol></div>
          <div className="app-about"><div><span className="brand-mark">声</span><div><strong>SHĒNGTÚ</strong><p>Hear it. Say it. Own it.</p></div></div><div><span>SOURCES</span><a href="https://www.chinesetest.cn/syllabus" target="_blank" rel="noreferrer">Official HSK 3.0 ↗</a><a href="https://hsk.cn-bj.ufileos.com/3.0/%E6%96%B0%E7%89%88HSK%E8%80%83%E8%AF%95%E5%A4%A7%E7%BA%B2%EF%BC%88%E8%AF%8D%E6%B1%87%E3%80%81%E6%B1%89%E5%AD%97%E3%80%81%E8%AF%AD%E6%B3%95%EF%BC%89.pdf" target="_blank" rel="noreferrer">2025 syllabus PDF ↗</a></div><small>Independent learning tool. Not affiliated with Chinese Test International.</small></div>
        </section>
      )}
      </div>

      <nav className="mobile-nav" aria-label="App navigation">
        <button className={appView === "today" ? "active" : ""} onClick={() => navigate("today")}><span>今</span>Today</button>
        <button className={appView === "course" ? "active" : ""} onClick={() => navigate("course")}><span>路</span>Course</button>
        <button className={appView === "library" ? "active" : ""} onClick={() => openLibrary(libraryView)}><span>库</span>Library</button>
        <button className={appView === "exam" ? "active" : ""} onClick={() => navigate("exam")}><span>考</span>Mock</button>
        <button className={appView === "progress" ? "active" : ""} onClick={() => navigate("progress")}><span>我</span>Me</button>
      </nav>

      {ready && !progress.onboarded && <div className="onboarding-backdrop" role="dialog" aria-modal="true" aria-labelledby="onboarding-title"><div className="onboarding-card"><span className="brand-mark">声</span><span className="section-kicker">YOUR FIRST TWO MINUTES</span><h2 id="onboarding-title">Set a pace you can repeat.</h2><p>You will not recall all 300 words daily. Shēngtú gives you a small new set plus only the reviews that are due.</p><div className="goal-options">{[5, 8, 10].map((goal) => <button key={goal} className={onboardingGoal === goal ? "active" : ""} onClick={() => setOnboardingGoal(goal)}><strong>{goal}</strong><span>new words/day</span><small>{goal === 5 ? "gentle · ~22 min" : goal === 8 ? "recommended · ~28 min" : "fast · ~35 min"}</small></button>)}</div><ul><li>Keep pinyin on for the first 1–2 weeks, then toggle it off.</li><li>Say every answer before revealing it.</li><li>Finish the five daily steps; stop when the mission checkpoint is done.</li></ul><button className="primary-button" onClick={startCourse}>Start my first lesson <span>→</span></button></div></div>}
      {toast && <div className="toast" role="status">{toast}</div>}
    </main>
  );
}
