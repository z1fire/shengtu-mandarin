"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  grammarPoints,
  listeningQuestions,
  missions,
  recognitionCharacters,
  sentenceChallenges,
  vocabulary,
} from "./hsk-data";
import "./mandarin.css";

type PracticeMode = "flashcards" | "listening" | "builder" | "speaking";

type Progress = {
  streak: number;
  xp: number;
  minutes: number;
  mastered: number[];
  missions: number[];
  daily: string[];
  lastVisit: string;
};

const today = new Date().toISOString().slice(0, 10);
const starterProgress: Progress = {
  streak: 1,
  xp: 0,
  minutes: 0,
  mastered: [],
  missions: [],
  daily: [],
  lastVisit: today,
};

const dailySteps = [
  { id: "review", time: "05", title: "Retrieval warm-up", detail: "Review 10 due words", accent: "coral" },
  { id: "listen", time: "07", title: "Ear training", detail: "5 meaning-first clips", accent: "blue" },
  { id: "speak", time: "08", title: "Speak out loud", detail: "Shadow today’s dialogue", accent: "jade" },
  { id: "build", time: "08", title: "Build from memory", detail: "4 sentence challenges", accent: "yellow" },
];

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

function shuffle<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

export default function MandarinApp() {
  const [progress, setProgress] = useState<Progress>(starterProgress);
  const [ready, setReady] = useState(false);
  const [practice, setPractice] = useState<PracticeMode>("flashcards");
  const [cardIndex, setCardIndex] = useState(0);
  const [cardRevealed, setCardRevealed] = useState(false);
  const [showPinyin, setShowPinyin] = useState(true);
  const [search, setSearch] = useState("");
  const [showAllWords, setShowAllWords] = useState(false);
  const [showAllCharacters, setShowAllCharacters] = useState(false);
  const [grammarFilter, setGrammarFilter] = useState("All");
  const [listenIndex, setListenIndex] = useState(0);
  const [listenResult, setListenResult] = useState<string | null>(null);
  const [buildIndex, setBuildIndex] = useState(0);
  const [wordBank, setWordBank] = useState(() => shuffle(sentenceChallenges[0].tokens));
  const [built, setBuilt] = useState<string[]>([]);
  const [buildResult, setBuildResult] = useState<string | null>(null);
  const [speechText, setSpeechText] = useState("Press record, then say the line.");
  const [isListening, setIsListening] = useState(false);
  const [toast, setToast] = useState("");
  const todayRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const stored = window.localStorage.getItem("shengtu-hsk1-progress");
        if (stored) {
          const parsed = JSON.parse(stored) as Progress;
          const nextStreak = parsed.lastVisit !== today ? parsed.streak + 1 : parsed.streak;
          setProgress({ ...starterProgress, ...parsed, streak: nextStreak, lastVisit: today });
        }
      } catch {
        setProgress(starterProgress);
      }
      setReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem("shengtu-hsk1-progress", JSON.stringify(progress));
  }, [progress, ready]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const filteredWords = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return vocabulary;
    return vocabulary.filter((word) =>
      `${word.hanzi} ${word.pinyin} ${word.meaning}`.toLowerCase().includes(query),
    );
  }, [search]);

  const visibleWords = showAllWords || search ? filteredWords : filteredWords.slice(0, 24);
  const filteredGrammar = grammarFilter === "All" ? grammarPoints : grammarPoints.filter((point) => point.group === grammarFilter);
  const dayPercent = Math.round((progress.daily.length / dailySteps.length) * 100);
  const coursePercent = Math.round((progress.mastered.length / vocabulary.length) * 100);
  const activeWord = vocabulary[cardIndex];
  const activeSentence = sentenceChallenges[buildIndex];

  function award(xp: number, message: string) {
    setProgress((current) => ({ ...current, xp: current.xp + xp }));
    setToast(message);
  }

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function toggleDaily(id: string) {
    setProgress((current) => {
      const done = current.daily.includes(id);
      return {
        ...current,
        daily: done ? current.daily.filter((item) => item !== id) : [...current.daily, id],
        minutes: done ? Math.max(0, current.minutes - 7) : current.minutes + 7,
        xp: done ? current.xp : current.xp + 10,
      };
    });
  }

  function chooseCardConfidence(known: boolean) {
    if (known && !progress.mastered.includes(cardIndex)) {
      setProgress((current) => ({ ...current, mastered: [...current.mastered, cardIndex], xp: current.xp + 5 }));
      setToast("Word moved into long-term review +5 XP");
    }
    setCardIndex((current) => (current + 1) % vocabulary.length);
    setCardRevealed(false);
  }

  function toggleMastered(index: number) {
    setProgress((current) => ({
      ...current,
      mastered: current.mastered.includes(index)
        ? current.mastered.filter((item) => item !== index)
        : [...current.mastered, index],
    }));
  }

  function nextListening() {
    setListenIndex((current) => (current + 1) % listeningQuestions.length);
    setListenResult(null);
  }

  function answerListening(answer: string) {
    const correct = answer === listeningQuestions[listenIndex].answer;
    setListenResult(correct ? "Correct — meaning caught." : "Not yet. Replay and listen for the key words.");
    if (correct) award(8, "Listening win +8 XP");
  }

  function addToken(token: string, index: number) {
    setBuilt((current) => [...current, token]);
    setWordBank((current) => current.filter((_, itemIndex) => itemIndex !== index));
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
    setBuildResult(correct ? `Correct — ${activeSentence.translation}` : "Almost. Reset and rebuild the idea, not the English order.");
    if (correct) award(10, "Sentence built +10 XP");
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
    const SpeechRecognitionCtor = (window as unknown as { webkitSpeechRecognition?: new () => RecognitionLike }).webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      setSpeechText("Speech recognition is not available here. Shadow the audio three times, then mark it complete.");
      speak(missions[0].phrase, 0.72);
      return;
    }
    const recognition = new SpeechRecognitionCtor();
    recognition.lang = "zh-CN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const speechEvent = event as { results: { [key: number]: { [key: number]: { transcript: string } } } };
      const transcript = speechEvent.results[0][0].transcript;
      setSpeechText(`Heard: ${transcript}`);
      if (transcript.includes("你好") || transcript.includes("我叫")) award(12, "Pronunciation captured +12 XP");
    };
    recognition.onerror = () => setSpeechText("I couldn’t hear that clearly. Try again a little closer to the microphone.");
    recognition.onend = () => setIsListening(false);
    setSpeechText("Listening… say: 你好，我叫安娜。你呢？");
    setIsListening(true);
    recognition.start();
  }

  return (
    <main className="site-shell">
      <header className="topbar">
        <button className="brand" onClick={() => scrollTo("top")} aria-label="Shengtu home">
          <span className="brand-mark">声</span>
          <span><strong>SHĒNGTÚ</strong><small>MANDARIN, IN MOTION</small></span>
        </button>
        <nav className="nav-links" aria-label="Primary navigation">
          <button onClick={() => scrollTo("path")}>Path</button>
          <button onClick={() => scrollTo("vocabulary")}>Words</button>
          <button onClick={() => scrollTo("grammar")}>Grammar</button>
          <button onClick={() => scrollTo("progress")}>Progress</button>
        </nav>
        <div className="header-actions">
          <span className="streak-pill"><span>火</span> {progress.streak} day streak</span>
          <button className="round-button" onClick={() => setShowPinyin((value) => !value)} title="Toggle pinyin">{showPinyin ? "PĪN" : "汉"}</button>
        </div>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <div className="eyebrow"><span>HSK 3.0</span> LEVEL 1 · 2025 SYLLABUS</div>
          <h1>Stop studying Mandarin.<br /><em>Start using it.</em></h1>
          <p className="hero-lede">A speaking-first HSK 1 sprint that turns 300 words into conversations you can actually have.</p>
          <div className="hero-actions">
            <button className="primary-button" onClick={() => todayRef.current?.scrollIntoView({ behavior: "smooth" })}>Start today’s session <span>→</span></button>
            <button className="text-button" onClick={() => scrollTo("path")}><span className="play-dot">▶</span> See the 6-week path</button>
          </div>
          <div className="hero-proof">
            <div><strong>300</strong><span>core words</span></div>
            <div><strong>246</strong><span>recognition characters</span></div>
            <div><strong>70</strong><span>grammar targets</span></div>
            <div><strong>40m</strong><span>exam format</span></div>
          </div>
        </div>

        <aside className="today-card" aria-label="Today’s lesson plan">
          <div className="today-card-head">
            <div>
              <span className="micro-label">DAY 01 · FOUNDATION</span>
              <h2>Make first contact</h2>
            </div>
            <div className="progress-orb" style={{ "--progress": `${dayPercent * 3.6}deg` } as React.CSSProperties}>
              <span>{dayPercent}%</span>
            </div>
          </div>
          <button className="phrase-card" onClick={() => speak("你好，我叫安娜。你呢？")} aria-label="Play today’s phrase">
            <span className="sound-button">▶</span>
            <span>
              <strong>你好，我叫安娜。你呢？</strong>
              {showPinyin && <small>Nǐ hǎo, wǒ jiào Ānnà. Nǐ ne?</small>}
              <em>Hi, I’m Anna. And you?</em>
            </span>
          </button>
          <div className="task-list">
            {dailySteps.map((step) => {
              const done = progress.daily.includes(step.id);
              return (
                <button key={step.id} className={`task-row ${done ? "done" : ""}`} onClick={() => toggleDaily(step.id)}>
                  <span className={`task-time ${step.accent}`}>{done ? "✓" : step.time}</span>
                  <span><strong>{step.title}</strong><small>{step.detail}</small></span>
                  <span className="task-arrow">{done ? "DONE" : "→"}</span>
                </button>
              );
            })}
          </div>
          <div className="today-foot"><span>About 28 minutes</span><span>{progress.daily.length}/4 complete</span></div>
        </aside>
      </section>

      <section className="method-strip" aria-label="Learning method">
        <span className="strip-title">THE FAST-FLUENCY LOOP</span>
        <div><b>01</b><span>Notice<small>meaning first</small></span></div>
        <span className="strip-arrow">→</span>
        <div><b>02</b><span>Hear<small>natural audio</small></span></div>
        <span className="strip-arrow">→</span>
        <div><b>03</b><span>Say<small>out loud</small></span></div>
        <span className="strip-arrow">→</span>
        <div><b>04</b><span>Recall<small>without hints</small></span></div>
      </section>

      <section className="section practice-section" id="practice" ref={todayRef}>
        <div className="section-heading two-column-heading">
          <div>
            <span className="section-kicker">TODAY’S PRACTICE LAB</span>
            <h2>Train the skill,<br /><em>not the illusion.</em></h2>
          </div>
          <p>Recognition feels easy. Recall builds fluency. Every drill here makes you produce or understand Mandarin before seeing the answer.</p>
        </div>

        <div className="practice-tabs" role="tablist" aria-label="Practice modes">
          {([
            ["flashcards", "01", "Recall"],
            ["listening", "02", "Listening"],
            ["builder", "03", "Sentence lab"],
            ["speaking", "04", "Speaking"],
          ] as [PracticeMode, string, string][]).map(([mode, number, label]) => (
            <button key={mode} className={practice === mode ? "active" : ""} onClick={() => setPractice(mode)} role="tab" aria-selected={practice === mode}>
              <span>{number}</span>{label}
            </button>
          ))}
        </div>

        <div className="practice-stage">
          {practice === "flashcards" && (
            <div className="flashcard-lab">
              <div className="lab-instructions">
                <span className="micro-label">ACTIVE RECALL · CARD {cardIndex + 1} / 300</span>
                <h3>Say it before you flip it.</h3>
                <p>Read the meaning. Produce the Mandarin aloud. Then reveal and grade honestly.</p>
                <div className="lab-progress"><span style={{ width: `${((cardIndex + 1) / vocabulary.length) * 100}%` }} /></div>
              </div>
              <div className={`study-card ${cardRevealed ? "revealed" : ""}`}>
                <button className="card-face-button" onClick={() => setCardRevealed((value) => !value)} aria-label="Flip vocabulary card">
                  {!cardRevealed ? (
                    <><span className="card-caption">SAY IN MANDARIN</span><strong className="english-prompt">{activeWord.meaning}</strong><span className="flip-hint">Tap to reveal ↗</span></>
                  ) : (
                    <><span className="card-caption">LISTEN & SHADOW</span><strong className="hanzi-prompt">{activeWord.hanzi}</strong>{showPinyin && <span className="pinyin-prompt">{activeWord.pinyin}</span>}</>
                  )}
                </button>
                {cardRevealed && <button className="audio-link" onClick={() => speak(activeWord.hanzi)}>▶ Play audio</button>}
              </div>
              <div className="confidence-buttons">
                <button onClick={() => chooseCardConfidence(false)}>Again <small>1 min</small></button>
                <button onClick={() => chooseCardConfidence(true)}>Got it <small>tomorrow</small></button>
              </div>
            </div>
          )}

          {practice === "listening" && (
            <div className="listening-lab">
              <div className="lab-instructions">
                <span className="micro-label">MEANING-FIRST LISTENING · {listenIndex + 1} / {listeningQuestions.length}</span>
                <h3>Catch the message.</h3>
                <p>Play the line. Choose the meaning without seeing characters or pinyin.</p>
                <button className="big-listen-button" onClick={() => speak(listeningQuestions[listenIndex].prompt)}><span>▶</span> Play Mandarin</button>
                <button className="slow-link" onClick={() => speak(listeningQuestions[listenIndex].prompt, 0.62)}>Play slower</button>
              </div>
              <div className="answer-stack">
                {listeningQuestions[listenIndex].options.map((option, index) => (
                  <button key={option} onClick={() => answerListening(option)} disabled={listenResult?.startsWith("Correct")}><span>{String.fromCharCode(65 + index)}</span>{option}</button>
                ))}
                {listenResult && <div className={`result-note ${listenResult.startsWith("Correct") ? "correct" : ""}`}>{listenResult}<button onClick={nextListening}>Next →</button></div>}
              </div>
            </div>
          )}

          {practice === "builder" && (
            <div className="builder-lab">
              <div className="lab-instructions">
                <span className="micro-label">SENTENCE LAB · {buildIndex + 1} / {sentenceChallenges.length}</span>
                <h3>Build the thought.</h3>
                <p>{activeSentence.translation} Put the Mandarin into its natural order.</p>
              </div>
              <div className="builder-board">
                <div className="sentence-line">
                  {built.length ? built.map((token, index) => <button key={`${token}-${index}`} onClick={() => resetBuilder()}>{token}</button>) : <span>Tap words below to build the sentence…</span>}
                </div>
                <div className="word-bank">
                  {wordBank.map((token, index) => <button key={`${token}-${index}`} onClick={() => addToken(token, index)}>{token}</button>)}
                </div>
                <div className="builder-actions"><button onClick={() => resetBuilder()}>Reset</button><button className="check-button" onClick={checkBuilder} disabled={!built.length}>Check sentence</button></div>
                {buildResult && <div className={`result-note ${buildResult.startsWith("Correct") ? "correct" : ""}`}>{buildResult}<button onClick={() => resetBuilder(true)}>Next →</button></div>}
              </div>
            </div>
          )}

          {practice === "speaking" && (
            <div className="speaking-lab">
              <div className="lab-instructions">
                <span className="micro-label">SHADOWING · 3 ROUNDS</span>
                <h3>Borrow the rhythm.</h3>
                <p>Listen once. Speak with the recording twice. Then record yourself without help.</p>
                <div className="shadow-count"><span>1<small>listen</small></span><span>2<small>shadow</small></span><span>3<small>solo</small></span></div>
              </div>
              <div className="speech-console">
                <button className="speaker-orb" onClick={() => speak(missions[0].phrase, 0.72)} aria-label="Play phrase">声<span>▶ PLAY MODEL</span></button>
                <strong>{missions[0].phrase}</strong>
                {showPinyin && <p>{missions[0].pinyin}</p>}
                <button className={`record-button ${isListening ? "recording" : ""}`} onClick={startSpeechCheck}><span>●</span>{isListening ? "Listening…" : "Record my line"}</button>
                <div className="speech-feedback">{speechText}</div>
                <button className="manual-complete" onClick={() => award(8, "Speaking round complete +8 XP")}>I completed 3 rounds</button>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="section path-section" id="path">
        <div className="section-heading path-heading">
          <div><span className="section-kicker">YOUR 6-WEEK ROUTE</span><h2>Twelve real-life<br /><em>missions.</em></h2></div>
          <div className="route-summary"><strong>{progress.missions.length}/12</strong><span>missions complete</span><div><i style={{ width: `${(progress.missions.length / missions.length) * 100}%` }} /></div></div>
        </div>
        <div className="mission-grid">
          {missions.map((mission, index) => {
            const done = progress.missions.includes(index);
            return (
              <article key={mission.title} className={`mission-card ${done ? "complete" : ""}`}>
                <div className="mission-top"><span>W{mission.week} · {String(index + 1).padStart(2, "0")}</span><button onClick={() => setProgress((current) => ({ ...current, missions: done ? current.missions.filter((item) => item !== index) : [...current.missions, index], xp: done ? current.xp : current.xp + 25 }))}>{done ? "✓ DONE" : "+ MARK"}</button></div>
                <h3>{mission.title}</h3><p>{mission.subtitle}</p>
                <div className="mission-words">{mission.words}</div>
                <button className="mission-phrase" onClick={() => speak(mission.phrase)}><span>▶</span><strong>{mission.phrase}</strong>{showPinyin && <small>{mission.pinyin}</small>}</button>
              </article>
            );
          })}
        </div>
      </section>

      <section className="section vocabulary-section" id="vocabulary">
        <div className="section-heading vocabulary-heading">
          <div><span className="section-kicker">COMPLETE HSK 1 WORD BANK</span><h2>All 300 words.<br /><em>Nothing hidden.</em></h2></div>
          <div className="vocab-tools">
            <label><span>⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search 汉字, pinyin, or English" aria-label="Search vocabulary" /></label>
            <button onClick={() => setShowPinyin((value) => !value)}>{showPinyin ? "Hide pinyin" : "Show pinyin"}</button>
          </div>
        </div>
        <div className="vocab-status"><span><b>{progress.mastered.length}</b> mastered</span><div><i style={{ width: `${coursePercent}%` }} /></div><span>{coursePercent}%</span></div>
        <div className="word-grid">
          {visibleWords.map((word) => {
            const originalIndex = vocabulary.indexOf(word);
            const mastered = progress.mastered.includes(originalIndex);
            return (
              <article key={`${word.hanzi}-${originalIndex}`} className={mastered ? "mastered" : ""}>
                <button className="word-audio" onClick={() => speak(word.hanzi)} aria-label={`Play ${word.hanzi}`}>▶</button>
                <strong>{word.hanzi}</strong>
                {showPinyin && <span>{word.pinyin}</span>}
                <p>{word.meaning}</p>
                <button className="master-button" onClick={() => toggleMastered(originalIndex)}>{mastered ? "✓ Mastered" : "+ Learning"}</button>
              </article>
            );
          })}
        </div>
        {!search && <button className="load-more" onClick={() => setShowAllWords((value) => !value)}>{showAllWords ? "Show the focused set" : `Explore all ${vocabulary.length} words`} <span>↓</span></button>}

        <div className="character-bank">
          <div><span className="section-kicker">CHARACTER RECOGNITION</span><h3>Recognize all 246.</h3><p>HSK 1 tests listening and reading—not handwriting. Tap a character to hear a word that uses it.</p></div>
          <div className="character-grid">
            {(showAllCharacters ? recognitionCharacters : recognitionCharacters.slice(0, 80)).map((character, index) => {
              const sample = vocabulary.find((word) => word.hanzi.includes(character));
              return <button key={`${character}-${index}`} onClick={() => speak(sample?.hanzi ?? character)} title={sample ? `${sample.hanzi} · ${sample.meaning}` : character}>{character}</button>;
            })}
            <button className="character-more" onClick={() => setShowAllCharacters((value) => !value)}>{showAllCharacters ? "−" : `+${recognitionCharacters.length - 80}`}</button>
          </div>
        </div>
      </section>

      <section className="section grammar-section" id="grammar">
        <div className="section-heading grammar-heading">
          <div><span className="section-kicker">GRAMMAR AS BUILDING BLOCKS</span><h2>Patterns you can<br /><em>speak today.</em></h2></div>
          <p>The official syllabus lists 70 grammar targets. These 20 high-yield patterns organize them into usable sentence frames.</p>
        </div>
        <div className="filter-row">
          {["All", "Core", "Questions", "Time", "Place", "Actions"].map((filter) => <button key={filter} className={grammarFilter === filter ? "active" : ""} onClick={() => setGrammarFilter(filter)}>{filter}</button>)}
        </div>
        <div className="grammar-grid">
          {filteredGrammar.map((point, index) => (
            <article key={point.title}>
              <div className="grammar-card-top"><span>{String(index + 1).padStart(2, "0")} · {point.label}</span><button onClick={() => speak(point.example)}>▶</button></div>
              <h3>{point.title}</h3><code>{point.formula}</code>
              <div className="grammar-example"><strong>{point.example}</strong>{showPinyin && <span>{point.pinyin}</span>}<small>{point.translation}</small></div>
            </article>
          ))}
        </div>
      </section>

      <section className="section exam-section" id="exam">
        <div className="exam-card">
          <div className="exam-copy"><span className="section-kicker light">HSK 3.0 · LEVEL 1 FORMAT</span><h2>Know the test.<br /><em>Train beyond it.</em></h2><p>The newest Level 1 trial format is about 40 minutes: 20 listening questions and 20 reading questions. Speaking practice here goes beyond the exam because your goal is real-world fluency.</p><a href="https://www.chinesetest.cn/syllabus" target="_blank" rel="noreferrer">View official HSK 3.0 resources ↗</a></div>
          <div className="exam-structure">
            <div><span>01</span><strong>Listening</strong><b>20</b><small>questions · ≈12 min</small></div>
            <div><span>02</span><strong>Reading</strong><b>20</b><small>questions · 20 min</small></div>
            <div className="exam-total"><span>TOTAL</span><strong>40 questions</strong><b>≈40 min</b></div>
          </div>
        </div>
        <p className="rollout-note"><strong>Current rollout note · August 2026</strong> HSK 3.0 is the newest syllabus and the official Chinese Test Service is running a second global trial on September 20, 2026. Check your local test center’s version before registering.</p>
      </section>

      <section className="section progress-section" id="progress">
        <div className="section-heading progress-heading"><div><span className="section-kicker">YOUR MOMENTUM</span><h2>Small proof,<br /><em>every day.</em></h2></div><button onClick={() => { window.localStorage.removeItem("shengtu-hsk1-progress"); setProgress(starterProgress); setToast("Progress reset"); }}>Reset progress</button></div>
        <div className="stat-grid">
          <article className="stat-card coral"><span>火</span><strong>{progress.streak}</strong><p>day streak</p><small>Consistency beats intensity.</small></article>
          <article className="stat-card jade"><span>字</span><strong>{progress.mastered.length}</strong><p>words mastered</p><small>{vocabulary.length - progress.mastered.length} still in rotation.</small></article>
          <article className="stat-card blue"><span>时</span><strong>{progress.minutes}</strong><p>minutes trained</p><small>Active minutes, not screen time.</small></article>
          <article className="stat-card yellow"><span>光</span><strong>{progress.xp}</strong><p>practice XP</p><small>Earned through recall and speech.</small></article>
        </div>
        <div className="level-roadmap">
          <div><span className="section-kicker">THE LONG GAME</span><h3>HSK 1 is the launchpad—not fluency.</h3><p>Finish this foundation, then keep the same speak-first loop through every level.</p></div>
          <ol>
            {[1, 2, 3, 4, 5, 6, "7–9"].map((level, index) => <li key={String(level)} className={index === 0 ? "current" : "locked"}><span>{index === 0 ? "NOW" : "LOCKED"}</span><strong>HSK {level}</strong><small>{index === 0 ? "Daily life basics" : index < 3 ? "Everyday independence" : index < 6 ? "Work & study fluency" : "Professional mastery"}</small></li>)}
          </ol>
        </div>
      </section>

      <footer>
        <div className="footer-brand"><span className="brand-mark">声</span><div><strong>SHĒNGTÚ</strong><p>Hear it. Say it. Own it.</p></div></div>
        <div><span>CURRICULUM</span><a href="#path">6-week path</a><a href="#vocabulary">300 words</a><a href="#grammar">Grammar map</a></div>
        <div><span>SOURCES</span><a href="https://www.chinesetest.cn/syllabus" target="_blank" rel="noreferrer">Official HSK 3.0</a><a href="https://hsk.cn-bj.ufileos.com/3.0/%E6%96%B0%E7%89%88HSK%E8%80%83%E8%AF%95%E5%A4%A7%E7%BA%B2%EF%BC%88%E8%AF%8D%E6%B1%87%E3%80%81%E6%B1%89%E5%AD%97%E3%80%81%E8%AF%AD%E6%B3%95%EF%BC%89.pdf" target="_blank" rel="noreferrer">2025 syllabus PDF</a></div>
        <p className="footer-note">Independent learning tool. Not affiliated with Chinese Test International. Progress stays on this device.</p>
      </footer>
      {toast && <div className="toast" role="status">{toast}</div>}
    </main>
  );
}
