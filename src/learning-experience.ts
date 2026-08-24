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

type ConversationSupport = Omit<ReadingLine, "speaker">;

const conversationSupport = {
  foundation: {
    opener: { hanzi: "你好，有什么事吗？", pinyin: "Nǐ hǎo, yǒu shénme shì ma?", translation: "Hello, what’s up?" },
    acknowledgement: { hanzi: "好的，我明白了。", pinyin: "Hǎo de, wǒ míngbai le.", translation: "Okay, I understand." },
    followUps: [
      { hanzi: "好的，谢谢。", pinyin: "Hǎo de, xièxie.", translation: "Okay, thank you." },
      { hanzi: "我明白了，谢谢。", pinyin: "Wǒ míngbai le, xièxie.", translation: "I understand, thank you." },
      { hanzi: "谢谢你和我练习，再见！", pinyin: "Xièxie nǐ hé wǒ liànxí, zàijiàn!", translation: "Thank you for practicing with me. Goodbye!" },
    ],
  },
  independent: {
    opener: { hanzi: "你好，今天想谈什么？", pinyin: "Nǐ hǎo, jīntiān xiǎng tán shénme?", translation: "Hello, what would you like to discuss today?" },
    acknowledgement: { hanzi: "明白了，谢谢你的说明。", pinyin: "Míngbai le, xièxie nǐ de shuōmíng.", translation: "I understand. Thank you for explaining." },
    followUps: [
      { hanzi: "好的，谢谢你听我说。", pinyin: "Hǎo de, xièxie nǐ tīng wǒ shuō.", translation: "Okay, thank you for listening to me." },
      { hanzi: "我还想听听你的看法。", pinyin: "Wǒ hái xiǎng tīngting nǐ de kànfǎ.", translation: "I would also like to hear your view." },
      { hanzi: "谢谢你和我讨论这个话题。", pinyin: "Xièxie nǐ hé wǒ tǎolùn zhège huàtí.", translation: "Thank you for discussing this topic with me." },
    ],
  },
  advanced: {
    opener: { hanzi: "今天您想讨论什么问题？", pinyin: "Jīntiān nín xiǎng tǎolùn shénme wèntí?", translation: "What issue would you like to discuss today?" },
    acknowledgement: { hanzi: "您的意思很清楚。", pinyin: "Nín de yìsi hěn qīngchu.", translation: "Your meaning is very clear." },
    followUps: [
      { hanzi: "谢谢，我也想听听您的看法。", pinyin: "Xièxie, wǒ yě xiǎng tīngting nín de kànfǎ.", translation: "Thank you. I would also like to hear your view." },
      { hanzi: "如果需要，我可以进一步说明。", pinyin: "Rúguǒ xūyào, wǒ kěyǐ jìnyíbù shuōmíng.", translation: "If needed, I can explain further." },
      { hanzi: "谢谢您的意见，我们可以继续讨论。", pinyin: "Xièxie nín de yìjiàn, wǒmen kěyǐ jìxù tǎolùn.", translation: "Thank you for your input. We can continue the discussion." },
    ],
  },
} satisfies Record<string, { opener: ConversationSupport; acknowledgement: ConversationSupport; followUps: ConversationSupport[] }>;

function conversationRegister(mission: CourseMission) {
  if (mission.level === "1" || mission.level === "2") return conversationSupport.foundation;
  if (mission.level === "3" || mission.level === "4" || mission.level === "5") return conversationSupport.independent;
  return conversationSupport.advanced;
}

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
  const support = conversationRegister(mission);
  const followUp = support.followUps[Math.min(2, Math.max(0, phase))];
  return [
    { speaker: "PARTNER", learner: false, ...support.opener },
    { speaker: "YOU", learner: true, hanzi: mission.phrase, pinyin: mission.pinyin, translation: mission.translation },
    { speaker: "PARTNER", learner: false, ...support.acknowledgement },
    { speaker: "YOU", learner: true, ...followUp },
  ];
}
