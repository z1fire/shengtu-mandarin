"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { APP_VERSION } from "./app-version";
import {
  listeningQuestions,
  mockExamQuestions as hsk1MockExamQuestions,
  pronunciationDrills,
  sentenceChallenges,
  type GrammarPoint,
  type MockQuestion,
} from "./hsk-data";
import {
  getCourseMissions,
  getCumulativeCharacters,
  getCumulativeVocabulary,
  getLibraryGrammar,
  getStudyCharacters,
  getStudyVocabulary,
  levelMeta,
  levelOrder,
  type HskLevel,
  type LevelVocabularyWord,
} from "./level-content";
import {
  buildDailyQueue,
  buildDailyGrammarQueue,
  completeDailyStep,
  dueCorrections,
  earnOnce,
  localDate,
  makeStarterProgress,
  normalizeProgress,
  recordStudyDay,
  recordStudyDayReplay,
  recordSkillAttempt,
  recordWordConfidence,
  queueCorrection,
  resolveCorrection,
  scheduleCadenceReview,
  scheduleReview,
  similarityScore,
  switchProgressLevel,
  skillAccuracy,
  type CorrectionItem,
  type Progress,
  type SkillArea,
  type StudyDay,
} from "./learning-engine";
import {
  buildGrammarMixerFrame,
  initialMixerSelections,
  mixerExpectedTokens,
  updateMixerSelection,
  type MixerSlotPart,
} from "./grammar-mixer";
import {
  buildGradedReading,
  buildMissionConversation,
  buildMissionDictation,
  buildRecallChallenge,
} from "./learning-experience";
import "./mandarin.css";

type PracticeMode = "flashcards" | "grammar" | "listening" | "builder" | "reading" | "speaking";
type AppView = "today" | "course" | "library" | "exam" | "progress";
type LibraryView = "words" | "characters" | "grammar";
type GrammarStage = "learn" | "recall";
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};
type ReplaySession = {
  day: StudyDay;
  vocabularyQueue: number[];
  cardPosition: number;
  grammarQueue: number[];
  grammarPosition: number;
  completedSteps: string[];
};
type AccountProfile = { displayName: string; email: string };
type AccountState =
  | { mode: "checking" }
  | { mode: "signed-in"; user: AccountProfile }
  | { mode: "signed-out" }
  | { mode: "device-only" }
  | { mode: "unavailable" };

const STORAGE_KEY = "shengtu-hsk-progress";
const LEGACY_STORAGE_KEY = "shengtu-hsk1-progress";
const LOCAL_SYNC_TIME_KEY = "shengtu-progress-saved-at";
const today = localDate();

const missionPhaseCopy = [
  { title: "Build the language", detail: "Learn the key words and one grammar pattern." },
  { title: "Connect the pieces", detail: "Understand and produce the mission language." },
  { title: "Perform the mission", detail: "Complete the role-play without reading." },
];

const skillLabels: Record<SkillArea, string> = {
  vocabulary: "Vocabulary",
  grammar: "Grammar",
  listening: "Listening",
  reading: "Reading",
  sentence: "Sentence building",
  speaking: "Speaking",
};

const grammarConcepts: Record<string, string> = {
  "前缀": "prefixes",
  "后缀": "suffixes",
  "类前缀": "prefix-like forms",
  "类后缀": "suffix-like forms",
  "方位名词": "location nouns",
  "能愿动词": "modal verbs",
  "离合词": "separable verbs",
  "疑问代词": "question words",
  "人称代词": "personal pronouns",
  "指示代词": "demonstratives",
  "数词": "numbers",
  "名量词": "noun classifiers",
  "动量词": "action measure words",
  "程度副词": "degree adverbs",
  "范围副词": "scope adverbs",
  "时间副词": "time adverbs",
  "频率副词": "frequency adverbs",
  "否定副词": "negation",
  "结构助词": "structural particles",
  "动态助词": "aspect particles",
  "语气助词": "sentence particles",
  "主语": "subjects",
  "谓语": "predicates",
  "宾语": "objects",
  "定语": "attributive modifiers",
  "状语": "adverbial modifiers",
  "结果补语": "result complements",
  "趋向补语": "directional complements",
  "状态补语": "state complements",
  "程度补语": "degree complements",
  "数量补语": "quantity complements",
  "疑问句": "question forms",
  "祈使句": "commands",
  "比较句": "comparisons",
  "并列复句": "parallel clauses",
  "转折复句": "contrast clauses",
  "因果复句": "cause-and-effect clauses",
  "条件复句": "conditional clauses",
  "选择复句": "choice clauses",
  "让步复句": "concessive clauses",
  "目的复句": "purpose clauses",
  "固定格式": "a fixed construction",
};

function grammarAnswer(point: GrammarPoint) {
  return point.example || point.formula;
}

function grammarChoicePool(points: GrammarPoint[], targetIndex: number) {
  const target = points[targetIndex];
  const answer = grammarAnswer(target);
  const otherPoints = points.filter((_, index) => index !== targetIndex);
  const sameKind = otherPoints.filter((point) => Boolean(point.example) === Boolean(target.example));
  const candidates = [...sameKind, ...otherPoints].map(grammarAnswer).filter((option) => option !== answer);
  return [answer, ...new Set(candidates)].slice(0, 3);
}

function grammarConcept(point: GrammarPoint) {
  const exact = grammarConcepts[point.title];
  if (exact) return exact;
  const match = Object.entries(grammarConcepts).find(([title]) => point.title.startsWith(title));
  return match?.[1] ?? "this official structure";
}

function promptLengthClass(text: string) {
  if (text.length > 85) return "very-long";
  if (text.length > 46) return "long";
  return "";
}

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

type MixerTile = { id: string; text: string };

function mixerTiles(tokens: string[]): MixerTile[] {
  return tokens.map((text, index) => ({ id: `${index}-${text}`, text }));
}

function scrambleMixerTiles(tiles: MixerTile[]) {
  const scrambled = shuffle(tiles);
  if (scrambled.length > 1 && scrambled.every((tile, index) => tile.id === tiles[index].id)) {
    return [...scrambled.slice(1), scrambled[0]];
  }
  return scrambled;
}

function GrammarPatternMixer({ point, fallbackFormula, words }: { point: GrammarPoint; fallbackFormula: string; words: LevelVocabularyWord[] }) {
  const frame = useMemo(() => buildGrammarMixerFrame(point, fallbackFormula, words), [fallbackFormula, point, words]);
  const defaults = initialMixerSelections(frame);
  const initialExpected = mixerTiles(mixerExpectedTokens(frame, defaults));
  const [selections, setSelections] = useState<Record<string, number>>(defaults);
  const [activeExpected, setActiveExpected] = useState<MixerTile[]>(initialExpected);
  const [bank, setBank] = useState<MixerTile[]>(() => scrambleMixerTiles(initialExpected));
  const [built, setBuilt] = useState<MixerTile[]>([]);
  const [result, setResult] = useState("");
  const [needsMix, setNeedsMix] = useState(false);
  const [logicNote, setLogicNote] = useState("Linked choices adjust together so the finished sentence always describes a plausible situation.");
  const slots = frame.parts.filter((part): part is MixerSlotPart => part.type === "slot")
    .filter((part, index, items) => items.findIndex((item) => item.id === part.id) === index);
  const sentence = activeExpected.map((tile) => tile.text).join("");

  function selectWord(slot: MixerSlotPart, optionIndex: number) {
    const update = updateMixerSelection(frame, selections, slot.id, optionIndex);
    setSelections(update.selections);
    setLogicNote(update.note);
    setNeedsMix(true);
    setResult("Selection changed · related words were checked for meaning. Mix the new sentence before rebuilding.");
  }

  function mixSelectedWords() {
    const expected = mixerTiles(mixerExpectedTokens(frame, selections));
    setActiveExpected(expected);
    setBank(scrambleMixerTiles(expected));
    setBuilt([]);
    setNeedsMix(false);
    setResult("");
  }

  function addMixerTile(tileIndex: number) {
    if (needsMix || result.startsWith("Correct")) return;
    const tile = bank[tileIndex];
    if (!tile) return;
    setBuilt((placed) => [...placed, tile]);
    setBank((current) => current.filter((_, index) => index !== tileIndex));
    setResult("");
  }

  function removeMixerTile(tileIndex: number) {
    if (result.startsWith("Correct")) return;
    const tile = built[tileIndex];
    if (!tile) return;
    setBank((available) => [...available, tile]);
    setBuilt((current) => current.filter((_, index) => index !== tileIndex));
    setResult("");
  }

  function resetMixerOrder() {
    setBank(scrambleMixerTiles(activeExpected));
    setBuilt([]);
    setResult("");
  }

  function checkMixerOrder() {
    const correct = built.length === activeExpected.length && built.every((tile, index) => tile.text === activeExpected[index].text);
    setResult(correct ? "Correct pattern · your vocabulary fits the required word order." : "Not yet · compare your order with the formula and move the tiles again.");
  }

  return <div className="grammar-pattern-mixer">
    <div className="mixer-heading"><span>MIX &amp; MATCH PATTERN LAB</span><strong>Build with vocabulary that makes sense</strong><p>{frame.usesMissionPattern ? "This target is a form inventory, so the lab uses today’s compositional mission pattern. Change any word and the linked choices adjust to keep the meaning natural." : "Choose vocabulary for each replaceable slot. Change any word and linked choices—such as a verb and its object, or a measure word and its noun—adjust to keep the meaning natural."}</p></div>
    <code>{frame.sourceFormula}</code>
    <div className="mixer-selectors">{slots.map((slot) => <label key={slot.id}><span>{slot.label}</span><select value={selections[slot.id] ?? 0} onChange={(event) => selectWord(slot, Number(event.target.value))} aria-label={`Choose vocabulary for ${slot.label}`}>{slot.options.map((word, index) => <option key={`${word.level}-${word.sequence}-${word.hanzi}`} value={index}>{word.hanzi} · {word.pinyin} · {word.meaning}</option>)}</select></label>)}</div>
    <div className="mixer-logic-note" role="status"><span>✓</span>{logicNote}</div>
    <button className="mixer-mix-button" onClick={mixSelectedWords}>{needsMix ? "Mix my new choices →" : "Reshuffle this sentence ↻"}</button>
    <div className="mixer-sentence-line" aria-label="Your grammar sentence">{built.length ? built.map((tile, index) => <button key={tile.id} onClick={() => removeMixerTile(index)}>{tile.text}</button>) : <span>Tap the scrambled pieces below to build the sentence.</span>}</div>
    <div className="mixer-tile-bank">{bank.map((tile, index) => <button key={tile.id} onClick={() => addMixerTile(index)} disabled={needsMix}>{tile.text}</button>)}</div>
    <div className="mixer-actions"><button onClick={resetMixerOrder} disabled={needsMix}>Reset order</button><button className="check-button" onClick={checkMixerOrder} disabled={needsMix || bank.length > 0}>Check pattern</button></div>
    {result && <div className={`mixer-result ${result.startsWith("Correct") ? "correct" : ""}`}><span>{result}</span>{result.startsWith("Correct") && <button onClick={() => speak(sentence, 0.72)}>▶ Hear my sentence</button>}</div>}
  </div>;
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

function isHskLevel(value: unknown): value is HskLevel {
  return levelOrder.includes(value as HskLevel);
}

function makeVocabularyCheckpoint(vocabulary: LevelVocabularyWord[], level: HskLevel): MockQuestion[] {
  return Array.from({ length: 40 }, (_, index) => {
    const wordIndex = Math.min(vocabulary.length - 1, Math.floor(((index + 0.5) / 40) * vocabulary.length));
    const word = vocabulary[wordIndex];
    const alternatives = [
      vocabulary[(wordIndex + Math.max(1, Math.floor(vocabulary.length / 3))) % vocabulary.length]?.meaning,
      vocabulary[(wordIndex + Math.max(2, Math.floor(vocabulary.length * 2 / 3))) % vocabulary.length]?.meaning,
    ].filter((meaning): meaning is string => Boolean(meaning && meaning !== word.meaning));
    const options = [...new Set([word.meaning, ...alternatives])];
    for (let offset = 1; options.length < 3 && offset < vocabulary.length; offset += 1) {
      const meaning = vocabulary[(wordIndex + offset) % vocabulary.length].meaning;
      if (!options.includes(meaning)) options.push(meaning);
    }
    return {
      id: `${level.replace("-", "")}-${String(index + 1).padStart(2, "0")}`,
      section: index < 20 ? "Listening" : "Reading",
      prompt: word.hanzi,
      answer: word.meaning,
      options,
      explanation: `${word.hanzi} (${word.pinyin}) means ${word.meaning}. Official syllabus entry ${word.sequence}.`,
    };
  });
}

export default function MandarinApp() {
  const [progress, setProgress] = useState<Progress>(() => makeStarterProgress(today));
  const [ready, setReady] = useState(false);
  const [showLevelPicker, setShowLevelPicker] = useState(false);
  const [libraryCumulative, setLibraryCumulative] = useState(true);
  const selectedLevel = progress.selectedLevel;
  const meta = levelMeta[selectedLevel];
  const vocabulary = useMemo(() => getStudyVocabulary(selectedLevel), [selectedLevel]);
  const cumulativeVocabulary = useMemo(() => getCumulativeVocabulary(selectedLevel), [selectedLevel]);
  const libraryVocabulary = libraryCumulative ? cumulativeVocabulary : vocabulary;
  const missions = useMemo(() => getCourseMissions(selectedLevel), [selectedLevel]);
  const levelGrammar = useMemo(() => getLibraryGrammar(selectedLevel, false), [selectedLevel]);
  const grammarPoints = useMemo(() => getLibraryGrammar(selectedLevel, libraryCumulative), [selectedLevel, libraryCumulative]);
  const recognitionCharacters = useMemo(
    () => libraryCumulative ? getCumulativeCharacters(selectedLevel) : getStudyCharacters(selectedLevel),
    [selectedLevel, libraryCumulative],
  );
  const mockExamQuestions = useMemo(
    () => selectedLevel === "1" ? hsk1MockExamQuestions : makeVocabularyCheckpoint(vocabulary, selectedLevel),
    [selectedLevel, vocabulary],
  );
  const [onboardingGoal, setOnboardingGoal] = useState(8);
  const [appView, setAppView] = useState<AppView>("today");
  const [todayScreen, setTodayScreen] = useState<"plan" | "lesson">("plan");
  const [replaySession, setReplaySession] = useState<ReplaySession | null>(null);
  const [currentRecallReplayPosition, setCurrentRecallReplayPosition] = useState<number | null>(null);
  const [showStudyHistory, setShowStudyHistory] = useState(false);
  const [libraryView, setLibraryView] = useState<LibraryView>("words");
  const [practice, setPractice] = useState<PracticeMode>("flashcards");
  const [cardRevealed, setCardRevealed] = useState(false);
  const [recallVerified, setRecallVerified] = useState(false);
  const [recallTesting, setRecallTesting] = useState(false);
  const [recallResult, setRecallResult] = useState("");
  const [pinyinPeeked, setPinyinPeeked] = useState(false);
  const [search, setSearch] = useState("");
  const [characterSearch, setCharacterSearch] = useState("");
  const [grammarSearch, setGrammarSearch] = useState("");
  const [showAllWords, setShowAllWords] = useState(false);
  const [showAllCharacters, setShowAllCharacters] = useState(false);
  const [grammarFilter, setGrammarFilter] = useState("All");
  const [showAllGrammar, setShowAllGrammar] = useState(false);
  const [grammarPractice, setGrammarPractice] = useState<number | null>(null);
  const [grammarPracticeStage, setGrammarPracticeStage] = useState<GrammarStage>("learn");
  const [grammarOptions, setGrammarOptions] = useState<string[]>([]);
  const [grammarResult, setGrammarResult] = useState("");
  const [dailyGrammarStage, setDailyGrammarStage] = useState<GrammarStage>("learn");
  const [dailyGrammarResult, setDailyGrammarResult] = useState("");
  const [dailyGrammarAnswered, setDailyGrammarAnswered] = useState(false);
  const [missionListenResult, setMissionListenResult] = useState("");
  const [missionDictationResult, setMissionDictationResult] = useState("");
  const [readingResult, setReadingResult] = useState("");
  const [listenOrder] = useState(() => shuffle(listeningQuestions.map((_, index) => index)));
  const [listenPosition, setListenPosition] = useState(0);
  const activeListening = listeningQuestions[listenOrder[listenPosition] ?? 0];
  const [listenOptions, setListenOptions] = useState(() => shuffle(listeningQuestions[listenOrder[0] ?? 0].options));
  const [listenResult, setListenResult] = useState<string | null>(null);
  const [buildIndex, setBuildIndex] = useState(0);
  const [wordBank, setWordBank] = useState(() => shuffle(sentenceChallenges[0].tokens));
  const [built, setBuilt] = useState<string[]>([]);
  const [buildResult, setBuildResult] = useState<string | null>(null);
  const [missionWordBank, setMissionWordBank] = useState(() => shuffle(getCourseMissions("1")[0].tokens));
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
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstallHelp, setShowInstallHelp] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const [account, setAccount] = useState<AccountState>({ mode: "checking" });
  const [syncStatus, setSyncStatus] = useState<"checking" | "saving" | "synced" | "local" | "error">("checking");
  const [syncReady, setSyncReady] = useState(false);
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [correctionResult, setCorrectionResult] = useState("");
  const importRef = useRef<HTMLInputElement>(null);
  const wasReplaying = useRef(false);
  const replayCompletionKey = useRef("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      let localProgress = normalizeProgress(null, getStudyVocabulary("1").length, getLibraryGrammar("1", false).length, today);
      try {
        const stored = window.localStorage.getItem(STORAGE_KEY) ?? window.localStorage.getItem(LEGACY_STORAGE_KEY);
        const parsed = stored ? JSON.parse(stored) : null;
        const storedLevel = isHskLevel(parsed?.selectedLevel) ? parsed.selectedLevel : "1";
        localProgress = normalizeProgress(parsed, getStudyVocabulary(storedLevel).length, getLibraryGrammar(storedLevel, false).length, today);
      } catch {
        localProgress = normalizeProgress(null, getStudyVocabulary("1").length, getLibraryGrammar("1", false).length, today);
      }
      setProgress(localProgress);
      setOnboardingGoal(localProgress.dailyNew);
      const route = appRouteFromHash(window.location.hash);
      setAppView(route.view);
      if (route.library) setLibraryView(route.library);
      if (route.lesson) setTodayScreen("lesson");
      setReady(true);

      const localSavedAt = Number(window.localStorage.getItem(LOCAL_SYNC_TIME_KEY)) || 0;
      void (async () => {
        const isSitesApp = window.location.hostname.endsWith(".chatgpt.site");
        try {
          const response = await fetch("/api/progress", { cache: "no-store", headers: { accept: "application/json" } });
          const contentType = response.headers.get("content-type") ?? "";
          if (!contentType.includes("application/json")) {
            setSyncStatus("local");
            setAccount({ mode: isSitesApp ? "unavailable" : "device-only" });
            return;
          }
          const remote = await response.json() as { available?: boolean; user?: AccountProfile; progress?: unknown; updatedAt?: number };
          if (response.status === 401 || !remote.available) {
            setSyncStatus("local");
            setAccount({ mode: isSitesApp ? "signed-out" : "device-only" });
            return;
          }
          if (!response.ok || !remote.user?.email) {
            setSyncStatus("local");
            setAccount({ mode: isSitesApp ? "unavailable" : "device-only" });
            return;
          }
          setAccount({ mode: "signed-in", user: remote.user });
          setSyncEnabled(true);
          if (remote.progress && Number(remote.updatedAt) > localSavedAt) {
            const remoteLevel = isHskLevel((remote.progress as { selectedLevel?: unknown }).selectedLevel)
              ? (remote.progress as { selectedLevel: HskLevel }).selectedLevel
              : "1";
            const normalized = normalizeProgress(remote.progress, getStudyVocabulary(remoteLevel).length, getLibraryGrammar(remoteLevel, false).length, today);
            setProgress(normalized);
            setOnboardingGoal(normalized.dailyNew);
          }
          setSyncStatus("synced");
        } catch {
          setSyncStatus("local");
          setAccount({ mode: window.location.hostname.endsWith(".chatgpt.site") ? "unavailable" : "device-only" });
        } finally {
          setSyncReady(true);
        }
      })();
    }, 0);
    if ("serviceWorker" in navigator) navigator.serviceWorker.register(new URL("./sw.js", window.location.href).pathname).catch(() => undefined);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const standaloneNavigator = navigator as Navigator & { standalone?: boolean };
    const displayModeTimer = window.setTimeout(() => {
      setIsInstalled(window.matchMedia("(display-mode: standalone)").matches || standaloneNavigator.standalone === true);
    }, 0);

    const captureInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };
    const confirmInstall = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
      setShowInstallHelp(false);
      setToast("Shēngtú is installed and ready from your home screen");
    };

    window.addEventListener("beforeinstallprompt", captureInstallPrompt);
    window.addEventListener("appinstalled", confirmInstall);
    return () => {
      window.clearTimeout(displayModeTimer);
      window.removeEventListener("beforeinstallprompt", captureInstallPrompt);
      window.removeEventListener("appinstalled", confirmInstall);
    };
  }, []);

  useEffect(() => {
    const handleHistory = () => {
      const route = appRouteFromHash(window.location.hash);
      setAppView(route.view);
      setTodayScreen(route.lesson ? "lesson" : "plan");
      if (!route.lesson) setReplaySession(null);
      if (route.library) setLibraryView(route.library);
      window.scrollTo({ top: 0 });
    };
    window.addEventListener("popstate", handleHistory);
    return () => window.removeEventListener("popstate", handleHistory);
  }, []);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(recordStudyDay(progress, today)));
  }, [progress, ready]);

  useEffect(() => {
    if (!ready || !syncReady || !syncEnabled) return;
    const timer = window.setTimeout(() => {
      setSyncStatus("saving");
      void fetch("/api/progress", {
        method: "PUT",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({ progress: recordStudyDay(progress, today) }),
      }).then(async (response) => {
        if (!response.ok) throw new Error("Sync unavailable");
        const result = await response.json() as { updatedAt?: number };
        window.localStorage.setItem(LOCAL_SYNC_TIME_KEY, String(result.updatedAt ?? Date.now()));
        setSyncStatus("synced");
      }).catch(() => setSyncStatus("error"));
    }, 700);
    return () => window.clearTimeout(timer);
  }, [progress, ready, syncEnabled, syncReady]);

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
      let next = { ...current, examHistory: [...current.examHistory, attempt].slice(-20) };
      for (const question of mockExamQuestions) {
        const right = examAnswers[question.id] === question.answer;
        const skill: SkillArea = question.section === "Listening" ? "listening" : "reading";
        next = recordSkillAttempt(next, skill, right, today);
        if (!right) next = queueCorrection(next, {
          id: `exam:${selectedLevel}:${question.id}`,
          level: selectedLevel,
          skill,
          prompt: question.prompt,
          answer: question.answer,
          options: question.options,
          explanation: question.explanation,
          dueDate: today,
        });
      }
      return earnOnce(next, `${today}:mock-complete`, 50, today);
    });
    setToast(`Mock complete · ${score}%`);
  }, [examAnswers, mockExamQuestions, selectedLevel]);

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
    if (!query) return libraryVocabulary;
    return libraryVocabulary.filter((word) => `${word.hanzi} ${word.pinyin} ${word.meaning} ${word.example} ${word.collocation} ${word.sequence} HSK ${word.level}`.toLowerCase().includes(query));
  }, [libraryVocabulary, search]);

  const filteredGrammar = grammarPoints.filter((point) => {
    const matchesFilter = grammarFilter === "All" || point.group === grammarFilter;
    const query = grammarSearch.trim().toLowerCase();
    return matchesFilter && (!query || `${point.title} ${point.formula} ${point.example} ${point.pinyin} ${point.translation} ${point.label}`.toLowerCase().includes(query));
  });
  const filteredCharacters = recognitionCharacters.filter((character) => {
    const query = characterSearch.trim().toLowerCase();
    if (!query) return true;
    const samples = libraryVocabulary.filter((word) => word.hanzi.includes(character));
    return `${character} ${samples.map((word) => `${word.hanzi} ${word.pinyin} ${word.meaning}`).join(" ")}`.toLowerCase().includes(query);
  });
  const visibleGrammar = showAllGrammar || grammarFilter !== "All" || grammarSearch ? filteredGrammar : filteredGrammar.slice(0, 20);
  const visibleWords = (showAllWords || search ? filteredWords : filteredWords.slice(0, 24)).slice(0, 200);
  const repeatingCurrentRecall = !replaySession && currentRecallReplayPosition !== null;
  const recallIsExtraPractice = Boolean(replaySession) || repeatingCurrentRecall;
  const sessionDaily = replaySession?.completedSteps ?? progress.daily;
  const sessionVocabularyQueue = replaySession?.vocabularyQueue ?? progress.dailyQueue;
  const sessionCardPosition = replaySession?.cardPosition ?? currentRecallReplayPosition ?? progress.cardPosition;
  const sessionGrammarQueue = replaySession?.grammarQueue ?? progress.grammarQueue;
  const sessionGrammarPosition = replaySession?.grammarPosition ?? progress.grammarPosition;
  const dayPercent = Math.round((sessionDaily.length / 6) * 100);
  const coursePercent = Math.round((progress.mastered.length / vocabulary.length) * 100);
  const wordsIntroduced = Object.keys(progress.reviews).length;
  const grammarIntroduced = Object.keys(progress.grammarReviews).length;
  const wordCoveragePercent = Math.round((wordsIntroduced / vocabulary.length) * 100);
  const grammarCoveragePercent = Math.round((grammarIntroduced / levelGrammar.length) * 100);
  const activeWordIndex = sessionVocabularyQueue[sessionCardPosition];
  const activeWord = activeWordIndex === undefined ? null : vocabulary[activeWordIndex];
  const activeReview = activeWordIndex === undefined ? undefined : progress.reviews[activeWordIndex];
  const recallChallenge = useMemo(
    () => activeWordIndex === undefined ? null : buildRecallChallenge(activeWordIndex, vocabulary, activeReview?.repetitions ?? 0),
    [activeReview?.repetitions, activeWordIndex, vocabulary],
  );
  const activePinyinConfidence = activeWordIndex === undefined ? 0 : progress.pinyinConfidence[`${selectedLevel}:${activeWordIndex}`] ?? 0;
  const showActivePinyin = progress.showPinyin && (activePinyinConfidence < 3 || pinyinPeeked);
  const testingRecall = Boolean(activeReview) || recallTesting;
  const nextCadenceDays = Math.max(1, (activeReview?.intervalDays ?? 0) + 1);
  const queuePercent = sessionVocabularyQueue.length ? Math.round((sessionCardPosition / sessionVocabularyQueue.length) * 100) : 100;
  const activeSentence = sentenceChallenges[buildIndex];
  const activePronunciation = pronunciationDrills[pronunciationIndex];
  const completedMissionToday = progress.daily.includes("speak");
  const missionSequenceIndex = Math.max(0, progress.missionSessionCount - (completedMissionToday ? 1 : 0));
  const missionCycle = Math.floor(missionSequenceIndex / 36);
  const missionCyclePosition = missionSequenceIndex % 36;
  const activeMissionIndex = replaySession?.day.missionIndex ?? Math.min(missions.length - 1, Math.floor(missionCyclePosition / 3));
  const missionPhase = replaySession?.day.missionPhase ?? missionCyclePosition % 3;
  const activeMission = missions[activeMissionIndex];
  const missionBuilder = { tokens: activeMission.tokens, answer: activeMission.tokens.join("") };
  const dailyGrammarIndex = sessionGrammarQueue[sessionGrammarPosition] ?? 0;
  const dailyGrammar = levelGrammar[dailyGrammarIndex] ?? levelGrammar[0];
  const dailyGrammarAnswer = grammarAnswer(dailyGrammar);
  const dailyGrammarReview = progress.grammarReviews[dailyGrammarIndex];
  const dailyGrammarOptions = useMemo(() => shuffle(grammarChoicePool(levelGrammar, dailyGrammarIndex)), [dailyGrammarIndex, levelGrammar]);
  const missionListenOptions = useMemo(() => shuffle([
    activeMission.translation,
    missions[(activeMissionIndex + 4) % missions.length].translation,
    missions[(activeMissionIndex + 7) % missions.length].translation,
  ]), [activeMission, activeMissionIndex, missions]);
  const missionDictation = useMemo(() => buildMissionDictation(missions, activeMissionIndex), [activeMissionIndex, missions]);
  const gradedReading = useMemo(() => buildGradedReading(missions, activeMissionIndex, missionPhase), [activeMissionIndex, missionPhase, missions]);
  const missionConversation = useMemo(() => buildMissionConversation(activeMission, missionPhase), [activeMission, missionPhase]);
  const activeCorrections = dueCorrections(progress, selectedLevel, today);
  const activeCorrection = activeCorrections[0];
  const skillScores = (Object.keys(skillLabels) as SkillArea[]).map((skill) => ({
    skill,
    accuracy: skillAccuracy(progress, skill),
    attempts: progress.skillStats[skill]?.attempts ?? 0,
  }));
  const weakestSkill = [...skillScores].filter((item) => item.attempts > 0).sort((a, b) => a.accuracy - b.accuracy)[0];
  const missionReady = ["review", "grammar", "listen", "build", "reading"].every((step) => sessionDaily.includes(step));
  const completedMissionSession = sessionDaily.includes("speak");
  const studyDays = (progress.studyHistory[selectedLevel] ?? [])
    .filter((day) => day.date < today && (day.vocabularyQueue.length > 0 || day.grammarQueue.length > 0 || day.completedSteps.length > 0))
    .sort((a, b) => b.date.localeCompare(a.date));
  const examQuestion = mockExamQuestions[examIndex];
  const examMinutes = String(Math.floor(examRemaining / 60)).padStart(2, "0");
  const examSeconds = String(examRemaining % 60).padStart(2, "0");

  useEffect(() => {
    if (!ready) return;
    const timer = window.setTimeout(() => {
      setMissionWordBank(shuffle(activeMission.tokens));
      setMissionBuilt([]);
      setMissionBuildResult("");
      setMissionListenResult("");
      setMissionDictationResult("");
      setReadingResult("");
      setDailyGrammarStage("learn");
      setDailyGrammarResult("");
      setDailyGrammarAnswered(false);
      setMissionSpeechText("Listen once, shadow twice, then perform the mission line without reading.");
      setMissionSpeechScore(null);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [activeMission, activeMissionIndex, missionPhase, ready]);

  useEffect(() => {
    if (!ready) return;
    const timer = window.setTimeout(() => {
      setCardRevealed(false);
      setRecallVerified(false);
      setRecallTesting(false);
      setRecallResult("");
      setPinyinPeeked(false);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [activeWordIndex, ready]);

  useEffect(() => {
    if (!ready) return;
    if (wasReplaying.current && !replaySession) {
      window.setTimeout(() => {
        setCardRevealed(false);
        setDailyGrammarStage("learn");
        setDailyGrammarResult("");
        setDailyGrammarAnswered(false);
        setMissionListenResult("");
        setMissionWordBank(shuffle(activeMission.tokens));
        setMissionBuilt([]);
        setMissionBuildResult("");
        setMissionSpeechText("Listen once, shadow twice, then perform the mission line without reading.");
        setMissionSpeechScore(null);
      }, 0);
      wasReplaying.current = false;
      return;
    }
    wasReplaying.current = Boolean(replaySession);
  }, [activeMission, ready, replaySession]);

  const dailySteps = [
    { id: "review", mode: "flashcards" as const, time: 5, title: "Retrieval warm-up", detail: sessionVocabularyQueue.length ? `${sessionVocabularyQueue.length} scheduled words` : "Queue complete", accent: "coral" },
    { id: "grammar", mode: "grammar" as const, time: 5, title: "Grammar coverage", detail: sessionDaily.includes("grammar") ? `${replaySession ? "This day’s" : "Today’s"} targets complete` : `${Math.max(0, sessionGrammarQueue.length - sessionGrammarPosition)} target${sessionGrammarQueue.length - sessionGrammarPosition === 1 ? "" : "s"} · ${dailyGrammar.title}`, accent: "yellow" },
    { id: "listen", mode: "listening" as const, time: 7, title: "Listening ladder", detail: `Meaning + dictation: ${activeMission.title}`, accent: "blue" },
    { id: "build", mode: "builder" as const, time: 6, title: "Build the mission", detail: activeMission.phrase, accent: "coral" },
    { id: "reading", mode: "reading" as const, time: 5, title: "Read in context", detail: gradedReading.title, accent: "yellow" },
    { id: "speak", mode: "speaking" as const, time: 8, title: "Mission checkpoint", detail: missionReady ? "Ready for the role-play" : "Complete the earlier steps first", accent: "jade" },
  ];
  const practiceOrder: PracticeMode[] = ["flashcards", "grammar", "listening", "builder", "reading", "speaking"];
  const practiceLabels: Record<PracticeMode, string> = { flashcards: "Recall", grammar: "Grammar", listening: "Listening", builder: "Sentence lab", reading: "Reading", speaking: "Mission speaking" };
  const nextRecommended = dailySteps.find((step) => !sessionDaily.includes(step.id))?.mode ?? "flashcards";
  const nextPractice = practiceOrder[(practiceOrder.indexOf(practice) + 1) % practiceOrder.length];

  function studyDayLabel(date: string) {
    return new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
  }

  function completeReplayStep(step: string) {
    setReplaySession((current) => current && !current.completedSteps.includes(step)
      ? { ...current, completedSteps: [...current.completedSteps, step] }
      : current);
  }

  function registerObjectiveAttempt(skill: SkillArea, correct: boolean, correction?: Omit<CorrectionItem, "correctStreak" | "misses">, wordIndex?: number) {
    setProgress((current) => {
      let next = recordSkillAttempt(current, skill, correct, today);
      if (wordIndex !== undefined) next = recordWordConfidence(next, selectedLevel, wordIndex, correct);
      if (!correct && correction) next = queueCorrection(next, correction);
      return next;
    });
  }

  function answerRecallChallenge(option: string) {
    if (!recallChallenge || activeWordIndex === undefined || !activeWord || recallVerified) return;
    const correct = option === recallChallenge.answer;
    setRecallResult(correct ? "Correct · retrieval verified." : "Not yet · use the clue, then choose again.");
    if (correct) {
      setRecallVerified(true);
      setCardRevealed(true);
    }
    registerObjectiveAttempt("vocabulary", correct, {
      id: `vocabulary:${selectedLevel}:${activeWordIndex}`,
      level: selectedLevel,
      skill: "vocabulary",
      prompt: recallChallenge.prompt,
      answer: recallChallenge.answer,
      options: recallChallenge.options,
      explanation: `${activeWord.hanzi} (${activeWord.pinyin}) means ${activeWord.meaning}.`,
      dueDate: today,
    }, activeWordIndex);
  }

  function answerCorrection(option: string) {
    if (!activeCorrection) return;
    const correct = option === activeCorrection.answer;
    setCorrectionResult(correct
      ? activeCorrection.correctStreak >= 1 ? "Correct again · this miss is now cleared." : "Correct · this miss will return once tomorrow."
      : "Not yet · review the explanation and retry.");
    setProgress((current) => {
      let next = recordSkillAttempt(current, activeCorrection.skill, correct, today);
      const vocabularyCorrection = activeCorrection.id.match(/^vocabulary:([^:]+):(\d+)$/);
      if (vocabularyCorrection && vocabularyCorrection[1] === selectedLevel) {
        next = recordWordConfidence(next, selectedLevel, Number(vocabularyCorrection[2]), correct);
      }
      if (correct) return resolveCorrection(next, activeCorrection.id, today);
      return queueCorrection(next, {
        id: activeCorrection.id,
        level: activeCorrection.level,
        skill: activeCorrection.skill,
        prompt: activeCorrection.prompt,
        answer: activeCorrection.answer,
        options: activeCorrection.options,
        explanation: activeCorrection.explanation,
        dueDate: today,
      });
    });
    if (correct) {
      window.setTimeout(() => {
        setCorrectionResult("");
      }, 700);
    }
  }

  function startStudyDayReplay(day: StudyDay) {
    const vocabularyQueue = day.vocabularyQueue.filter((index) => index >= 0 && index < vocabulary.length);
    const grammarQueue = day.grammarQueue.filter((index) => index >= 0 && index < levelGrammar.length);
    const startingMode: PracticeMode = vocabularyQueue.length ? "flashcards" : grammarQueue.length ? "grammar" : "listening";
    const completedSteps = [
      ...(vocabularyQueue.length ? [] : ["review"]),
      ...(grammarQueue.length ? [] : ["grammar"]),
    ];
    replayCompletionKey.current = "";
    setCurrentRecallReplayPosition(null);
    setReplaySession({ day, vocabularyQueue, cardPosition: 0, grammarQueue, grammarPosition: 0, completedSteps });
    setShowStudyHistory(false);
    setCardRevealed(false);
    setDailyGrammarStage("learn");
    setDailyGrammarResult("");
    setDailyGrammarAnswered(false);
    setMissionListenResult("");
    setMissionWordBank(shuffle(missions[Math.min(missions.length - 1, day.missionIndex)].tokens));
    setMissionBuilt([]);
    setMissionBuildResult("");
    setMissionSpeechText("Listen once, shadow twice, then perform the mission line without reading.");
    setMissionSpeechScore(null);
    if (window.location.hash !== "#today/lesson") window.history.pushState(null, "", "#today/lesson");
    setAppView("today");
    setTodayScreen("lesson");
    setPractice(startingMode);
    window.scrollTo({ top: 0, behavior: "smooth" });
    setToast(`Repeating ${studyDayLabel(day.date)} · progress for today is protected`);
  }

  function chooseLevel(level: HskLevel) {
    if (level === selectedLevel) {
      setShowLevelPicker(false);
      return;
    }
    setProgress((current) => switchProgressLevel(current, level, getStudyVocabulary(level).length, getLibraryGrammar(level, false).length, today));
    setReplaySession(null);
    setCurrentRecallReplayPosition(null);
    setShowLevelPicker(false);
    setLibraryCumulative(true);
    setSearch("");
    setCharacterSearch("");
    setGrammarSearch("");
    setGrammarPractice(null);
    setGrammarPracticeStage("learn");
    setDailyGrammarStage("learn");
    setExamStarted(false);
    setExamResult(null);
    setAppView("today");
    setTodayScreen("plan");
    if (window.location.hash !== "#today") window.history.pushState(null, "", "#today");
    window.scrollTo({ top: 0 });
    setToast(`Switched to ${levelMeta[level].label} · your other level progress is saved`);
  }

  function navigate(view: AppView) {
    const hash = view === "today" ? "#today" : `#${view}`;
    if (window.location.hash !== hash) window.history.pushState(null, "", hash);
    setAppView(view);
    if (view === "today") {
      setReplaySession(null);
      setTodayScreen("plan");
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openLibrary(view: LibraryView) {
    const hash = `#library/${view}`;
    if (window.location.hash !== hash) window.history.pushState(null, "", hash);
    setAppView("library");
    setLibraryView(view);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goToPractice(mode: PracticeMode, preserveReplay = false) {
    if (window.location.hash !== "#today/lesson") window.history.pushState(null, "", "#today/lesson");
    if (!preserveReplay) setReplaySession(null);
    setAppView("today");
    setTodayScreen("lesson");
    setPractice(mode);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function startCourse() {
    setProgress((current) => {
      const configured = { ...current, onboarded: true, dailyNew: onboardingGoal };
      return recordStudyDay({
        ...configured,
        dailyQueue: buildDailyQueue(configured, vocabulary.length),
        dailyQueueDate: today,
        cardPosition: 0,
        grammarQueue: buildDailyGrammarQueue(configured, levelGrammar.length),
        grammarQueueDate: today,
        grammarPosition: 0,
      }, today);
    });
    setToast(`Daily goal set to ${onboardingGoal} new words`);
    goToPractice("flashcards");
  }

  function reviewTodaysRecallAgain() {
    if (!progress.dailyQueue.length) return;
    setReplaySession(null);
    setCurrentRecallReplayPosition(0);
    setCardRevealed(false);
    setPractice("flashcards");
    setToast("Extra recall started · return dates and rewards stay unchanged");
  }

  function advanceVocabularyCard() {
    if (activeWordIndex === undefined || !recallVerified) return;
    if (replaySession) {
      setReplaySession((current) => {
        if (!current) return current;
        const cardPosition = current.cardPosition + 1;
        const completedSteps = cardPosition >= current.vocabularyQueue.length && !current.completedSteps.includes("review")
          ? [...current.completedSteps, "review"]
          : current.completedSteps;
        return { ...current, cardPosition, completedSteps };
      });
      setCardRevealed(false);
      setToast("Replay practice logged · automatic schedule unchanged");
      return;
    }
    if (currentRecallReplayPosition !== null) {
      setCurrentRecallReplayPosition((position) => position === null ? null : position + 1);
      setCardRevealed(false);
      setToast("Extra recall logged · automatic schedule unchanged");
      return;
    }
    setProgress((current) => {
      const scheduled = scheduleCadenceReview(current.reviews[activeWordIndex]);
      let next: Progress = {
        ...current,
        reviews: { ...current.reviews, [activeWordIndex]: scheduled },
        cardPosition: current.cardPosition + 1,
        mastered: scheduled.repetitions >= 3
          ? current.mastered.includes(activeWordIndex) ? current.mastered : [...current.mastered, activeWordIndex]
          : current.mastered.filter((index) => index !== activeWordIndex),
      };
      next = earnOnce(next, `${today}:review:${activeWordIndex}`, 5, today);
      if (next.cardPosition >= next.dailyQueue.length) next = completeDailyStep(next, "review", 5, today);
      return next;
    });
    setCardRevealed(false);
    setToast(`Cadence advanced · returns in ${nextCadenceDays} day${nextCadenceDays === 1 ? "" : "s"}`);
  }

  function answerListening(answer: string) {
    const correct = answer === activeListening.answer;
    setListenResult(correct ? `Correct — ${activeListening.prompt}` : "Not yet. Replay and listen for the key words.");
    registerObjectiveAttempt("listening", correct, {
      id: `listening-bank:${selectedLevel}:${activeListening.id}`,
      level: selectedLevel,
      skill: "listening",
      prompt: "Listen again and choose the meaning.",
      answer: activeListening.answer,
      options: activeListening.options,
      explanation: `${activeListening.prompt} means ${activeListening.answer}`,
      dueDate: today,
    });
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
    registerObjectiveAttempt("sentence", correct, {
      id: `sentence-bank:${selectedLevel}:${activeSentence.id}`,
      level: selectedLevel,
      skill: "sentence",
      prompt: activeSentence.translation,
      answer: activeSentence.answer,
      options: [activeSentence.answer, [...activeSentence.tokens].reverse().join(""), activeSentence.tokens.slice(1).concat(activeSentence.tokens[0]).join("")],
      explanation: `Natural Mandarin order: ${activeSentence.answer}`,
      dueDate: today,
    });
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
      return recordSkillAttempt(next, "speaking", true, today);
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
      else setProgress((current) => recordSkillAttempt(current, "speaking", false, today));
    };
    recognition.onerror = () => setSpeechText("I couldn’t hear that clearly. Move closer and try once more.");
    recognition.onend = () => setIsListening(false);
    setSpeechText(`Listening… say: ${activePronunciation.hanzi}`);
    setSpeechScore(null);
    setIsListening(true);
    recognition.start();
  }

  function beginDailyGrammarRecall() {
    setDailyGrammarStage("recall");
    setDailyGrammarResult("");
    setDailyGrammarAnswered(false);
  }

  function reopenDailyGrammarLesson() {
    setDailyGrammarStage("learn");
    setDailyGrammarResult("");
    setDailyGrammarAnswered(false);
  }

  function beginLibraryGrammarRecall() {
    setGrammarPracticeStage("recall");
    setGrammarResult("");
  }

  function reopenLibraryGrammarLesson() {
    setGrammarPracticeStage("learn");
    setGrammarResult("");
  }

  function openGrammarPractice(index: number) {
    setGrammarPractice(index);
    setGrammarPracticeStage("learn");
    setGrammarOptions(shuffle(grammarChoicePool(grammarPoints, index)));
    setGrammarResult("");
    window.setTimeout(() => document.querySelector(".grammar-drill")?.scrollIntoView({ behavior: "smooth", block: "center" }), 0);
  }

  function answerGrammar(option: string) {
    if (grammarPractice === null || grammarPracticeStage !== "recall" || grammarResult.startsWith("Correct")) return;
    const point = grammarPoints[grammarPractice];
    const correct = option === grammarAnswer(point);
    const activeIndex = levelGrammar.findIndex((target) => target.title === point.title && target.formula === point.formula);
    setGrammarResult(correct ? `Correct — ${point.formula}` : "Not quite. Compare the word order and try another choice, or reopen the lesson for help.");
    registerObjectiveAttempt("grammar", correct, {
      id: `grammar:${selectedLevel}:${activeIndex >= 0 ? activeIndex : `library-${grammarPractice}`}`,
      level: selectedLevel,
      skill: "grammar",
      prompt: point.example ? point.translation : point.title,
      answer: grammarAnswer(point),
      options: grammarOptions,
      explanation: `${point.title}: ${point.formula}`,
      dueDate: today,
    });
    if (!correct) return;
    setProgress((current) => {
      let next = current;
      if (activeIndex >= 0) {
        const scheduled = scheduleReview(current.grammarReviews[activeIndex], "good");
        next = {
          ...next,
          grammarReviews: { ...next.grammarReviews, [activeIndex]: scheduled },
          grammarMastered: scheduled.repetitions >= 3
            ? next.grammarMastered.includes(activeIndex) ? next.grammarMastered : [...next.grammarMastered, activeIndex]
            : next.grammarMastered,
        };
      }
      return earnOnce(next, `${today}:grammar-library:${selectedLevel}:${grammarPractice}`, 6, today);
    });
    setToast("Grammar recalled · +6 XP");
  }

  function answerDailyGrammar(option: string) {
    if (dailyGrammarStage !== "recall" || dailyGrammarAnswered) return;
    const correct = option === dailyGrammarAnswer;
    setDailyGrammarResult(correct ? `Correct — ${dailyGrammar.formula}` : "Not quite. Compare the word order and try another choice, or reopen the lesson for help.");
    registerObjectiveAttempt("grammar", correct, {
      id: `grammar:${selectedLevel}:${dailyGrammarIndex}`,
      level: selectedLevel,
      skill: "grammar",
      prompt: dailyGrammar.example ? dailyGrammar.translation : dailyGrammar.title,
      answer: dailyGrammarAnswer,
      options: dailyGrammarOptions,
      explanation: `${dailyGrammar.title}: ${dailyGrammar.formula}`,
      dueDate: today,
    });
    if (!correct) return;
    setDailyGrammarAnswered(true);
    setProgress((current) => {
      const targetIndex = replaySession
        ? replaySession.grammarQueue[replaySession.grammarPosition]
        : current.grammarQueue[current.grammarPosition];
      if (targetIndex === undefined) return current;
      if (replaySession) {
        const scheduled = scheduleReview(current.grammarReviews[targetIndex], "good");
        return {
          ...current,
          grammarReviews: { ...current.grammarReviews, [targetIndex]: scheduled },
          grammarMastered: scheduled.repetitions >= 3
            ? current.grammarMastered.includes(targetIndex) ? current.grammarMastered : [...current.grammarMastered, targetIndex]
            : current.grammarMastered,
        };
      }
      const rewardKey = `${today}:daily-grammar:${targetIndex}`;
      if (current.earned.includes(rewardKey)) return current;
      const scheduled = scheduleReview(current.grammarReviews[targetIndex], "good");
      const next: Progress = {
        ...current,
        grammarReviews: { ...current.grammarReviews, [targetIndex]: scheduled },
        grammarMastered: scheduled.repetitions >= 3
          ? current.grammarMastered.includes(targetIndex) ? current.grammarMastered : [...current.grammarMastered, targetIndex]
          : current.grammarMastered,
      };
      return earnOnce(next, rewardKey, 8, today);
    });
    setToast(replaySession ? "Grammar review strengthened" : "Grammar target recalled · +8 XP");
  }

  function advanceDailyGrammar() {
    if (replaySession) {
      const finishing = replaySession.grammarPosition + 1 >= replaySession.grammarQueue.length;
      setReplaySession((current) => {
        if (!current) return current;
        const grammarPosition = Math.min(current.grammarPosition + 1, current.grammarQueue.length);
        const completedSteps = grammarPosition >= current.grammarQueue.length && !current.completedSteps.includes("grammar")
          ? [...current.completedSteps, "grammar"]
          : current.completedSteps;
        return { ...current, grammarPosition, completedSteps };
      });
      setDailyGrammarStage("learn");
      setDailyGrammarResult("");
      setDailyGrammarAnswered(false);
      if (finishing) {
        setToast("This day’s grammar replay is complete");
        setPractice("listening");
      }
      return;
    }
    const finishing = progress.grammarPosition + 1 >= progress.grammarQueue.length;
    setProgress((current) => {
      const grammarPosition = Math.min(current.grammarPosition + 1, current.grammarQueue.length);
      const next = { ...current, grammarPosition };
      return grammarPosition >= current.grammarQueue.length ? completeDailyStep(next, "grammar", 5, today) : next;
    });
    setDailyGrammarStage("learn");
    setDailyGrammarResult("");
    setDailyGrammarAnswered(false);
    if (finishing) {
      setToast("Today’s grammar coverage is complete");
      setPractice("listening");
    }
  }

  function continueAfterRecall() {
    if (replaySession) {
      completeReplayStep("review");
      goToPractice("grammar", true);
      return;
    }
    if (currentRecallReplayPosition !== null) {
      setCurrentRecallReplayPosition(null);
      goToPractice("grammar");
      return;
    }
    setProgress((current) => completeDailyStep(current, "review", 0, today));
    goToPractice("grammar");
  }

  function answerMissionListening(option: string) {
    const correct = option === activeMission.translation;
    setMissionListenResult(correct ? `Correct — ${activeMission.phrase}` : "Not yet. Replay the phrase and listen for the mission words.");
    registerObjectiveAttempt("listening", correct, {
      id: `mission-listening:${selectedLevel}:${activeMissionIndex}:${missionPhase}`,
      level: selectedLevel,
      skill: "listening",
      prompt: "Listen to the mission line and choose its meaning.",
      answer: activeMission.translation,
      options: missionListenOptions,
      explanation: `${activeMission.phrase} means ${activeMission.translation}`,
      dueDate: today,
    });
    if (!correct) return;
    setToast("Meaning caught · now complete the dictation step");
  }

  function answerMissionDictation(option: string) {
    const correct = option === missionDictation.answer;
    setMissionDictationResult(correct ? "Correct · you caught the missing Mandarin." : "Not yet · replay the line and listen around the blank.");
    registerObjectiveAttempt("listening", correct, {
      id: `mission-dictation:${selectedLevel}:${activeMissionIndex}:${missionPhase}`,
      level: selectedLevel,
      skill: "listening",
      prompt: missionDictation.masked,
      answer: missionDictation.answer,
      options: missionDictation.options,
      explanation: `The complete line is ${activeMission.phrase}`,
      dueDate: today,
    });
    if (!correct) return;
    if (replaySession) {
      completeReplayStep("listen");
      setToast("Mission listening replay complete");
      return;
    }
    setProgress((current) => {
      let next = earnOnce(current, `${today}:mission-listen:${activeMissionIndex}:${missionPhase}`, 8, today);
      next = completeDailyStep(next, "listen", 7, today);
      return next;
    });
    setToast("Listening ladder complete · +8 XP");
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
    registerObjectiveAttempt("sentence", correct, {
      id: `mission-builder:${selectedLevel}:${activeMissionIndex}:${missionPhase}`,
      level: selectedLevel,
      skill: "sentence",
      prompt: activeMission.translation,
      answer: missionBuilder.answer,
      options: [missionBuilder.answer, [...activeMission.tokens].reverse().join(""), activeMission.tokens.slice(1).concat(activeMission.tokens[0]).join("")],
      explanation: `Natural Mandarin order: ${activeMission.phrase}`,
      dueDate: today,
    });
    if (!correct) return;
    if (replaySession) {
      completeReplayStep("build");
      setToast("Mission line rebuilt");
      return;
    }
    setProgress((current) => {
      let next = earnOnce(current, `${today}:mission-build:${activeMissionIndex}:${missionPhase}`, 10, today);
      next = completeDailyStep(next, "build", 6, today);
      return next;
    });
    setToast("Mission line built · +10 XP");
  }

  function answerReading(option: string) {
    const correct = option === gradedReading.answer;
    setReadingResult(correct ? "Correct · you understood the exchange in context." : "Not yet · reread speaker A and use the surrounding reply.");
    registerObjectiveAttempt("reading", correct, {
      id: `reading:${selectedLevel}:${activeMissionIndex}:${missionPhase}`,
      level: selectedLevel,
      skill: "reading",
      prompt: gradedReading.lines.map((line) => line.hanzi).join(" "),
      answer: gradedReading.answer,
      options: gradedReading.options,
      explanation: `${gradedReading.lines[0].hanzi} means ${gradedReading.answer}`,
      dueDate: today,
    });
    if (!correct) return;
    if (replaySession) {
      completeReplayStep("reading");
      setToast("Reading replay complete");
      return;
    }
    setProgress((current) => {
      let next = earnOnce(current, `${today}:reading:${activeMissionIndex}:${missionPhase}`, 10, today);
      next = completeDailyStep(next, "reading", 5, today);
      return next;
    });
    setToast("Reading understood · +10 XP");
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
      setProgress((current) => recordSkillAttempt(current, "speaking", score >= 65, today));
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
    if (replaySession) {
      if (completedMissionSession) return;
      const completionKey = `${selectedLevel}:${replaySession.day.date}`;
      if (replayCompletionKey.current === completionKey) return;
      replayCompletionKey.current = completionKey;
      completeReplayStep("speak");
      setProgress((current) => recordStudyDayReplay(current, selectedLevel, replaySession.day.date));
      setToast(`${studyDayLabel(replaySession.day.date)} complete again · today’s course position is unchanged`);
      return;
    }
    const missionStepKey = `${activeMissionIndex}:${missionPhase}`;
    const practiceKey = `${missionCycle}:${missionStepKey}`;
    setProgress((current) => {
      const firstRoute = current.missionSessionCount < 36;
      const missionSteps = firstRoute && !current.missionSteps.includes(missionStepKey) ? [...current.missionSteps, missionStepKey] : current.missionSteps;
      let next = { ...current, missionSteps, missionSessionCount: current.missionSessionCount + 1 };
      next = earnOnce(next, `${today}:mission-checkpoint:${practiceKey}`, 20, today);
      next = completeDailyStep(next, "speak", 8, today);
      if (firstRoute && missionPhase === 2) {
        next = { ...next, missions: next.missions.includes(activeMissionIndex) ? next.missions : [...next.missions, activeMissionIndex] };
        next = earnOnce(next, `mission:${activeMissionIndex}`, 25, today);
      }
      return next;
    });
    setToast(missionPhase === 2 ? "Mission complete · course advanced" : `Mission day ${missionPhase + 1} complete`);
  }

  function studyWord(index: number) {
    setCurrentRecallReplayPosition(null);
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
    const blob = new Blob([JSON.stringify(recordStudyDay(progress, today), null, 2)], { type: "application/json" });
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
      const importedLevel = isHskLevel(parsed?.selectedLevel) ? parsed.selectedLevel : "1";
      const imported = normalizeProgress(parsed, getStudyVocabulary(importedLevel).length, getLibraryGrammar(importedLevel, false).length, today);
      setProgress(imported);
      setOnboardingGoal(imported.dailyNew);
      setToast("Progress restored");
    } catch {
      setToast("That backup file could not be read");
    }
  }

  function resetProgress() {
    if (!window.confirm("Reset all Shēngtú progress on this device? Export a backup first if you may want it later.")) return;
    const starter = normalizeProgress(null, vocabulary.length, levelGrammar.length, today);
    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);
    setProgress(starter);
    setOnboardingGoal(starter.dailyNew);
    setToast("Progress reset");
  }

  async function installApp() {
    if (isInstalled) {
      setToast("Shēngtú is already installed");
      return;
    }
    if (!installPrompt) {
      setShowInstallHelp(true);
      return;
    }
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    setInstallPrompt(null);
    if (choice.outcome === "accepted") setToast("Finishing the Android installation…");
    else setShowInstallHelp(true);
  }

  return (
    <main className="site-shell">
      <header className="topbar">
        <button className="brand" onClick={() => navigate("today")} aria-label={`Open today · app version ${APP_VERSION}`}><span className="brand-mark">声</span><span><strong>SHĒNGTÚ <span className="app-version" title={`App version ${APP_VERSION}`}>v{APP_VERSION}</span></strong><small>MANDARIN, IN MOTION</small></span></button>
        <nav className="nav-links" aria-label="Primary navigation">
          <button className={appView === "today" ? "active" : ""} onClick={() => navigate("today")}>Today</button>
          <button className={appView === "course" ? "active" : ""} onClick={() => navigate("course")}>Course</button>
          <button className={appView === "library" ? "active" : ""} onClick={() => openLibrary("words")}>Library</button>
          <button className={appView === "exam" ? "active" : ""} onClick={() => navigate("exam")}>Mock exam</button>
          <button className={appView === "progress" ? "active" : ""} onClick={() => navigate("progress")}>Progress</button>
        </nav>
        <div className="header-actions"><button className="level-switch" onClick={() => setShowLevelPicker(true)}><span>{meta.label}</span><small>Change level</small></button><span className="streak-pill"><span>火</span> {progress.streak} day streak</span><button className={`sync-pill ${syncStatus}`} onClick={() => setShowAccount(true)} aria-label={`Open account · ${account.mode === "signed-in" ? "signed in and synced" : account.mode === "checking" ? "checking status" : account.mode === "signed-out" ? "signed out" : "device-only progress"}`}>{account.mode === "signed-in" ? "● Account" : account.mode === "checking" ? "☁ Account" : account.mode === "signed-out" ? "↪ Sign in" : "▣ Device"}</button><button className="round-button" onClick={() => setProgress((current) => ({ ...current, showPinyin: !current.showPinyin }))} title="Toggle pinyin">{progress.showPinyin ? "PĪN" : "汉"}</button></div>
      </header>

      <div className="app-content">
      {appView === "today" && todayScreen === "plan" && <>
      <section className="hero" id="top">
        <div className="hero-copy">
          <div className="eyebrow"><span>HSK 3.0</span> {meta.label.toUpperCase()} · CURRENT 2026 SYLLABUS</div>
          <h1>Stop studying Mandarin.<br /><em>Start using it.</em></h1>
          <p className="hero-lede">A guided, speaking-first {meta.label} course that schedules the right words each day—never the whole level at once.</p>
          <div className="hero-actions"><button className="primary-button" onClick={() => goToPractice(nextRecommended)}>Continue: {practiceLabels[nextRecommended]} <span>→</span></button><button className="history-button" onClick={() => setShowStudyHistory(true)}><span>↶</span> Study history</button>{!isInstalled && <button className="install-app-button" onClick={() => void installApp()}><span>↓</span> Install app</button>}<button className="text-button" onClick={() => navigate("course")}><span className="play-dot">▶</span> See the mission path</button></div>
          <div className="hero-proof"><div><strong>{meta.newWords.toLocaleString()}</strong><span>new words</span></div><div><strong>{meta.newCharacters.toLocaleString()}</strong><span>new characters</span></div><div><strong>{meta.grammarTargets}</strong><span>grammar targets</span></div><div><strong>{meta.cumulativeWords.toLocaleString()}</strong><span>cumulative words</span></div></div>
        </div>

        <aside className="today-card" aria-label="Today’s lesson plan">
          <div className="today-card-head"><div><span className="micro-label">{missionCycle ? `FLUENCY LOOP ${missionCycle + 1}` : `MISSION ${String(activeMissionIndex + 1).padStart(2, "0")}`} · DAY {missionPhase + 1} / 3</span><h2>{activeMission.title}</h2><button className="today-history-link" onClick={() => setShowStudyHistory(true)}>↶ Previous study days</button></div><div className="progress-orb" style={{ "--progress": `${dayPercent * 3.6}deg` } as React.CSSProperties}><span>{dayPercent}%</span></div></div>
          <div className="mission-day-note"><strong>{missionPhaseCopy[missionPhase].title}</strong><span>{missionPhaseCopy[missionPhase].detail}</span></div>
          <div className="coverage-pulse" aria-label="Syllabus coverage"><span><b>{wordsIntroduced.toLocaleString()}</b> / {vocabulary.length.toLocaleString()} words taught</span><span><b>{grammarIntroduced}</b> / {levelGrammar.length} grammar taught</span></div>
          <button className="phrase-card" onClick={() => speak(activeMission.phrase)} aria-label="Play today’s phrase"><span className="sound-button">▶</span><span><strong>{activeMission.phrase}</strong>{progress.showPinyin && <small>{activeMission.pinyin}</small>}<em>{activeMission.translation}</em></span></button>
          <div className="task-list">
            {dailySteps.map((step) => { const done = progress.daily.includes(step.id); return <button key={step.id} className={`task-row ${done ? "done" : ""}`} onClick={() => goToPractice(step.mode)}><span className={`task-time ${step.accent}`}>{done ? "✓" : String(step.time).padStart(2, "0")}</span><span><strong>{step.title}</strong><small>{step.detail}</small></span><span className="task-arrow">{done ? "DONE" : "START →"}</span></button>; })}
          </div>
          <div className="today-foot"><span>35 focused minutes</span>{activeCorrections.length > 0 && <button className="correction-due" onClick={() => goToPractice("speaking")}>{activeCorrections.length} correction{activeCorrections.length === 1 ? "" : "s"} due</button>}<span>{progress.daily.length}/6 complete</span></div>
        </aside>
      </section>

      <section className="method-strip" aria-label="Learning method"><span className="strip-title">THE FAST-FLUENCY LOOP</span><div><b>01</b><span>Notice<small>meaning first</small></span></div><span className="strip-arrow">→</span><div><b>02</b><span>Hear<small>Mandarin model</small></span></div><span className="strip-arrow">→</span><div><b>03</b><span>Say<small>out loud</small></span></div><span className="strip-arrow">→</span><div><b>04</b><span>Recall<small>on schedule</small></span></div></section>
      </>}

      {appView === "today" && todayScreen === "lesson" && (
      <section className="section practice-section" id="practice">
        <div className="lesson-toolbar"><button onClick={() => navigate("today")}>{replaySession ? "← End replay" : "← Today’s plan"}</button><span>{replaySession ? studyDayLabel(replaySession.day.date) : `Mission ${activeMissionIndex + 1} · day ${missionPhase + 1}/3`} · step {practiceOrder.indexOf(practice) + 1} of 5</span></div>
        {replaySession && <div className="replay-banner"><span>↶</span><div><strong>Repeating {studyDayLabel(replaySession.day.date)}</strong><small>The same words, grammar, reading, and mission are loaded. Today’s six steps and course position stay untouched.</small></div><button onClick={() => navigate("today")}>Return to today</button></div>}
        <div className="section-heading two-column-heading"><div><span className="section-kicker">{replaySession ? "STUDY-DAY REPLAY" : "TODAY’S GUIDED LESSON"}</span><h2>{practiceLabels[practice]}</h2></div><p>{replaySession ? "Complete all six steps again. Vocabulary cadence stays fixed; objective answers still update your accuracy." : "Focus on one step. Your plan updates automatically when you hit today’s target."}</p></div>
        <div className="practice-tabs" role="tablist" aria-label={replaySession ? "Replay lesson steps" : "Today’s lesson steps"}>{([ ["flashcards", "01", "Recall"], ["grammar", "02", "Grammar"], ["listening", "03", "Listen"], ["builder", "04", "Build"], ["reading", "05", "Read"], ["speaking", "06", "Mission"] ] as [PracticeMode, string, string][]).map(([mode, number, label]) => { const step = dailySteps.find((item) => item.mode === mode); const done = step ? sessionDaily.includes(step.id) : false; return <button key={mode} className={`${practice === mode ? "active" : ""} ${done ? "complete" : ""}`} onClick={() => setPractice(mode)} role="tab" aria-selected={practice === mode}><span>{done ? "✓" : number}</span>{label}</button>; })}</div>

        <div className="practice-stage">
          {practice === "flashcards" && (
            <div className="flashcard-lab">
              <div className="lab-instructions"><span className="micro-label">{recallIsExtraPractice ? "EXTRA RECALL PRACTICE" : "AUTOMATIC RECALL CADENCE"} · {Math.min(sessionCardPosition + 1, sessionVocabularyQueue.length)} / {sessionVocabularyQueue.length}</span><h3>Say it before you flip it.</h3><p>{replaySession ? `This is extra practice from ${studyDayLabel(replaySession.day.date)}. It does not move the card’s automatic return date.` : repeatingCurrentRecall ? "You are repeating today’s completed recall queue. Practice as often as you like—return dates, XP, and completion stay unchanged." : `Today mixes ${progress.dailyNew} new words with every card due on its fixed cadence. Reveal each answer and continue—the app handles the timing.`}</p><div className="cadence-preview"><span>THIS CARD’S NEXT STEP</span><strong>{recallIsExtraPractice ? "Schedule unchanged" : `${nextCadenceDays} day${nextCadenceDays === 1 ? "" : "s"}`}</strong><small>{recallIsExtraPractice ? "Extra practice only" : nextCadenceDays === 1 ? "Tomorrow" : `After ${nextCadenceDays} calendar days`}</small></div><div className="lab-progress"><span style={{ width: `${queuePercent}%` }} /></div></div>
              {activeWord && recallChallenge ? <>
                <div className={`study-card ${cardRevealed ? "revealed" : ""} ${recallVerified ? "verified" : ""}`}>
                  <button className="card-face-button" onClick={() => !testingRecall && setCardRevealed(true)} disabled={testingRecall || recallVerified} aria-label={testingRecall ? "Vocabulary recall prompt" : "Reveal vocabulary card"}>
                    {testingRecall && !recallVerified ? <>
                      <span className="card-caption">VERIFIED RECALL · {recallChallenge.mode.toUpperCase()}</span>
                      <strong className={`${recallChallenge.mode === "meaning" ? "hanzi-prompt" : "english-prompt"} ${promptLengthClass(recallChallenge.prompt)}`}>{recallChallenge.prompt}</strong>
                      <span className="flip-hint">{recallChallenge.instruction}</span>
                    </> : !cardRevealed ? <>
                      <span className="card-caption">NEW WORD · SAY IN MANDARIN</span>
                      <strong className={`english-prompt ${promptLengthClass(activeWord.meaning)}`}>{activeWord.meaning}</strong>
                      <span className="flip-hint">Tap to learn ↗</span>
                    </> : <>
                      <span className="card-caption">{recallVerified ? "RETRIEVAL VERIFIED" : "LISTEN & SHADOW"}</span>
                      <strong className={`hanzi-prompt ${activeWord.hanzi.length > 6 ? "very-long" : activeWord.hanzi.length > 3 ? "long" : ""}`}>{activeWord.hanzi}</strong>
                      {showActivePinyin && <span className={`pinyin-prompt ${promptLengthClass(activeWord.pinyin)}`}>{activeWord.pinyin}</span>}
                      {activeWord.example && <span className="card-example">
                        <small>EXAMPLE SENTENCE</small>
                        <strong lang="zh-CN">{activeWord.example}</strong>
                        {showActivePinyin && <span>{activeWord.examplePinyin}</span>}
                        <em>{activeWord.exampleTranslation}</em>
                      </span>}
                    </>}
                  </button>
                  {(cardRevealed || recallChallenge.mode === "audio") && <div className="card-audio-actions">
                    <button className="audio-link" onClick={() => speak(activeWord.hanzi)} aria-label={`Play pronunciation for ${activeWord.hanzi}`}>▶ Word</button>
                    {activeWord.example && cardRevealed && <button className="audio-link" onClick={() => speak(activeWord.example)} aria-label={`Play example sentence ${activeWord.example}`}>▶ Example</button>}
                    {cardRevealed && progress.showPinyin && activePinyinConfidence >= 3 && !pinyinPeeked && <button className="audio-link" onClick={() => setPinyinPeeked(true)}>Show pinyin</button>}
                  </div>}
                </div>
                {!testingRecall && cardRevealed && !recallVerified && <button className="recall-test-start" onClick={() => { setRecallTesting(true); setCardRevealed(false); }}>Hide the answer &amp; verify recall →</button>}
                {testingRecall && !recallVerified && <div className="recall-verification"><span>ANSWER WITHOUT SELF-RATING</span><div>{recallChallenge.options.map((option, index) => <button key={option} onClick={() => answerRecallChallenge(option)}><b>{String.fromCharCode(65 + index)}</b>{option}</button>)}</div>{recallResult && <p>{recallResult}</p>}</div>}
                <div className="cadence-action"><span><b>{recallIsExtraPractice ? "EXTRA REP" : `STEP ${nextCadenceDays}`}</b><small>{recallIsExtraPractice ? "The scheduled cadence stays exactly where it is." : `Objective answer required · returns in ${nextCadenceDays} day${nextCadenceDays === 1 ? "" : "s"}.`}</small></span><button onClick={advanceVocabularyCard} disabled={!recallVerified}>{recallVerified ? "Continue →" : "Verify recall first"}</button></div>
              </> : <div className="queue-complete"><span>好</span><h3>{replaySession ? "This day’s recall is complete." : repeatingCurrentRecall ? "Extra review complete." : "Today’s recall is complete."}</h3><p>{replaySession ? "You reviewed the same vocabulary again without changing its scheduled cadence." : repeatingCurrentRecall ? "You repeated every card without changing its return date, XP, or today’s completion. You can run the queue again whenever you want." : "Every card was objectively checked and now has its next automatic calendar date. Any miss is waiting in the correction loop."}</p><div className="queue-complete-actions">{!replaySession && <button className="repeat-recall-button" onClick={reviewTodaysRecallAgain}>↻ Review today’s cards again</button>}<button className="primary-button" onClick={continueAfterRecall}>Continue to grammar <span>→</span></button></div></div>}
            </div>
          )}

          {practice === "grammar" && <div className="grammar-lesson">
            <div className="lab-instructions"><span className="micro-label">FULL-SYLLABUS GRAMMAR · {dailyGrammarReview ? "REVIEW TARGET" : "NEW TARGET"} · {dailyGrammarIndex + 1} / {levelGrammar.length}</span><h3>{dailyGrammar.title}</h3><p>First understand how the pattern works. Then hide the lesson and retrieve it from memory—the answer is never visible during the question.</p><div className="coverage-mini"><span style={{ width: `${grammarCoveragePercent}%` }} /></div><small>{grammarIntroduced} taught · {progress.grammarMastered.length} stable · {Math.max(0, levelGrammar.length - grammarIntroduced)} still to introduce</small><button className="slow-link" onClick={() => openLibrary("grammar")}>Browse all {meta.grammarTargets} official grammar targets →</button></div>
            <div className={`grammar-teach-card grammar-stage-${dailyGrammarStage} ${dailyGrammar.example ? "" : "formula-recall"}`}>
              <div className="grammar-stage-track" aria-label="Grammar lesson stages"><span className={dailyGrammarStage === "learn" ? "active" : "complete"}><b>1</b> Learn</span><i>→</i><span className={dailyGrammarStage === "recall" ? "active" : ""}><b>2</b> Recall</span></div>
              {dailyGrammarStage === "learn" ? <>
                <span>{dailyGrammar.label} · {grammarConcept(dailyGrammar)}</span>
                <h4 className="grammar-stage-title">Understand the pattern</h4>
                <code>{dailyGrammar.formula}</code>
                <div className="grammar-notice"><strong>What to notice</strong><p>This target teaches {grammarConcept(dailyGrammar)}. Read the structure from left to right: keep the fixed Chinese markers in place and substitute your own words into the descriptive slots.</p></div>
                {dailyGrammar.example ? <button className="grammar-model" onClick={() => speak(dailyGrammar.example)}><span>▶</span><strong>{dailyGrammar.example}</strong>{progress.showPinyin && <small>{dailyGrammar.pinyin}</small>}<em>{dailyGrammar.translation}</em></button> : <div className="formula-explainer"><strong>Pattern-only target</strong><p>Say the fixed Chinese pieces aloud. Then cover this card and identify the complete structure from similar alternatives.</p></div>}
                <GrammarPatternMixer key={`daily-${selectedLevel}-${dailyGrammarIndex}-${activeMissionIndex}`} point={dailyGrammar} fallbackFormula={activeMission.grammarFormula} words={cumulativeVocabulary} />
                <div className="grammar-study-steps"><span><b>1</b> Read the pattern</span><span><b>2</b> {dailyGrammar.example ? "Listen and shadow" : "Say the fixed pieces"}</span><span><b>3</b> Recall without looking</span></div>
                <button className="grammar-recall-start" onClick={beginDailyGrammarRecall}>Hide the lesson &amp; start recall →</button>
              </> : <>
                <span>RECALL · LESSON HIDDEN</span>
                <h4>{dailyGrammar.example ? `Which Mandarin sentence expresses “${dailyGrammar.translation}”?` : `Which official structure matches “${dailyGrammar.title}”?`}</h4>
                <p className="grammar-recall-cue">Choose from memory. The pattern and model stay hidden until you answer correctly.</p>
                <div className="grammar-choices">{dailyGrammarOptions.map((option, index) => <button key={option} onClick={() => answerDailyGrammar(option)} disabled={dailyGrammarAnswered}><span>{String.fromCharCode(65 + index)}</span>{option}</button>)}</div>
                {!dailyGrammarResult && <button className="grammar-help-button" onClick={reopenDailyGrammarLesson}>Need help? Reopen the lesson</button>}
                {dailyGrammarResult && <div className="grammar-feedback">
                  <div className={`result-note ${dailyGrammarResult.startsWith("Correct") ? "correct" : ""}`}><span>{dailyGrammarResult}</span>{!dailyGrammarAnswered && <button onClick={reopenDailyGrammarLesson}>Reopen lesson</button>}</div>
                  {dailyGrammarAnswered && <div className="grammar-answer-review"><strong>Why this works</strong><code>{dailyGrammar.formula}</code>{dailyGrammar.example && <button className="grammar-model" onClick={() => speak(dailyGrammar.example)}><span>▶</span><strong>{dailyGrammar.example}</strong>{progress.showPinyin && <small>{dailyGrammar.pinyin}</small>}<em>{dailyGrammar.translation}</em></button>}<p>This answer uses {grammarConcept(dailyGrammar)} with the fixed pieces in their required order.</p><button className="grammar-next-target" onClick={advanceDailyGrammar}>{sessionGrammarPosition + 1 >= sessionGrammarQueue.length ? "Continue to listening →" : "Next grammar target →"}</button></div>}
                </div>}
              </>}
            </div>
          </div>}

          {practice === "listening" && <div className="required-practice-wrap">
            <div className="listening-lab mission-listening"><div className="lab-instructions"><span className="micro-label">LISTENING LADDER · STEP 1 / 2</span><h3>Understand it before you read it.</h3><p>Play the real-life mission line and choose its meaning. Characters stay hidden until you catch the message.</p><button className="big-listen-button" onClick={() => speak(activeMission.phrase)}><span>▶</span> Play mission line</button><button className="slow-link" onClick={() => speak(activeMission.phrase, 0.62)}>Play slower</button></div><div className="answer-stack">{missionListenOptions.map((option, index) => <button key={option} onClick={() => answerMissionListening(option)} disabled={missionListenResult.startsWith("Correct")}><span>{String.fromCharCode(65 + index)}</span>{option}</button>)}{missionListenResult && <div className={`result-note ${missionListenResult.startsWith("Correct") ? "correct" : ""}`}>{missionListenResult}</div>}</div></div>
            {missionListenResult.startsWith("Correct") && <div className="dictation-lab"><div><span className="micro-label">LISTENING LADDER · STEP 2 / 2</span><h3>Catch the missing Mandarin.</h3><p>Replay the full line, then select the piece hidden from the transcript.</p><button className="big-listen-button" onClick={() => speak(activeMission.phrase)}><span>▶</span> Replay without reading</button></div><div><strong lang="zh-CN">{missionDictation.masked}</strong><div className="dictation-options">{missionDictation.options.map((option) => <button key={option} onClick={() => answerMissionDictation(option)} disabled={missionDictationResult.startsWith("Correct")}>{option}</button>)}</div>{missionDictationResult && <div className={`result-note ${missionDictationResult.startsWith("Correct") ? "correct" : ""}`}>{missionDictationResult}</div>}</div></div>}
            <details className="extra-practice"><summary>Extra listening reps <span>20-question practice bank</span></summary><div className="listening-lab"><div className="lab-instructions"><span className="micro-label">OPTIONAL LISTENING · {listenPosition + 1} / {listeningQuestions.length}</span><h3>Keep training your ear.</h3><p>This practice bank awards extra XP without changing today’s required mission.</p><button className="big-listen-button" onClick={() => speak(activeListening.prompt)}><span>▶</span> Play Mandarin</button><button className="slow-link" onClick={() => speak(activeListening.prompt, 0.62)}>Play slower</button></div><div className="answer-stack">{listenOptions.map((option, index) => <button key={option} onClick={() => answerListening(option)} disabled={listenResult?.startsWith("Correct")}><span>{String.fromCharCode(65 + index)}</span>{option}</button>)}{listenResult && <div className={`result-note ${listenResult.startsWith("Correct") ? "correct" : ""}`}>{listenResult}<button onClick={nextListening}>Next →</button></div>}</div></div></details>
          </div>}

          {practice === "builder" && <div className="required-practice-wrap"><div className="builder-lab mission-builder"><div className="lab-instructions"><span className="micro-label">BUILD THE MISSION · DAY {missionPhase + 1} / 3</span><h3>Assemble the line you will perform.</h3><p>{activeMission.translation} Put the Mandarin into its natural order. Tap a placed piece to move it back.</p></div><div className="builder-board"><div className="sentence-line">{missionBuilt.length ? missionBuilt.map((token, index) => <button key={`${token}-${index}`} onClick={() => removeMissionToken(token, index)}>{token}</button>) : <span>Tap the pieces below to build the mission line…</span>}</div><div className="word-bank">{missionWordBank.map((token, index) => <button key={`${token}-${index}`} onClick={() => addMissionToken(token, index)}>{token}</button>)}</div><div className="builder-actions"><button onClick={resetMissionBuilder}>Reset</button><button className="check-button" onClick={checkMissionBuilder} disabled={!missionBuilt.length}>Check mission line</button></div>{missionBuildResult && <div className={`result-note ${missionBuildResult.startsWith("Correct") ? "correct" : ""}`}>{missionBuildResult}</div>}</div></div><details className="extra-practice"><summary>Extra sentence reps <span>16-challenge practice bank</span></summary><div className="builder-lab"><div className="lab-instructions"><span className="micro-label">OPTIONAL SENTENCE LAB · {buildIndex + 1} / {sentenceChallenges.length}</span><h3>Build another thought.</h3><p>{activeSentence.translation} This practice bank awards extra XP without changing today’s required mission.</p></div><div className="builder-board"><div className="sentence-line">{built.length ? built.map((token, index) => <button key={`${token}-${index}`} onClick={() => removeToken(token, index)}>{token}</button>) : <span>Tap words below to build the sentence…</span>}</div><div className="word-bank">{wordBank.map((token, index) => <button key={`${token}-${index}`} onClick={() => addToken(token, index)}>{token}</button>)}</div><div className="builder-actions"><button onClick={() => resetBuilder()}>Reset</button><button className="check-button" onClick={checkBuilder} disabled={!built.length}>Check sentence</button></div>{buildResult && <div className={`result-note ${buildResult.startsWith("Correct") ? "correct" : ""}`}>{buildResult}<button onClick={() => resetBuilder(true)}>Next →</button></div>}</div></div></details></div>}

          {practice === "reading" && <div className="graded-reader"><div className="reader-intro"><span className="micro-label">GRADED READING · KNOWN MISSION LANGUAGE</span><h3>{gradedReading.title}</h3><p>Read the exchange first without translation. Tap a line only when you need support.</p></div><div className="reader-page">{gradedReading.lines.map((line, index) => <details key={`${line.speaker}-${index}`}><summary><span>{line.speaker}</span><strong lang="zh-CN">{line.hanzi}</strong><button onClick={(event) => { event.preventDefault(); speak(line.hanzi); }} aria-label={`Play line ${index + 1}`}>▶</button></summary><p>{progress.showPinyin && <span>{line.pinyin}</span>}<em>{line.translation}</em></p></details>)}<div className="reader-question"><strong>{gradedReading.question}</strong>{gradedReading.options.map((option) => <button key={option} onClick={() => answerReading(option)} disabled={readingResult.startsWith("Correct")}>{option}</button>)}{readingResult && <div className={`result-note ${readingResult.startsWith("Correct") ? "correct" : ""}`}>{readingResult}</div>}</div></div></div>}

          {practice === "speaking" && <div className="conversation-stage"><div className="conversation-heading"><span className="micro-label">EXPANDING CONVERSATION · DAY {missionPhase + 1} / 3</span><h3>{missionPhase === 2 ? "Perform the complete exchange." : "Add one more turn each day."}</h3><p>Tap any turn to hear it. Perform every turn marked YOU when you reach the checkpoint.</p></div>{missionConversation.map((turn, index) => <button key={`${turn.speaker}-${index}`} className={turn.learner ? "learner" : "partner"} onClick={() => speak(turn.hanzi, 0.72)}><span>{turn.speaker} · ▶</span><strong lang="zh-CN">{turn.hanzi}</strong>{progress.showPinyin && <small>{turn.pinyin}</small>}<em>{turn.translation}</em></button>)}</div>}

          {practice === "speaking" && <div className="mission-checkpoint"><div className="checkpoint-intro"><span className="micro-label">REAL-LIFE CHECKPOINT · MISSION {activeMissionIndex + 1} · DAY {missionPhase + 1} / 3</span><h3>{missionPhase === 2 ? "Perform it without reading." : replaySession ? "Prove this mission skill again." : "Prove today’s mission skill."}</h3><p>{missionPhaseCopy[missionPhase].detail} Listen once, shadow twice, then look away and deliver the line naturally.</p><div className="checkpoint-readiness">{dailySteps.slice(0, 4).map((step) => <span key={step.id} className={sessionDaily.includes(step.id) ? "ready" : ""}>{sessionDaily.includes(step.id) ? "✓" : "○"} {step.title}</span>)}</div></div><div className="speech-console mission-speech-console"><button className="speaker-orb" onClick={() => speak(activeMission.phrase, 0.7)} aria-label="Play mission phrase">声<span>▶ MODEL</span></button><strong>{activeMission.phrase}</strong>{progress.showPinyin && <p>{activeMission.pinyin}</p>}<em>{activeMission.translation}</em><button className={`record-button ${isMissionListening ? "recording" : ""}`} onClick={startMissionSpeechCheck}><span>●</span>{isMissionListening ? "Listening…" : "Perform my line"}</button><div className="speech-feedback">{missionSpeechText}</div>{missionSpeechScore !== null && <div className="speech-meter"><i style={{ width: `${missionSpeechScore}%` }} /></div>}<button className="checkpoint-button" onClick={completeMissionCheckpoint} disabled={!missionReady || completedMissionSession}>{completedMissionSession ? `✓ ${replaySession ? "Replay" : "Checkpoint"} complete` : replaySession ? "I performed it · complete replay" : missionPhase === 2 ? "I performed it · complete mission" : "I performed it · complete today"}</button><small className="speech-honesty">Recognition checks words, not tone accuracy. Complete only after an honest self-check.</small></div><div className="sound-gym-toggle"><button onClick={() => setShowSoundGym((value) => !value)}>{showSoundGym ? "Close sound gym" : "Open optional sound gym"}</button><span>Keep all {pronunciationDrills.length} pronunciation drills available for extra practice.</span></div>{showSoundGym && <div className="speaking-lab pronunciation-lab sound-gym"><div className="lab-instructions"><span className="micro-label">OPTIONAL TONE & SOUND GYM · {pronunciationIndex + 1} / {pronunciationDrills.length}</span><h3>Train the sound, not just the word.</h3><p>{activePronunciation.cue}</p><div className="tone-map" aria-label="Mandarin tone contours"><span>1 ˉ<small>high</small></span><span>2 ˊ<small>rise</small></span><span>3 ˇ<small>dip</small></span><span>4 ˋ<small>fall</small></span><span>·<small>light</small></span></div></div><div><div className="pronunciation-picker">{pronunciationDrills.map((drill, index) => <button key={drill.id} className={index === pronunciationIndex ? "active" : ""} onClick={() => { setPronunciationIndex(index); setSpeechScore(null); setSpeechText("Listen, shadow, then record the line."); }}>{drill.focus}</button>)}</div><div className="speech-console"><button className="speaker-orb" onClick={() => speak(activePronunciation.hanzi, 0.7)} aria-label="Play phrase">声<span>▶ MODEL</span></button><strong>{activePronunciation.hanzi}</strong>{progress.showPinyin && <p>{activePronunciation.pinyin}</p>}<button className={`record-button ${isListening ? "recording" : ""}`} onClick={startSpeechCheck}><span>●</span>{isListening ? "Listening…" : "Record my line"}</button><div className="speech-feedback">{speechText}</div>{speechScore !== null && <div className="speech-meter"><i style={{ width: `${speechScore}%` }} /></div>}<div className="self-checks"><button onClick={() => completePronunciation("Pronunciation drill recorded · +12 XP")}>Tone contour felt accurate</button><button onClick={() => { setSpeechText("Replay slowly and exaggerate the contour once, then repeat naturally."); speak(activePronunciation.hanzi, 0.58); }}>Needs another round</button></div><small className="speech-honesty">Browser recognition checks the words, not pitch. Use the tone cue and an honest self-check.</small></div></div></div>}</div>}
        </div>
        {practice === "speaking" && completedMissionSession && <div className="correction-lab"><div><span className="micro-label">AUTOMATIC CORRECTION LOOP</span><h3>{activeCorrection ? `${activeCorrections.length} miss${activeCorrections.length === 1 ? "" : "es"} ready to repair` : "Today’s misses are repaired."}</h3><p>{activeCorrection ? "Answer correctly now and once more tomorrow. This extra practice never changes the fixed vocabulary cadence." : "Anything you miss later will appear here automatically."}</p></div>{activeCorrection && <div className="correction-card"><span>{skillLabels[activeCorrection.skill]}</span><strong>{activeCorrection.prompt}</strong><div>{activeCorrection.options.map((option) => <button key={option} onClick={() => answerCorrection(option)}>{option}</button>)}</div>{correctionResult && <p className={correctionResult.startsWith("Correct") ? "correct" : ""}>{correctionResult}<small>{activeCorrection.explanation}</small></p>}</div>}</div>}
        <div className="lesson-next-bar"><button onClick={() => navigate("today")}>Save & return to plan</button><div><span>UP NEXT</span><strong>{practiceLabels[nextPractice]}</strong></div><button className="next-step-button" onClick={() => setPractice(nextPractice)}>Continue →</button></div>
      </section>
      )}

      {appView === "course" && (
        <section className="section path-section app-view" id="path">
          <div className="view-intro"><span className="view-icon">路</span><div><span className="section-kicker">{meta.label.toUpperCase()} COURSE</span><h1>Your guided mission route</h1><p>Twelve real-life missions, each unfolding across three guided sessions. After the first route, missions rotate again while full vocabulary and grammar coverage continues.</p></div></div>
          <div className="section-heading path-heading"><div><h2>Twelve real-life<br /><em>missions.</em></h2></div><div className="route-summary"><strong>{progress.missions.length}/12</strong><span>missions complete</span><div><i style={{ width: `${(progress.missions.length / missions.length) * 100}%` }} /></div></div></div>
          {missionCycle > 0 && <div className="continuation-banner"><span>∞</span><div><strong>Fluency loop {missionCycle + 1} is active.</strong><p>The core route is complete. Today now revisits the missions with new scheduled vocabulary and grammar so practice never gets stuck on mission 12.</p></div></div>}
          <div className="mission-grid">{missions.map((mission, index) => { const done = progress.missions.includes(index); const current = index === activeMissionIndex && !done; const locked = index > activeMissionIndex; return <article key={mission.title} className={`mission-card ${done ? "complete" : ""} ${current ? "current" : ""} ${locked ? "locked" : ""}`}><div className="mission-top"><span>W{mission.week} · {String(index + 1).padStart(2, "0")}</span><button onClick={() => current && goToPractice(nextRecommended)} disabled={!current}>{done ? "✓ DONE" : current ? `DAY ${missionPhase + 1} / 3 · CONTINUE` : "LOCKED"}</button></div><h3>{mission.title}</h3><p>{mission.subtitle}</p>{current && <div className="mission-progress"><span style={{ width: `${((missionPhase + (completedMissionToday ? 1 : 0)) / 3) * 100}%` }} /></div>}<div className="mission-words">{mission.words}</div><button className="mission-phrase" onClick={() => speak(mission.phrase)}><span>▶</span><strong>{mission.phrase}</strong>{progress.showPinyin && <small>{mission.pinyin}</small>}</button></article>; })}</div>
        </section>
      )}

      {appView === "library" && libraryView !== "grammar" && (
        <section className="section vocabulary-section app-view" id="vocabulary">
          <div className="view-intro light-view"><span className="view-icon">库</span><div><span className="section-kicker">LIBRARY</span><h1>Explore the syllabus</h1><p>Reference material lives here. Your required work is always waiting under Today.</p></div></div>
          <div className="library-scope" aria-label="Library scope"><span>SHOW</span><button className={!libraryCumulative ? "active" : ""} onClick={() => { setLibraryCumulative(false); setShowAllWords(false); setShowAllCharacters(false); }}>{meta.newWords.toLocaleString()} new in {meta.label}</button><button className={libraryCumulative ? "active" : ""} onClick={() => { setLibraryCumulative(true); setShowAllWords(false); setShowAllCharacters(false); }}>{meta.cumulativeWords.toLocaleString()} through {meta.label}</button></div>
          <div className="library-tabs" role="tablist" aria-label="Library sections">
            <button className={libraryView === "words" ? "active" : ""} onClick={() => openLibrary("words")}>{libraryVocabulary.length.toLocaleString()} Words</button>
            <button className={libraryView === "characters" ? "active" : ""} onClick={() => openLibrary("characters")}>{recognitionCharacters.length.toLocaleString()} Characters</button>
            <button onClick={() => openLibrary("grammar")}>{grammarPoints.length} Grammar</button>
          </div>
          {libraryView === "words" && <>
            <div className="section-heading vocabulary-heading"><div><span className="section-kicker">OFFICIAL {meta.label.toUpperCase()} WORD BANK</span><h2>{libraryVocabulary.length.toLocaleString()} searchable words.<br /><em>Meaning first.</em></h2></div><div className="vocab-tools"><label><span>⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search 汉字, pinyin, English, or entry number" aria-label="Search vocabulary" /></label><button onClick={() => setProgress((current) => ({ ...current, showPinyin: !current.showPinyin }))}>{progress.showPinyin ? "Hide pinyin" : "Show pinyin"}</button></div></div>
            <div className="vocab-status"><span><b>{progress.mastered.length}</b> words on step 3+</span><div><i style={{ width: `${coursePercent}%` }} /></div><span>{coursePercent}%</span></div>
            <div className="word-grid">{visibleWords.map((word) => { const originalIndex = word.level === selectedLevel ? vocabulary.findIndex((item) => item.sequence === word.sequence) : -1; const mastered = originalIndex >= 0 && progress.mastered.includes(originalIndex); const learned = originalIndex >= 0 && Boolean(progress.reviews[originalIndex]); return <article key={`${word.level}-${word.sequence}`} className={mastered ? "mastered" : ""}><button className="word-audio" onClick={() => speak(word.hanzi)} aria-label={`Play ${word.hanzi}`}>▶</button><strong>{word.hanzi}</strong>{progress.showPinyin && <span>{word.pinyin}</span>}<p>{word.meaning}</p><div className="word-context">{word.example && <b>{word.example}</b>}<small>{word.collocation}</small>{word.note && <em>{word.note}</em>}</div>{originalIndex >= 0 ? <button className="master-button" onClick={() => studyWord(originalIndex)}>{mastered ? "✓ Cadence step 3+ · practice now" : learned ? "In cadence · practice now" : "+ Add to today"}</button> : <button className="master-button" disabled>HSK {word.level} foundation word</button>}</article>; })}</div>
            {!search && <button className="load-more" onClick={() => setShowAllWords((value) => !value)}>{showAllWords ? "Show the focused set" : libraryVocabulary.length > 200 ? `Browse the first 200 · search all ${libraryVocabulary.length.toLocaleString()}` : `Explore all ${libraryVocabulary.length.toLocaleString()} words`} <span>↓</span></button>}
            {search && filteredWords.length > visibleWords.length && <p className="result-limit-note">Showing the first {visibleWords.length} of {filteredWords.length.toLocaleString()} matches. Add another word, pinyin syllable, meaning, or entry number to narrow the search.</p>}
          </>}
          {libraryView === "characters" && <><label className="library-search"><span>⌕</span><input value={characterSearch} onChange={(event) => setCharacterSearch(event.target.value)} placeholder="Search character, word, pinyin, or meaning" aria-label="Search characters" /></label><div className="character-bank standalone"><div><span className="section-kicker">CHARACTER RECOGNITION</span><h3>{characterSearch ? `${filteredCharacters.length} matching characters.` : `Recognize all ${recognitionCharacters.length.toLocaleString()}.`}</h3><p>These are the official recognition characters in the selected scope. Tap one to hear a syllabus word that uses it.</p></div><div className="character-grid">{(showAllCharacters || characterSearch ? filteredCharacters : filteredCharacters.slice(0, 80)).map((character, index) => { const sample = libraryVocabulary.find((word) => word.hanzi.includes(character)); return <button key={`${character}-${index}`} onClick={() => speak(sample?.hanzi ?? character)} title={sample ? `${sample.hanzi} · ${sample.meaning}` : character}>{character}</button>; })}{!characterSearch && recognitionCharacters.length > 80 && <button className="character-more" onClick={() => setShowAllCharacters((value) => !value)}>{showAllCharacters ? "−" : `+${recognitionCharacters.length - 80}`}</button>}</div></div></>}
        </section>
      )}

      {appView === "library" && libraryView === "grammar" && (
        <section className="section grammar-section app-view" id="grammar">
          <div className="view-intro"><span className="view-icon">文</span><div><span className="section-kicker">LIBRARY</span><h1>Grammar patterns</h1><p>Browse or practice any target without losing your place in today’s lesson.</p></div></div>
          <div className="library-scope" aria-label="Library scope"><span>SHOW</span><button className={!libraryCumulative ? "active" : ""} onClick={() => setLibraryCumulative(false)}>{meta.label} only</button><button className={libraryCumulative ? "active" : ""} onClick={() => setLibraryCumulative(true)}>Through {meta.label}</button></div>
          <div className="library-tabs" role="tablist" aria-label="Library sections"><button onClick={() => openLibrary("words")}>{libraryVocabulary.length.toLocaleString()} Words</button><button onClick={() => openLibrary("characters")}>{recognitionCharacters.length.toLocaleString()} Characters</button><button className="active" onClick={() => openLibrary("grammar")}>{grammarPoints.length} Grammar</button></div>
          <div className="section-heading grammar-heading"><div><span className="section-kicker">OFFICIAL GRAMMAR INVENTORY</span><h2>{grammarPoints.length} searchable<br /><em>grammar targets.</em></h2></div><p>Every target in your active level now enters Today automatically: first as a taught item, then again when its review is due.</p></div>
          <label className="library-search"><span>⌕</span><input value={grammarSearch} onChange={(event) => setGrammarSearch(event.target.value)} placeholder="Search pattern, example, pinyin, or meaning" aria-label="Search grammar" /></label>
          <div className="filter-row">{["All", "Core", "Questions", "Time", "Place", "Actions"].map((filter) => <button key={filter} className={grammarFilter === filter ? "active" : ""} onClick={() => { setGrammarFilter(filter); setShowAllGrammar(filter !== "All"); }}>{filter}</button>)}</div>
          {grammarPractice !== null && <div className={`grammar-drill grammar-drill-${grammarPracticeStage}`}><button className="close-drill" onClick={() => setGrammarPractice(null)} aria-label="Close grammar practice">×</button><div className="grammar-stage-track light" aria-label="Grammar practice stages"><span className={grammarPracticeStage === "learn" ? "active" : "complete"}><b>1</b> Learn</span><i>→</i><span className={grammarPracticeStage === "recall" ? "active" : ""}><b>2</b> Recall</span></div>{grammarPracticeStage === "learn" ? <div className="library-grammar-learn"><span className="micro-label">PATTERN STUDY · TARGET {grammarPractice + 1}</span><h3>{grammarPoints[grammarPractice].title}</h3><code>{grammarPoints[grammarPractice].formula}</code><p>This pattern teaches {grammarConcept(grammarPoints[grammarPractice])}. Notice the fixed Chinese pieces and the slots you can replace.</p>{grammarPoints[grammarPractice].example && <button className="grammar-model" onClick={() => speak(grammarPoints[grammarPractice].example)}><span>▶</span><strong>{grammarPoints[grammarPractice].example}</strong>{progress.showPinyin && <small>{grammarPoints[grammarPractice].pinyin}</small>}<em>{grammarPoints[grammarPractice].translation}</em></button>}<GrammarPatternMixer key={`library-${selectedLevel}-${grammarPractice}-${activeMissionIndex}`} point={grammarPoints[grammarPractice]} fallbackFormula={activeMission.grammarFormula} words={cumulativeVocabulary} /><button className="grammar-recall-start" onClick={beginLibraryGrammarRecall}>Hide the lesson &amp; test me →</button></div> : <div className="library-grammar-recall"><span className="micro-label">RECALL CHECK · LESSON HIDDEN</span><h3>{grammarPoints[grammarPractice].example ? `Which Mandarin sentence expresses “${grammarPoints[grammarPractice].translation}”?` : `Which official structure matches “${grammarPoints[grammarPractice].title}”?`}</h3><p>Retrieve the pattern from memory. The answer stays hidden until you are correct.</p><div className="grammar-drill-choices">{grammarOptions.map((option) => <button key={option} onClick={() => answerGrammar(option)} disabled={grammarResult.startsWith("Correct")}>{option}</button>)}</div>{!grammarResult && <button className="grammar-help-button light" onClick={reopenLibraryGrammarLesson}>Need help? Reopen the lesson</button>}{grammarResult && <div className="library-grammar-feedback"><p className={grammarResult.startsWith("Correct") ? "correct" : ""}>{grammarResult}</p>{!grammarResult.startsWith("Correct") ? <button className="grammar-help-button light" onClick={reopenLibraryGrammarLesson}>Reopen lesson</button> : <div className="grammar-answer-review dark"><strong>Answer explained</strong><code>{grammarPoints[grammarPractice].formula}</code>{grammarPoints[grammarPractice].example && <button className="grammar-model" onClick={() => speak(grammarPoints[grammarPractice].example)}><span>▶</span><strong>{grammarPoints[grammarPractice].example}</strong>{progress.showPinyin && <small>{grammarPoints[grammarPractice].pinyin}</small>}<em>{grammarPoints[grammarPractice].translation}</em></button>}<button className="grammar-next-target" onClick={() => setGrammarPractice(null)}>Choose another target →</button></div>}</div>}</div>}</div>}
          <div className="grammar-grid">{visibleGrammar.map((point) => { const globalIndex = grammarPoints.indexOf(point); const activeIndex = levelGrammar.findIndex((target) => target.title === point.title && target.formula === point.formula); const introduced = activeIndex >= 0 && Boolean(progress.grammarReviews[activeIndex]); const stable = activeIndex >= 0 && progress.grammarMastered.includes(activeIndex); return <article key={`${point.title}-${globalIndex}`} className={stable ? "mastered" : introduced ? "introduced" : ""}><div className="grammar-card-top"><span>{String(globalIndex + 1).padStart(2, "0")} · {point.label}</span>{point.example && <button onClick={() => speak(point.example)}>▶</button>}</div><h3>{point.title}</h3><code>{point.formula}</code>{point.example ? <div className="grammar-example"><strong>{point.example}</strong>{progress.showPinyin && <span>{point.pinyin}</span>}<small>{point.translation}</small></div> : <span className="official-target-note">{stable ? "✓ Stable in your review schedule" : introduced ? "Learning · future review scheduled" : activeIndex >= 0 ? "Not taught yet · automatically scheduled in Today" : "Foundation target from an earlier level"}</span>}<button className="grammar-practice-button" onClick={() => openGrammarPractice(globalIndex)}>{stable ? "Practice stable target →" : introduced ? "Review this target →" : "Preview this target →"}</button></article>; })}</div>
          {grammarFilter === "All" && !grammarSearch && <button className="grammar-more" onClick={() => setShowAllGrammar((value) => !value)}>{showAllGrammar ? "Show the 20 essential targets" : `Show all ${grammarPoints.length} targets`}</button>}
        </section>
      )}

      {appView === "exam" && (
      <section className="section exam-section app-view" id="exam">
        <div className="view-intro"><span className="view-icon">考</span><div><span className="section-kicker">{selectedLevel === "1" ? "MOCK EXAM" : "LEVEL CHECKPOINT"}</span><h1>Test your {meta.label} readiness</h1><p>This is optional assessment—not today’s required lesson. Take it when you want a focused readiness check.</p></div></div>
        {!examStarted ? <><div className="exam-card"><div className="exam-copy"><span className="section-kicker light">HSK 3.0 · {meta.label.toUpperCase()} {selectedLevel === "1" ? "PRACTICE MOCK" : "VOCABULARY CHECKPOINT"}</span><h2>Know what sticks.<br /><em>Train the misses.</em></h2><p>{selectedLevel === "1" ? "Run the 40-question HSK 1 practice simulation: 20 listening and 20 reading questions in 40 minutes." : `Run a 40-word ${meta.label} readiness check: 20 audio prompts and 20 reading prompts, sampled across this level’s ${meta.newWords.toLocaleString()} new entries. This is a study checkpoint, not a replica of the official exam.`}</p><button className="exam-start" onClick={startMockExam}>Start the 40-minute {selectedLevel === "1" ? "mock" : "checkpoint"} →</button><a href="https://www.chinesetest.cn/syllabus" target="_blank" rel="noreferrer">View official HSK 3.0 resources ↗</a></div><div className="exam-structure"><div><span>01</span><strong>Listening</strong><b>20</b><small>questions · play each prompt</small></div><div><span>02</span><strong>Reading</strong><b>20</b><small>questions · choose the meaning</small></div><div className="exam-total"><span>TOTAL</span><strong>40 questions</strong><b>40 min</b></div></div></div><p className="rollout-note"><strong>Before you register</strong> The July 2026 syllabus is current, but test availability and administration can vary by center. Confirm the exact format with your chosen test center.</p></> : <div className="mock-shell">{!examResult ? <><div className="mock-top"><div><span className="micro-label">{examQuestion.section.toUpperCase()} · {examIndex + 1} / 40</span><div className="mock-progress"><i style={{ width: `${((examIndex + 1) / 40) * 100}%` }} /></div></div><strong>{examMinutes}:{examSeconds}</strong></div><div className="mock-question">{examQuestion.section === "Listening" ? <><button className="big-listen-button" onClick={() => speak(examQuestion.prompt)}><span>▶</span> Play question</button><p>Choose the meaning you hear.</p></> : <><strong lang="zh-CN">{examQuestion.prompt}</strong><p>Choose the best meaning.</p></>}<div className="mock-options">{(examOptions[examQuestion.id] ?? examQuestion.options).map((option, index) => <button key={option} className={examAnswers[examQuestion.id] === option ? "selected" : ""} onClick={() => setExamAnswers((current) => ({ ...current, [examQuestion.id]: option }))}><span>{String.fromCharCode(65 + index)}</span>{option}</button>)}</div></div><div className="mock-actions"><button onClick={() => setExamIndex((index) => Math.max(0, index - 1))} disabled={examIndex === 0}>← Previous</button>{examIndex < 39 ? <button onClick={() => setExamIndex((index) => index + 1)}>Next →</button> : <button onClick={finishExam}>Submit {selectedLevel === "1" ? "mock" : "checkpoint"}</button>}</div></> : <div className="mock-results"><span className="result-ring">{examResult.score}%</span><h2>{examResult.correct}/40 correct</h2><p>{examResult.score >= 80 ? "Strong result. Review the misses, then keep training speaking beyond the test." : examResult.score >= 60 ? "Foundation reached. Review every miss before your next attempt." : "Keep building the daily loop, then retry after more scheduled review."}</p><h3>Wrong-answer review</h3><div className="wrong-list">{mockExamQuestions.filter((question) => examAnswers[question.id] !== question.answer).map((question) => <article key={question.id}><span>{question.section} · {question.id.toUpperCase()}</span><strong>{question.prompt}</strong><p>Your answer: {examAnswers[question.id] ?? "No answer"}</p><p>Correct: {question.answer}</p><small>{question.explanation}</small></article>)}</div><button className="primary-button" onClick={startMockExam}>Try a fresh attempt <span>→</span></button></div>}</div>}
      </section>
      )}

      {appView === "progress" && (
        <section className="section progress-section app-view" id="progress">
          <div className="view-intro"><span className="view-icon">我</span><div><span className="section-kicker">PROGRESS · {meta.label.toUpperCase()}</span><h1>Your learning record</h1><p>See momentum, protect your data, and move between levels without losing your place.</p></div></div>
          <div className="section-heading progress-heading"><div><span className="section-kicker">YOUR MOMENTUM</span><h2>Small proof,<br /><em>every day.</em></h2></div><div className="progress-tools"><button onClick={exportProgress}>Export backup</button><button onClick={() => importRef.current?.click()}>Import backup</button><button className="danger-link" onClick={resetProgress}>Reset</button><input ref={importRef} type="file" accept="application/json" onChange={(event) => void importProgress(event.target.files?.[0])} hidden /></div></div>
          <div className="stat-grid"><article className="stat-card coral"><span>火</span><strong>{progress.streak}</strong><p>day streak</p><small>Counts practice days, not visits.</small></article><article className="stat-card jade"><span>字</span><strong>{progress.mastered.length}</strong><p>cycled words</p><small>Seen on at least three scheduled study days.</small></article><article className="stat-card blue"><span>时</span><strong>{progress.minutes}</strong><p>minutes trained</p><small>Uses each task’s real target time.</small></article><article className="stat-card yellow"><span>光</span><strong>{progress.xp}</strong><p>practice XP</p><small>Every reward can be earned only once.</small></article></div>
          <div className="coverage-dashboard"><div><span>VOCABULARY COVERAGE</span><strong>{wordsIntroduced.toLocaleString()} <small>/ {vocabulary.length.toLocaleString()} taught</small></strong><div><i style={{ width: `${wordCoveragePercent}%` }} /></div><p>{progress.mastered.length.toLocaleString()} on cadence step 3+ · {Math.max(0, vocabulary.length - wordsIntroduced).toLocaleString()} still to introduce</p></div><div><span>GRAMMAR COVERAGE</span><strong>{grammarIntroduced} <small>/ {levelGrammar.length} taught</small></strong><div><i style={{ width: `${grammarCoveragePercent}%` }} /></div><p>{progress.grammarMastered.length} stable · {Math.max(0, levelGrammar.length - grammarIntroduced)} still to introduce</p></div></div>
          <div className="skill-dashboard"><div className="skill-dashboard-head"><div><span className="section-kicker">OBJECTIVE ACCURACY</span><h3>Know exactly what needs attention.</h3></div><p>{weakestSkill ? `${skillLabels[weakestSkill.skill]} is currently the best place to focus at ${weakestSkill.accuracy}% accuracy.` : "Complete objective checks to build your first accuracy profile."} {progress.corrections.length} correction{progress.corrections.length === 1 ? "" : "s"} remain across all levels.</p></div><div className="skill-score-grid">{skillScores.map((item) => <article key={item.skill}><span>{skillLabels[item.skill]}</span><strong>{item.attempts ? `${item.accuracy}%` : "—"}</strong><div><i style={{ width: `${item.accuracy}%` }} /></div><small>{item.attempts} objective attempt{item.attempts === 1 ? "" : "s"}</small></article>)}</div></div>
          <div className={`backup-note sync-${syncStatus}`}><strong>{syncStatus === "synced" ? "Progress synced across devices." : syncStatus === "saving" || syncStatus === "checking" ? "Checking your cloud progress…" : "Progress is saved on this device."}</strong><span>{syncStatus === "synced" ? "Your signed-in Sites account keeps the newest course state available on your phone and computer." : "Cloud sync requires the signed-in Sites version. Export a backup before clearing browser data when using GitHub Pages or offline mode."}</span><button className="account-manage-link" onClick={() => setShowAccount(true)}>View account</button></div>
          <div className="level-roadmap"><div><span className="section-kicker">THE COMPLETE PATH</span><h3>All nine HSK levels are ready.</h3><p>Choose any level now. Each one keeps its own cadence, missions, exam history, and cycled-word count.</p></div><ol>{levelOrder.map((level) => { const item = levelMeta[level]; const current = level === selectedLevel; return <li key={level} className={current ? "current" : "available"}><button onClick={() => chooseLevel(level)}><span>{current ? "NOW" : "OPEN"}</span><strong>{item.label}</strong><small>{item.stage} · {item.cumulativeWords.toLocaleString()} cumulative words</small></button></li>; })}</ol></div>
          <div className="app-about"><div><span className="brand-mark">声</span><div><strong>SHĒNGTÚ</strong><p>Hear it. Say it. Own it.</p></div></div><div><span>SOURCES</span><a href="https://www.chinesetest.cn/syllabus" target="_blank" rel="noreferrer">Official HSK 3.0 ↗</a><a href="https://hsk.cn-bj.ufileos.com/3.0/%E6%96%B0%E7%89%88HSK%E8%80%83%E8%AF%95%E5%A4%A7%E7%BA%B2%EF%BC%88%E8%AF%8D%E6%B1%87%E3%80%81%E6%B1%89%E5%AD%97%E3%80%81%E8%AF%AD%E6%B3%95%EF%BC%89.pdf" target="_blank" rel="noreferrer">2025 syllabus PDF ↗</a><a href="https://cc-cedict.org/editor/editor.php?handler=Download" target="_blank" rel="noreferrer">English glosses · CC-CEDICT ↗</a></div><small>Independent learning tool. Not affiliated with Chinese Test International.</small></div>
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

      {ready && showStudyHistory && (
        <div className="history-backdrop" role="dialog" aria-modal="true" aria-labelledby="study-history-title">
          <div className="history-sheet">
            <div className="history-sheet-head">
              <div><span className="section-kicker">{meta.label.toUpperCase()} · STUDY HISTORY</span><h2 id="study-history-title">Repeat a previous day.</h2><p>Open the exact vocabulary, grammar, and mission saved for that session. Repeating strengthens recall without replacing today’s plan.</p></div>
              <button onClick={() => setShowStudyHistory(false)} aria-label="Close study history">×</button>
            </div>
            {studyDays.length ? <div className="history-day-list">{studyDays.map((day) => { const mission = missions[Math.min(missions.length - 1, day.missionIndex)]; const originallyComplete = day.completedSteps.includes("speak"); return <article key={day.date}><div className="history-date"><span>{studyDayLabel(day.date)}</span><small>{day.date}</small></div><div className="history-day-copy"><strong>{mission.title} · day {day.missionPhase + 1}/3</strong><span>{day.vocabularyQueue.length} words · {day.grammarQueue.length} grammar target{day.grammarQueue.length === 1 ? "" : "s"}</span><small>{originallyComplete ? "✓ Completed that day" : `${day.completedSteps.length}/6 steps completed`}{day.replayCount ? ` · repeated ${day.replayCount}×` : ""}</small></div><button className="repeat-day-button" onClick={() => startStudyDayReplay(day)}>Repeat day <span>→</span></button></article>; })}</div> : <div className="history-empty"><span>日</span><h3>Your history starts here.</h3><p>Shēngtú is now saving each daily lesson. After your next study day begins, today will appear here with a one-tap replay button.</p><button onClick={() => setShowStudyHistory(false)}>Keep studying today</button></div>}
            <div className="history-note"><strong>What changes during a replay?</strong><span>Vocabulary return dates stay on their automatic cadence; grammar reviews can adapt. Today’s completion, mission position, streak, time, and XP do not advance twice.</span></div>
          </div>
        </div>
      )}

      {ready && showInstallHelp && (
        <div className="install-backdrop" role="dialog" aria-modal="true" aria-labelledby="install-app-title">
          <div className="install-sheet">
            <button className="install-close" onClick={() => setShowInstallHelp(false)} aria-label="Close installation instructions">×</button>
            <span className="install-sheet-icon" aria-hidden="true">声</span>
            <span className="section-kicker">ANDROID APP</span>
            <h2 id="install-app-title">Put Shēngtú on your home screen.</h2>
            <p>Install it once for a full-screen app window, launcher icon, and offline access to lessons you have already loaded.</p>
            {installPrompt ? <button className="primary-button install-now" onClick={() => void installApp()}>Install now <span>→</span></button> : <ol><li>Open this site in <strong>Google Chrome</strong> on your Android phone.</li><li>Tap Chrome’s <strong>⋮ menu</strong> in the top-right corner.</li><li>Choose <strong>Install app</strong> or <strong>Add to Home screen</strong>.</li><li>Confirm <strong>Install</strong>. Shēngtú will appear with your other apps.</li></ol>}
            <small>The menu wording can differ by Android device. If the option is missing, refresh once while online and reopen this panel.</small>
          </div>
        </div>
      )}

      {ready && showAccount && (
        <div className="account-backdrop" role="dialog" aria-modal="true" aria-labelledby="account-title">
          <div className="account-sheet">
            <button className="account-close" onClick={() => setShowAccount(false)} aria-label="Close account">×</button>
            <span className="section-kicker">ACCOUNT &amp; SYNC</span>
            <h2 id="account-title">Your Shēngtú account</h2>
            {account.mode === "signed-in" && <>
              <div className="account-identity"><span aria-hidden="true">{(account.user.displayName || account.user.email).slice(0, 1).toUpperCase()}</span><div><strong>{account.user.displayName}</strong><small>{account.user.email}</small></div></div>
              <div className={`account-sync-state ${syncStatus === "error" ? "warning" : "active"}`}><i aria-hidden="true" /><div><strong>{syncStatus === "error" ? "Cloud sync needs attention" : syncStatus === "saving" ? "Saving your latest progress…" : "Cloud sync is on"}</strong><p>{syncStatus === "error" ? "Your lesson is safe on this device. Reopen the app while online to retry cloud sync." : "Your newest completed lessons, recall cadence, and course progress follow this account across the Sites app on your devices."}</p></div></div>
              <div className="account-actions"><button onClick={() => setShowAccount(false)}>Done</button><a href="/signout-with-chatgpt?return_to=%2F">Sign out</a></div>
            </>}
            {account.mode === "checking" && <div className="account-message"><span className="account-spinner" aria-hidden="true" /><strong>Checking your account…</strong><p>This should only take a moment.</p></div>}
            {account.mode === "signed-out" && <div className="account-message"><span aria-hidden="true">人</span><strong>You are not signed in.</strong><p>Sign in with ChatGPT to restore cloud progress and continue on another device.</p><a className="account-primary" href="/signin-with-chatgpt?return_to=%2F">Sign in with ChatGPT</a></div>}
            {account.mode === "device-only" && <div className="account-message"><span aria-hidden="true">▣</span><strong>This copy saves only on this device.</strong><p>GitHub Pages and offline copies cannot connect to your account. Use the secure Sites app for automatic cross-device sync.</p><a className="account-primary" href="https://shengtu-mandarin.z1ifre.chatgpt.site">Open the synced app</a></div>}
            {account.mode === "unavailable" && <div className="account-message"><span aria-hidden="true">!</span><strong>Your account could not be checked.</strong><p>Your lesson remains saved on this device. Reconnect to the internet, then try again.</p><button className="account-primary" onClick={() => window.location.reload()}>Try again</button></div>}
          </div>
        </div>
      )}

      {ready && showLevelPicker && <div className="onboarding-backdrop level-picker-backdrop" role="dialog" aria-modal="true" aria-labelledby="level-picker-title"><div className="onboarding-card level-picker-card"><div className="picker-top"><div><span className="section-kicker">COMPLETE HSK 3.0 PATH</span><h2 id="level-picker-title">Choose your active level.</h2><p>Switch whenever you need. Vocabulary cadence and mission progress are saved separately for every level.</p></div><button className="picker-close" onClick={() => setShowLevelPicker(false)} aria-label="Close level picker">×</button></div><div className="level-picker-grid">{levelOrder.map((level) => { const item = levelMeta[level]; const active = level === selectedLevel; const savedCount = active ? progress.mastered.length : progress.levelArchives[level]?.mastered.length ?? 0; return <button key={level} className={active ? "active" : ""} onClick={() => chooseLevel(level)}><span>{active ? "CURRENT" : savedCount ? `${savedCount} CYCLED` : "AVAILABLE"}</span><strong>{item.label}</strong><b>{item.stage}</b><p>{item.description}</p><small>{item.newWords.toLocaleString()} new · {item.cumulativeWords.toLocaleString()} cumulative words</small></button>; })}</div><p className="picker-note">New to Mandarin? Start at HSK 1. If you already study Chinese, use a level checkpoint and move down if the recall feels shaky.</p></div></div>}
      {ready && !showLevelPicker && !progress.onboarded && <div className="onboarding-backdrop" role="dialog" aria-modal="true" aria-labelledby="onboarding-title"><div className="onboarding-card"><span className="brand-mark">声</span><span className="section-kicker">YOUR FIRST TWO MINUTES</span><h2 id="onboarding-title">Set a pace you can repeat.</h2><p>You will not recall all {meta.newWords.toLocaleString()} words daily. Shēngtú gives you a small new set plus only the reviews that are due.</p><div className="goal-options">{[5, 8, 10].map((goal) => <button key={goal} className={onboardingGoal === goal ? "active" : ""} onClick={() => setOnboardingGoal(goal)}><strong>{goal}</strong><span>new words/day</span><small>{goal === 5 ? "gentle · ~27 min" : goal === 8 ? "recommended · ~33 min" : "fast · ~40 min"}</small></button>)}</div><ul><li>Pinyin fades automatically after three correct recalls; tap to reveal it anytime.</li><li>Every wrong answer enters the correction loop automatically.</li><li>Finish the six daily steps; stop when the mission checkpoint and corrections are done.</li></ul><button className="primary-button" onClick={startCourse}>Start my first lesson <span>→</span></button></div></div>}
      {toast && <div className="toast" role="status">{toast}</div>}
    </main>
  );
}
