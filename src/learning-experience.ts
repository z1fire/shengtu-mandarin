import type { CourseMission, LevelVocabularyWord } from "./level-content.ts";

export type RecallChallenge = {
  mode: "meaning" | "audio" | "hanzi";
  prompt: string;
  answer: string;
  options: string[];
  instruction: string;
};

export type MissionDictation = {
  masked: string;
  answer: string;
  options: string[];
};

export type ReadingLine = {
  speaker: string;
  hanzi: string;
  pinyin: string;
  translation: string;
};

export type GradedReading = {
  title: string;
  lines: ReadingLine[];
  question: string;
  answer: string;
  options: string[];
};

export type ConversationTurn = ReadingLine & {
  learner: boolean;
};

function uniqueOptions(answer: string, candidates: string[]) {
  return [answer, ...candidates.filter((item) => item && item !== answer)]
    .filter((item, index, items) => items.indexOf(item) === index)
    .slice(0, 3);
}

function rotateOptions(options: string[], seed: number) {
  const offset = options.length ? Math.abs(seed) % options.length : 0;
  return [...options.slice(offset), ...options.slice(0, offset)];
}

export function buildRecallChallenge(index: number, words: LevelVocabularyWord[], repetitions: number): RecallChallenge {
  const word = words[index];
  const offsets = [Math.max(1, Math.floor(words.length / 3)), Math.max(2, Math.floor(words.length * 2 / 3)), 1];
  const distractors = offsets.map((offset) => words[(index + offset) % words.length]).filter(Boolean);
  const mode = repetitions % 3 === 1 ? "audio" : repetitions % 3 === 2 ? "hanzi" : "meaning";

  if (mode === "hanzi") {
    return {
      mode,
      prompt: word.meaning,
      answer: word.hanzi,
      options: rotateOptions(uniqueOptions(word.hanzi, distractors.map((item) => item.hanzi)), index + repetitions),
      instruction: "Choose the Mandarin word that expresses this meaning.",
    };
  }

  return {
    mode,
    prompt: mode === "audio" ? "Listen without looking" : word.hanzi,
    answer: word.meaning,
    options: rotateOptions(uniqueOptions(word.meaning, distractors.map((item) => item.meaning)), index + repetitions),
    instruction: mode === "audio" ? "Play the word, then choose what you heard." : "Choose the meaning from memory.",
  };
}

export function buildMissionDictation(missions: CourseMission[], activeIndex: number): MissionDictation {
  const mission = missions[activeIndex];
  const candidateIndex = Math.min(mission.tokens.length - 1, Math.max(0, Math.floor(mission.tokens.length / 2)));
  const answer = mission.tokens[candidateIndex];
  const candidates = [1, 3, 5].map((offset) => {
    const other = missions[(activeIndex + offset) % missions.length];
    return other.tokens[Math.min(candidateIndex, other.tokens.length - 1)];
  });
  return {
    masked: mission.phrase.replace(answer, "＿＿"),
    answer,
    options: rotateOptions(uniqueOptions(answer, candidates), activeIndex),
  };
}

export function buildGradedReading(missions: CourseMission[], activeIndex: number, phase: number): GradedReading {
  const mission = missions[activeIndex];
  const prior = missions[(activeIndex + missions.length - 1) % missions.length];
  const support = phase === 0
    ? { hanzi: "好的。", pinyin: "Hǎo de.", translation: "Okay." }
    : phase === 1
      ? { hanzi: "好的，谢谢。", pinyin: "Hǎo de, xièxie.", translation: "Okay, thank you." }
      : { hanzi: "好的，我知道了。谢谢！", pinyin: "Hǎo de, wǒ zhīdào le. Xièxie!", translation: "Okay, I understand. Thank you!" };
  return {
    title: `${mission.title} · mini dialogue`,
    lines: [
      { speaker: "A", hanzi: mission.phrase, pinyin: mission.pinyin, translation: mission.translation },
      { speaker: "B", ...support },
    ],
    question: "What is speaker A communicating?",
    answer: mission.translation,
    options: rotateOptions(uniqueOptions(mission.translation, [prior.translation, missions[(activeIndex + 4) % missions.length].translation]), activeIndex + phase),
  };
}

export function buildMissionConversation(mission: CourseMission, phase: number): ConversationTurn[] {
  const opener = phase === 0
    ? { hanzi: "请说。", pinyin: "Qǐng shuō.", translation: "Go ahead." }
    : { hanzi: "你好，请问。", pinyin: "Nǐ hǎo, qǐngwèn.", translation: "Hello, how can I help?" };
  const turns: ConversationTurn[] = [
    { speaker: "PARTNER", learner: false, ...opener },
    { speaker: "YOU", learner: true, hanzi: mission.phrase, pinyin: mission.pinyin, translation: mission.translation },
  ];
  if (phase >= 1) turns.push({ speaker: "PARTNER", learner: false, hanzi: "好的，谢谢。", pinyin: "Hǎo de, xièxie.", translation: "Okay, thank you." });
  if (phase >= 2) turns.push({ speaker: "YOU", learner: true, hanzi: "谢谢，再见！", pinyin: "Xièxie, zàijiàn!", translation: "Thank you, goodbye!" });
  return turns;
}
