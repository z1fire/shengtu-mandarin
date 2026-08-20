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
  daysBetween,
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

type PracticeMode = "flashcards" | "listening" | "builder" | "speaking";

const STORAGE_KEY = "shengtu-hsk1-progress";
const today = localDate();

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

export default function MandarinApp() {
  const [progress, setProgress] = useState<Progress>(() => makeStarterProgress(today));
  const [ready, setReady] = useState(false);
  const [onboardingGoal, setOnboardingGoal] = useState(8);
  const [practice, setPractice] = useState<PracticeMode>("flashcards");
  const [cardRevealed, setCardRevealed] = useState(false);
  const [search, setSearch] = useState("");
  const [showAllWords, setShowAllWords] = useState(false);
  const [showAllCharacters, setShowAllCharacters] = useState(false);
  const [grammarFilter, setGrammarFilter] = useState("All");
  const [showAllGrammar, setShowAllGrammar] = useState(false);
  const [grammarPractice, setGrammarPractice] = useState<number | null>(null);
  const [grammarOptions, setGrammarOptions] = useState<string[]>([]);
  const [grammarResult, setGrammarResult] = useState("");
  const [listenOrder] = useState(() => shuffle(listeningQuestions.map((_, index) => index)));
  const [listenPosition, setListenPosition] = useState(0);
  const activeListening = listeningQuestions[listenOrder[listenPosition] ?? 0];
  const [listenOptions, setListenOptions] = useState(() => shuffle(listeningQuestions[listenOrder[0] ?? 0].options));
  const [listenResult, setListenResult] = useState<string | null>(null);
  const [buildIndex, setBuildIndex] = useState(0);
  const [wordBank, setWordBank] = useState(() => shuffle(sentenceChallenges[0].tokens));
  const [built, setBuilt] = useState<string[]>([]);
  const [buildResult, setBuildResult] = useState<string | null>(null);
  const [pronunciationIndex, setPronunciationIndex] = useState(0);
  const [speechText, setSpeechText] = useState("Listen, shadow, then record the line.");
  const [speechScore, setSpeechScore] = useState<number | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [examStarted, setExamStarted] = useState(false);
  const [examIndex, setExamIndex] = useState(0);
  const [examAnswers, setExamAnswers] = useState<Record<string, string>>({});
  const [examOptions, setExamOptions] = useState<Record<string, string[]>>({});
  const [examRemaining, setExamRemaining] = useState(40 * 60);
  const [examResult, setExamResult] = useState<{ correct: number; score: number } | null>(null);
  const [toast, setToast] = useState("");
  const todayRef = useRef<HTMLElement>(null);
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
      setReady(true);
    }, 0);
    if ("serviceWorker" in navigator) navigator.serviceWorker.register(new URL("./sw.js", window.location.href).pathname).catch(() => undefined);
    return () => window.clearTimeout(timer);
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

  const filteredGrammar = grammarFilter === "All" ? grammarPoints : grammarPoints.filter((point) => point.group === grammarFilter);
  const visibleGrammar = showAllGrammar || grammarFilter !== "All" ? filteredGrammar : filteredGrammar.slice(0, 20);
  const visibleWords = showAllWords || search ? filteredWords : filteredWords.slice(0, 24);
  const dayPercent = Math.round((progress.daily.length / 4) * 100);
  const coursePercent = Math.round((progress.mastered.length / vocabulary.length) * 100);
  const activeWordIndex = progress.dailyQueue[progress.cardPosition];
  const activeWord = activeWordIndex === undefined ? null : vocabulary[activeWordIndex];
  const activeReview = activeWordIndex === undefined ? undefined : progress.reviews[activeWordIndex];
  const queuePercent = progress.dailyQueue.length ? Math.round((progress.cardPosition / progress.dailyQueue.length) * 100) : 100;
  const activeSentence = sentenceChallenges[buildIndex];
  const activePronunciation = pronunciationDrills[pronunciationIndex];
  const activeMission = missions[(Math.max(1, daysBetween(progress.startedAt, today) + 1) - 1) % missions.length];
  const courseDay = Math.max(1, daysBetween(progress.startedAt, today) + 1);
  const examQuestion = mockExamQuestions[examIndex];
  const examMinutes = String(Math.floor(examRemaining / 60)).padStart(2, "0");
  const examSeconds = String(examRemaining % 60).padStart(2, "0");

  const dailySteps = [
    { id: "review", mode: "flashcards" as const, time: 5, title: "Retrieval warm-up", detail: progress.dailyQueue.length ? `${progress.dailyQueue.length} scheduled words` : "Queue complete", accent: "coral" },
    { id: "listen", mode: "listening" as const, time: 7, title: "Ear training", detail: `${Math.min(progress.listeningDone.length, 5)}/5 meanings caught`, accent: "blue" },
    { id: "speak", mode: "speaking" as const, time: 8, title: "Pronunciation gym", detail: `${Math.min(progress.pronunciationDone.length, 3)}/3 drills completed`, accent: "jade" },
    { id: "build", mode: "builder" as const, time: 8, title: "Build from memory", detail: `${Math.min(progress.builderDone.length, 4)}/4 sentences built`, accent: "yellow" },
  ];

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function goToPractice(mode: PracticeMode) {
    setPractice(mode);
    window.setTimeout(() => todayRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
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
      if (done.length >= 5) next = completeDailyStep(next, "listen", 7, today);
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
      if (done.length >= 4) next = completeDailyStep(next, "build", 8, today);
      return next;
    });
    setToast("Sentence built · +10 XP");
  }

  function completePronunciation(message: string) {
    setProgress((current) => {
      const done = current.pronunciationDone.includes(activePronunciation.id) ? current.pronunciationDone : [...current.pronunciationDone, activePronunciation.id];
      let next = { ...current, pronunciationDone: done };
      next = earnOnce(next, `${today}:speak:${activePronunciation.id}`, 12, today);
      if (done.length >= 3) next = completeDailyStep(next, "speak", 8, today);
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

  function toggleMission(index: number) {
    setProgress((current) => {
      const done = current.missions.includes(index);
      let next = { ...current, missions: done ? current.missions.filter((item) => item !== index) : [...current.missions, index] };
      if (!done) next = earnOnce(next, `mission:${index}`, 25, today);
      return next;
    });
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
        <button className="brand" onClick={() => scrollTo("top")} aria-label="Shengtu home"><span className="brand-mark">声</span><span><strong>SHĒNGTÚ</strong><small>MANDARIN, IN MOTION</small></span></button>
        <nav className="nav-links" aria-label="Primary navigation"><button onClick={() => scrollTo("path")}>Path</button><button onClick={() => scrollTo("vocabulary")}>Words</button><button onClick={() => scrollTo("grammar")}>Grammar</button><button onClick={() => scrollTo("exam")}>Mock exam</button><button onClick={() => scrollTo("progress")}>Progress</button></nav>
        <div className="header-actions"><span className="streak-pill"><span>火</span> {progress.streak} day streak</span><button className="round-button" onClick={() => setProgress((current) => ({ ...current, showPinyin: !current.showPinyin }))} title="Toggle pinyin">{progress.showPinyin ? "PĪN" : "汉"}</button></div>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <div className="eyebrow"><span>HSK 3.0</span> LEVEL 1 · CURRENT SYLLABUS</div>
          <h1>Stop studying Mandarin.<br /><em>Start using it.</em></h1>
          <p className="hero-lede">A guided, speaking-first HSK 1 course that schedules the right words each day—never all 300 at once.</p>
          <div className="hero-actions"><button className="primary-button" onClick={() => goToPractice("flashcards")}>Continue today’s lesson <span>→</span></button><button className="text-button" onClick={() => scrollTo("path")}><span className="play-dot">▶</span> See the 6-week path</button></div>
          <div className="hero-proof"><div><strong>300</strong><span>core words</span></div><div><strong>246</strong><span>recognition characters</span></div><div><strong>70</strong><span>grammar targets</span></div><div><strong>40m</strong><span>full mock exam</span></div></div>
        </div>

        <aside className="today-card" aria-label="Today’s lesson plan">
          <div className="today-card-head"><div><span className="micro-label">DAY {String(courseDay).padStart(2, "0")} · GUIDED SESSION</span><h2>{activeMission.title}</h2></div><div className="progress-orb" style={{ "--progress": `${dayPercent * 3.6}deg` } as React.CSSProperties}><span>{dayPercent}%</span></div></div>
          <button className="phrase-card" onClick={() => speak(activeMission.phrase)} aria-label="Play today’s phrase"><span className="sound-button">▶</span><span><strong>{activeMission.phrase}</strong>{progress.showPinyin && <small>{activeMission.pinyin}</small>}<em>{activeMission.translation}</em></span></button>
          <div className="task-list">
            {dailySteps.map((step) => { const done = progress.daily.includes(step.id); return <button key={step.id} className={`task-row ${done ? "done" : ""}`} onClick={() => goToPractice(step.mode)}><span className={`task-time ${step.accent}`}>{done ? "✓" : String(step.time).padStart(2, "0")}</span><span><strong>{step.title}</strong><small>{step.detail}</small></span><span className="task-arrow">{done ? "DONE" : "START →"}</span></button>; })}
          </div>
          <div className="today-foot"><span>28 focused minutes</span><span>{progress.daily.length}/4 complete</span></div>
        </aside>
      </section>

      <section className="method-strip" aria-label="Learning method"><span className="strip-title">THE FAST-FLUENCY LOOP</span><div><b>01</b><span>Notice<small>meaning first</small></span></div><span className="strip-arrow">→</span><div><b>02</b><span>Hear<small>Mandarin model</small></span></div><span className="strip-arrow">→</span><div><b>03</b><span>Say<small>out loud</small></span></div><span className="strip-arrow">→</span><div><b>04</b><span>Recall<small>on schedule</small></span></div></section>

      <section className="section practice-section" id="practice" ref={todayRef}>
        <div className="section-heading two-column-heading"><div><span className="section-kicker">TODAY’S GUIDED LESSON</span><h2>Train the skill,<br /><em>not the illusion.</em></h2></div><p>Complete each target once. The checklist updates automatically, rewards cannot be farmed, and difficult material returns sooner.</p></div>
        <div className="practice-tabs" role="tablist" aria-label="Practice modes">{([ ["flashcards", "01", "Recall"], ["listening", "02", "Listening"], ["builder", "03", "Sentence lab"], ["speaking", "04", "Pronunciation"] ] as [PracticeMode, string, string][]).map(([mode, number, label]) => <button key={mode} className={practice === mode ? "active" : ""} onClick={() => setPractice(mode)} role="tab" aria-selected={practice === mode}><span>{number}</span>{label}</button>)}</div>

        <div className="practice-stage">
          {practice === "flashcards" && (
            <div className="flashcard-lab">
              <div className="lab-instructions"><span className="micro-label">SPACED RECALL · {Math.min(progress.cardPosition + 1, progress.dailyQueue.length)} / {progress.dailyQueue.length}</span><h3>Say it before you flip it.</h3><p>Today mixes up to {progress.dailyNew} new words with reviews that are actually due. Grade your recall honestly; the next date changes with every answer.</p><div className="lab-progress"><span style={{ width: `${queuePercent}%` }} /></div></div>
              {activeWord ? <><div className={`study-card ${cardRevealed ? "revealed" : ""}`}><button className="card-face-button" onClick={() => setCardRevealed((value) => !value)} aria-label="Flip vocabulary card">{!cardRevealed ? <><span className="card-caption">SAY IN MANDARIN</span><strong className="english-prompt">{activeWord.meaning}</strong><span className="flip-hint">Tap to reveal ↗</span></> : <><span className="card-caption">LISTEN & SHADOW</span><strong className="hanzi-prompt">{activeWord.hanzi}</strong>{progress.showPinyin && <span className="pinyin-prompt">{activeWord.pinyin}</span>}<span className="card-example">{activeWord.example}</span></>}</button>{cardRevealed && <button className="audio-link" onClick={() => speak(activeWord.hanzi)}>▶ Play Mandarin</button>}</div><div className="confidence-buttons four"><button onClick={() => gradeCard("again")}>Again <small>1 min</small></button><button onClick={() => gradeCard("hard")}>Hard <small>{dueLabel("hard", activeReview?.intervalDays ?? 0)}</small></button><button onClick={() => gradeCard("good")}>Good <small>{dueLabel("good", activeReview?.intervalDays ?? 0)}</small></button><button onClick={() => gradeCard("easy")}>Easy <small>{dueLabel("easy", activeReview?.intervalDays ?? 0)}</small></button></div></> : <div className="queue-complete"><span>好</span><h3>Today’s recall is complete.</h3><p>No need to review all 300. Come back tomorrow for newly due cards and {progress.dailyNew} new words.</p><button className="primary-button" onClick={() => goToPractice("listening")}>Continue to listening <span>→</span></button></div>}
            </div>
          )}

          {practice === "listening" && <div className="listening-lab"><div className="lab-instructions"><span className="micro-label">MEANING-FIRST LISTENING · {listenPosition + 1} / {listeningQuestions.length}</span><h3>Catch the message.</h3><p>Play the line and choose the meaning before you see characters or pinyin. Five unique correct answers complete today’s target.</p><button className="big-listen-button" onClick={() => speak(activeListening.prompt)}><span>▶</span> Play Mandarin</button><button className="slow-link" onClick={() => speak(activeListening.prompt, 0.62)}>Play slower</button></div><div className="answer-stack">{listenOptions.map((option, index) => <button key={option} onClick={() => answerListening(option)} disabled={listenResult?.startsWith("Correct")}><span>{String.fromCharCode(65 + index)}</span>{option}</button>)}{listenResult && <div className={`result-note ${listenResult.startsWith("Correct") ? "correct" : ""}`}>{listenResult}<button onClick={nextListening}>Next →</button></div>}</div></div>}

          {practice === "builder" && <div className="builder-lab"><div className="lab-instructions"><span className="micro-label">SENTENCE LAB · {buildIndex + 1} / {sentenceChallenges.length}</span><h3>Build the thought.</h3><p>{activeSentence.translation} Put the Mandarin into its natural order. Tap a placed token to move only that token back.</p></div><div className="builder-board"><div className="sentence-line">{built.length ? built.map((token, index) => <button key={`${token}-${index}`} onClick={() => removeToken(token, index)}>{token}</button>) : <span>Tap words below to build the sentence…</span>}</div><div className="word-bank">{wordBank.map((token, index) => <button key={`${token}-${index}`} onClick={() => addToken(token, index)}>{token}</button>)}</div><div className="builder-actions"><button onClick={() => resetBuilder()}>Reset</button><button className="check-button" onClick={checkBuilder} disabled={!built.length}>Check sentence</button></div>{buildResult && <div className={`result-note ${buildResult.startsWith("Correct") ? "correct" : ""}`}>{buildResult}<button onClick={() => resetBuilder(true)}>Next →</button></div>}</div></div>}

          {practice === "speaking" && <div className="speaking-lab pronunciation-lab"><div className="lab-instructions"><span className="micro-label">TONE & SOUND GYM · {pronunciationIndex + 1} / {pronunciationDrills.length}</span><h3>Train the sound, not just the word.</h3><p>{activePronunciation.cue}</p><div className="tone-map" aria-label="Mandarin tone contours"><span>1 ˉ<small>high</small></span><span>2 ˊ<small>rise</small></span><span>3 ˇ<small>dip</small></span><span>4 ˋ<small>fall</small></span><span>·<small>light</small></span></div></div><div><div className="pronunciation-picker">{pronunciationDrills.map((drill, index) => <button key={drill.id} className={index === pronunciationIndex ? "active" : ""} onClick={() => { setPronunciationIndex(index); setSpeechScore(null); setSpeechText("Listen, shadow, then record the line."); }}>{drill.focus}</button>)}</div><div className="speech-console"><button className="speaker-orb" onClick={() => speak(activePronunciation.hanzi, 0.7)} aria-label="Play phrase">声<span>▶ MODEL</span></button><strong>{activePronunciation.hanzi}</strong>{progress.showPinyin && <p>{activePronunciation.pinyin}</p>}<button className={`record-button ${isListening ? "recording" : ""}`} onClick={startSpeechCheck}><span>●</span>{isListening ? "Listening…" : "Record my line"}</button><div className="speech-feedback">{speechText}</div>{speechScore !== null && <div className="speech-meter"><i style={{ width: `${speechScore}%` }} /></div>}<div className="self-checks"><button onClick={() => completePronunciation("Pronunciation drill recorded · +12 XP")}>Tone contour felt accurate</button><button onClick={() => { setSpeechText("Replay slowly and exaggerate the contour once, then repeat naturally."); speak(activePronunciation.hanzi, 0.58); }}>Needs another round</button></div><small className="speech-honesty">Browser recognition checks the words, not pitch. Use the tone cue and an honest self-check.</small></div></div></div>}
        </div>
      </section>

      <section className="section path-section" id="path"><div className="section-heading path-heading"><div><span className="section-kicker">YOUR 6-WEEK ROUTE</span><h2>Twelve real-life<br /><em>missions.</em></h2></div><div className="route-summary"><strong>{progress.missions.length}/12</strong><span>missions complete</span><div><i style={{ width: `${(progress.missions.length / missions.length) * 100}%` }} /></div></div></div><div className="mission-grid">{missions.map((mission, index) => { const done = progress.missions.includes(index); return <article key={mission.title} className={`mission-card ${done ? "complete" : ""}`}><div className="mission-top"><span>W{mission.week} · {String(index + 1).padStart(2, "0")}</span><button onClick={() => toggleMission(index)}>{done ? "✓ DONE" : "+ MARK"}</button></div><h3>{mission.title}</h3><p>{mission.subtitle}</p><div className="mission-words">{mission.words}</div><button className="mission-phrase" onClick={() => speak(mission.phrase)}><span>▶</span><strong>{mission.phrase}</strong>{progress.showPinyin && <small>{mission.pinyin}</small>}</button></article>; })}</div></section>

      <section className="section vocabulary-section" id="vocabulary"><div className="section-heading vocabulary-heading"><div><span className="section-kicker">COMPLETE HSK 1 WORD BANK</span><h2>All 300 words.<br /><em>With context.</em></h2></div><div className="vocab-tools"><label><span>⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search 汉字, pinyin, English, or examples" aria-label="Search vocabulary" /></label><button onClick={() => setProgress((current) => ({ ...current, showPinyin: !current.showPinyin }))}>{progress.showPinyin ? "Hide pinyin" : "Show pinyin"}</button></div></div><div className="vocab-status"><span><b>{progress.mastered.length}</b> stable words</span><div><i style={{ width: `${coursePercent}%` }} /></div><span>{coursePercent}%</span></div><div className="word-grid">{visibleWords.map((word) => { const originalIndex = vocabulary.indexOf(word); const mastered = progress.mastered.includes(originalIndex); const learned = Boolean(progress.reviews[originalIndex]); return <article key={`${word.hanzi}-${originalIndex}`} className={mastered ? "mastered" : ""}><button className="word-audio" onClick={() => speak(word.hanzi)} aria-label={`Play ${word.hanzi}`}>▶</button><strong>{word.hanzi}</strong>{progress.showPinyin && <span>{word.pinyin}</span>}<p>{word.meaning}</p><div className="word-context"><b>{word.example}</b><small>{word.collocation}</small>{word.note && <em>{word.note}</em>}</div><button className="master-button" onClick={() => studyWord(originalIndex)}>{mastered ? "✓ Stable · review now" : learned ? "Learning · review now" : "+ Add to today"}</button></article>; })}</div>{!search && <button className="load-more" onClick={() => setShowAllWords((value) => !value)}>{showAllWords ? "Show the focused set" : `Explore all ${vocabulary.length} words`} <span>↓</span></button>}<div className="character-bank"><div><span className="section-kicker">CHARACTER RECOGNITION</span><h3>Recognize all 246.</h3><p>HSK 1 tests listening and reading—not handwriting. Tap a character to hear a syllabus word that uses it.</p></div><div className="character-grid">{(showAllCharacters ? recognitionCharacters : recognitionCharacters.slice(0, 80)).map((character, index) => { const sample = vocabulary.find((word) => word.hanzi.includes(character)); return <button key={`${character}-${index}`} onClick={() => speak(sample?.hanzi ?? character)} title={sample ? `${sample.hanzi} · ${sample.meaning}` : character}>{character}</button>; })}<button className="character-more" onClick={() => setShowAllCharacters((value) => !value)}>{showAllCharacters ? "−" : `+${recognitionCharacters.length - 80}`}</button></div></div></section>

      <section className="section grammar-section" id="grammar"><div className="section-heading grammar-heading"><div><span className="section-kicker">ALL 70 GRAMMAR TARGETS</span><h2>Patterns you can<br /><em>retrieve today.</em></h2></div><p>Every target has a usable frame, syllabus-level example, audio, and a meaning-to-Mandarin recall check.</p></div><div className="filter-row">{["All", "Core", "Questions", "Time", "Place", "Actions"].map((filter) => <button key={filter} className={grammarFilter === filter ? "active" : ""} onClick={() => { setGrammarFilter(filter); setShowAllGrammar(filter !== "All"); }}>{filter}</button>)}</div>{grammarPractice !== null && <div className="grammar-drill"><button className="close-drill" onClick={() => setGrammarPractice(null)} aria-label="Close grammar practice">×</button><span className="micro-label">RECALL CHECK · TARGET {grammarPractice + 1}</span><h3>Which Mandarin sentence means “{grammarPoints[grammarPractice].translation}”?</h3><div>{grammarOptions.map((option) => <button key={option} onClick={() => answerGrammar(option)}>{option}</button>)}</div>{grammarResult && <p className={grammarResult.startsWith("Correct") ? "correct" : ""}>{grammarResult}</p>}</div>}<div className="grammar-grid">{visibleGrammar.map((point) => { const globalIndex = grammarPoints.indexOf(point); return <article key={`${point.title}-${globalIndex}`}><div className="grammar-card-top"><span>{String(globalIndex + 1).padStart(2, "0")} · {point.label}</span><button onClick={() => speak(point.example)}>▶</button></div><h3>{point.title}</h3><code>{point.formula}</code><div className="grammar-example"><strong>{point.example}</strong>{progress.showPinyin && <span>{point.pinyin}</span>}<small>{point.translation}</small></div><button className="grammar-practice-button" onClick={() => openGrammarPractice(globalIndex)}>Practice this target →</button></article>; })}</div>{grammarFilter === "All" && <button className="grammar-more" onClick={() => setShowAllGrammar((value) => !value)}>{showAllGrammar ? "Show the 20 essential targets" : `Show all ${grammarPoints.length} targets`}</button>}</section>

      <section className="section exam-section" id="exam">
        {!examStarted ? <><div className="exam-card"><div className="exam-copy"><span className="section-kicker light">HSK 3.0 · LEVEL 1 PRACTICE MOCK</span><h2>Know the test.<br /><em>Train beyond it.</em></h2><p>Run a complete 40-question simulation: 20 listening and 20 reading questions in 40 minutes, followed by scoring and wrong-answer explanations.</p><button className="exam-start" onClick={startMockExam}>Start the 40-minute mock →</button><a href="https://www.chinesetest.cn/syllabus" target="_blank" rel="noreferrer">View official HSK 3.0 resources ↗</a></div><div className="exam-structure"><div><span>01</span><strong>Listening</strong><b>20</b><small>questions · play each prompt</small></div><div><span>02</span><strong>Reading</strong><b>20</b><small>questions · meaning and patterns</small></div><div className="exam-total"><span>TOTAL</span><strong>40 questions</strong><b>40 min</b></div></div></div><p className="rollout-note"><strong>Before you register</strong> HSK 3.0 is the current syllabus, but test availability and administration can vary by center. Confirm the format with your chosen test center.</p></> : <div className="mock-shell">{!examResult ? <><div className="mock-top"><div><span className="micro-label">{examQuestion.section.toUpperCase()} · {examIndex + 1} / 40</span><div className="mock-progress"><i style={{ width: `${((examIndex + 1) / 40) * 100}%` }} /></div></div><strong>{examMinutes}:{examSeconds}</strong></div><div className="mock-question">{examQuestion.section === "Listening" ? <><button className="big-listen-button" onClick={() => speak(examQuestion.prompt)}><span>▶</span> Play question</button><p>Choose the meaning you hear.</p></> : <><strong lang="zh-CN">{examQuestion.prompt}</strong><p>Choose the best meaning.</p></>}<div className="mock-options">{(examOptions[examQuestion.id] ?? examQuestion.options).map((option, index) => <button key={option} className={examAnswers[examQuestion.id] === option ? "selected" : ""} onClick={() => setExamAnswers((current) => ({ ...current, [examQuestion.id]: option }))}><span>{String.fromCharCode(65 + index)}</span>{option}</button>)}</div></div><div className="mock-actions"><button onClick={() => setExamIndex((index) => Math.max(0, index - 1))} disabled={examIndex === 0}>← Previous</button>{examIndex < 39 ? <button onClick={() => setExamIndex((index) => index + 1)}>Next →</button> : <button onClick={finishExam}>Submit mock</button>}</div></> : <div className="mock-results"><span className="result-ring">{examResult.score}%</span><h2>{examResult.correct}/40 correct</h2><p>{examResult.score >= 80 ? "Strong result. Review the misses, then keep training speaking beyond the test." : examResult.score >= 60 ? "Foundation reached. Review every miss before your next attempt." : "Keep building the daily loop, then retry after more scheduled review."}</p><h3>Wrong-answer review</h3><div className="wrong-list">{mockExamQuestions.filter((question) => examAnswers[question.id] !== question.answer).map((question) => <article key={question.id}><span>{question.section} · {question.id.toUpperCase()}</span><strong>{question.prompt}</strong><p>Your answer: {examAnswers[question.id] ?? "No answer"}</p><p>Correct: {question.answer}</p><small>{question.explanation}</small></article>)}</div><button className="primary-button" onClick={startMockExam}>Try a fresh attempt <span>→</span></button></div>}</div>}
      </section>

      <section className="section progress-section" id="progress"><div className="section-heading progress-heading"><div><span className="section-kicker">YOUR MOMENTUM</span><h2>Small proof,<br /><em>every day.</em></h2></div><div className="progress-tools"><button onClick={exportProgress}>Export backup</button><button onClick={() => importRef.current?.click()}>Import backup</button><button className="danger-link" onClick={resetProgress}>Reset</button><input ref={importRef} type="file" accept="application/json" onChange={(event) => void importProgress(event.target.files?.[0])} hidden /></div></div><div className="stat-grid"><article className="stat-card coral"><span>火</span><strong>{progress.streak}</strong><p>day streak</p><small>Counts practice days, not visits.</small></article><article className="stat-card jade"><span>字</span><strong>{progress.mastered.length}</strong><p>stable words</p><small>Earned after repeated successful reviews.</small></article><article className="stat-card blue"><span>时</span><strong>{progress.minutes}</strong><p>minutes trained</p><small>Uses each task’s real target time.</small></article><article className="stat-card yellow"><span>光</span><strong>{progress.xp}</strong><p>practice XP</p><small>Every reward can be earned only once.</small></article></div><div className="backup-note"><strong>Your progress is protected.</strong><span>It saves automatically on this device. Export a backup before clearing browser data or moving to another device. The app shell also works offline after your first visit.</span></div><div className="level-roadmap"><div><span className="section-kicker">THE LONG GAME</span><h3>HSK 1 is the launchpad—not fluency.</h3><p>Finish this foundation, then keep the same speak-first loop through every level.</p></div><ol>{[1, 2, 3, 4, 5, 6, "7–9"].map((level, index) => <li key={String(level)} className={index === 0 ? "current" : "locked"}><span>{index === 0 ? "NOW" : "LOCKED"}</span><strong>HSK {level}</strong><small>{index === 0 ? "Daily life basics" : index < 3 ? "Everyday independence" : index < 6 ? "Work & study fluency" : "Professional mastery"}</small></li>)}</ol></div></section>

      <footer><div className="footer-brand"><span className="brand-mark">声</span><div><strong>SHĒNGTÚ</strong><p>Hear it. Say it. Own it.</p></div></div><div><span>CURRICULUM</span><a href="#path">6-week path</a><a href="#vocabulary">300 words</a><a href="#grammar">70 grammar targets</a><a href="#exam">Full mock exam</a></div><div><span>SOURCES</span><a href="https://www.chinesetest.cn/syllabus" target="_blank" rel="noreferrer">Official HSK 3.0</a><a href="https://hsk.cn-bj.ufileos.com/3.0/%E6%96%B0%E7%89%88HSK%E8%80%83%E8%AF%95%E5%A4%A7%E7%BA%B2%EF%BC%88%E8%AF%8D%E6%B1%87%E3%80%81%E6%B1%89%E5%AD%97%E3%80%81%E8%AF%AD%E6%B3%95%EF%BC%89.pdf" target="_blank" rel="noreferrer">2025 syllabus PDF</a></div><p className="footer-note">Independent learning tool. Not affiliated with Chinese Test International. Installable and offline-ready; progress stays on your device unless you export it.</p></footer>

      {ready && !progress.onboarded && <div className="onboarding-backdrop" role="dialog" aria-modal="true" aria-labelledby="onboarding-title"><div className="onboarding-card"><span className="brand-mark">声</span><span className="section-kicker">YOUR FIRST TWO MINUTES</span><h2 id="onboarding-title">Set a pace you can repeat.</h2><p>You will not recall all 300 words daily. Shēngtú gives you a small new set plus only the reviews that are due.</p><div className="goal-options">{[5, 8, 10].map((goal) => <button key={goal} className={onboardingGoal === goal ? "active" : ""} onClick={() => setOnboardingGoal(goal)}><strong>{goal}</strong><span>new words/day</span><small>{goal === 5 ? "gentle · ~22 min" : goal === 8 ? "recommended · ~28 min" : "fast · ~35 min"}</small></button>)}</div><ul><li>Keep pinyin on for the first 1–2 weeks, then toggle it off.</li><li>Say every answer before revealing it.</li><li>Finish the four daily targets; stop when the queue is done.</li></ul><button className="primary-button" onClick={startCourse}>Start my first lesson <span>→</span></button></div></div>}
      {toast && <div className="toast" role="status">{toast}</div>}
    </main>
  );
}
