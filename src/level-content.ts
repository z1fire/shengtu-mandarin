import {
  grammarPoints as hsk1Grammar,
  missions as hsk1Missions,
  recognitionCharacters as hsk1Characters,
  vocabulary as hsk1Vocabulary,
  type GrammarPoint,
  type VocabularyWord,
} from "./hsk-data.ts";
import {
  expandedCharacters,
  expandedVocabulary,
  officialGrammarTargets,
  type HskLevel,
} from "./hsk-expanded-data.ts";

export { type HskLevel } from "./hsk-expanded-data.ts";

export type LevelVocabularyWord = VocabularyWord & {
  level: HskLevel;
  sequence: number;
  partOfSpeech?: string;
};

export type CourseMission = {
  week: number;
  title: string;
  subtitle: string;
  words: string;
  phrase: string;
  pinyin: string;
  translation: string;
  tokens: string[];
  grammarTitle: string;
  grammarFormula: string;
};

export type LevelMeta = {
  level: HskLevel;
  label: string;
  stage: string;
  description: string;
  newWords: number;
  cumulativeWords: number;
  newCharacters: number;
  cumulativeCharacters: number;
  grammarTargets: number;
};

export const levelOrder: HskLevel[] = ["1", "2", "3", "4", "5", "6", "7-9"];

export const levelMeta: Record<HskLevel, LevelMeta> = {
  "1": { level: "1", label: "HSK 1", stage: "Foundation", description: "Survive everyday basics and start speaking from day one.", newWords: 300, cumulativeWords: 300, newCharacters: 246, cumulativeCharacters: 246, grammarTargets: 70 },
  "2": { level: "2", label: "HSK 2", stage: "Everyday range", description: "Handle routines, choices, directions, and simple experiences.", newWords: 200, cumulativeWords: 500, newCharacters: 125, cumulativeCharacters: 371, grammarTargets: 75 },
  "3": { level: "3", label: "HSK 3", stage: "Independence", description: "Solve daily problems and connect ideas in longer speech.", newWords: 500, cumulativeWords: 1000, newCharacters: 284, cumulativeCharacters: 655, grammarTargets: 96 },
  "4": { level: "4", label: "HSK 4", stage: "Confident communication", description: "Explain viewpoints, report events, and work through complexity.", newWords: 1000, cumulativeWords: 2000, newCharacters: 441, cumulativeCharacters: 1096, grammarTargets: 95 },
  "5": { level: "5", label: "HSK 5", stage: "Fluent discussion", description: "Discuss abstract topics, media, work, and culture with precision.", newWords: 1600, cumulativeWords: 3600, newCharacters: 431, cumulativeCharacters: 1527, grammarTargets: 70 },
  "6": { level: "6", label: "HSK 6", stage: "Advanced command", description: "Follow nuanced material and express layered arguments naturally.", newWords: 1800, cumulativeWords: 5400, newCharacters: 413, cumulativeCharacters: 1940, grammarTargets: 50 },
  "7-9": { level: "7-9", label: "HSK 7–9", stage: "Academic & professional", description: "Master formal, specialized, literary, and professional Chinese.", newWords: 5600, cumulativeWords: 11000, newCharacters: 1148, cumulativeCharacters: 3088, grammarTargets: 134 },
};

const hsk1Words: LevelVocabularyWord[] = hsk1Vocabulary.map((word, index) => ({
  ...word,
  level: "1",
  sequence: index + 1,
}));

const vocabularyByLevel: Record<HskLevel, LevelVocabularyWord[]> = {
  "1": hsk1Words,
  "2": [],
  "3": [],
  "4": [],
  "5": [],
  "6": [],
  "7-9": [],
};

for (const level of levelOrder.slice(1) as Exclude<HskLevel, "1">[]) {
  vocabularyByLevel[level] = expandedVocabulary[level].map((word) => ({
    hanzi: word.h,
    pinyin: word.p,
    meaning: word.m,
    example: "",
    collocation: word.pos ? `Official part of speech: ${word.pos}` : `Official syllabus entry ${word.s}`,
    note: `Official syllabus entry ${word.s}`,
    level,
    sequence: word.s,
    partOfSpeech: word.pos,
  }));
}

export function getStudyVocabulary(level: HskLevel) {
  return vocabularyByLevel[level];
}

export function getCumulativeVocabulary(level: HskLevel) {
  const end = levelOrder.indexOf(level);
  return levelOrder.slice(0, end + 1).flatMap((item) => vocabularyByLevel[item]);
}

export function getStudyCharacters(level: HskLevel) {
  return level === "1" ? hsk1Characters : expandedCharacters[level];
}

export function getCumulativeCharacters(level: HskLevel) {
  const end = levelOrder.indexOf(level);
  return [...new Set(levelOrder.slice(0, end + 1).flatMap((item) => getStudyCharacters(item)))];
}

function grammarGroup(category: string): GrammarPoint["group"] {
  if (category.includes("句")) return "Questions";
  if (category.includes("短语")) return "Core";
  if (category.includes("词类")) return "Actions";
  if (category.includes("语素")) return "Core";
  return "Core";
}

function officialGrammar(level: HskLevel): GrammarPoint[] {
  return officialGrammarTargets[level].map((target, index) => ({
    group: grammarGroup(target.category),
    label: target.category,
    title: target.title || `Official target ${index + 1}`,
    formula: target.formula,
    example: "",
    pinyin: "",
    translation: "",
  }));
}

export function getLibraryGrammar(level: HskLevel, cumulative = false) {
  if (!cumulative) return level === "1" ? hsk1Grammar : officialGrammar(level);
  const end = levelOrder.indexOf(level);
  return levelOrder.slice(0, end + 1).flatMap((item) => item === "1" ? hsk1Grammar : officialGrammar(item));
}

type MissionBlueprint = Omit<CourseMission, "week" | "words" | "pinyin">;

const hsk1Tokens = [
  ["你好", "我叫", "安娜", "你呢"], ["我家", "有", "四口", "人"], ["我要", "一杯茶", "和", "十个饺子"],
  ["我", "早上七点", "起床"], ["现在", "九点半"], ["请问", "医院", "在哪里"],
  ["这个", "多少钱", "太贵了"], ["我", "在大学", "学习中文"], ["我", "坐火车", "去学校"],
  ["明天", "会", "下雨吗"], ["我", "生病了", "想去医院"], ["我", "会说", "一点儿中文了"],
];

const blueprints: Record<Exclude<HskLevel, "1">, MissionBlueprint[]> = {
  "2": [
    { title: "Make a plan", subtitle: "Confirm that you are ready", phrase: "我已经准备好了。", tokens: ["我", "已经", "准备", "好", "了"], translation: "I am already ready.", grammarTitle: "A completed new state", grammarFormula: "已经 + verb + 了" },
    { title: "Compare choices", subtitle: "Choose by price or quality", phrase: "这件衣服比那件便宜。", tokens: ["这", "件", "衣服", "比", "那", "件", "便宜"], translation: "This item of clothing is cheaper than that one.", grammarTitle: "Compare with 比", grammarFormula: "A + 比 + B + adjective" },
    { title: "Explain a reason", subtitle: "Connect cause and result", phrase: "因为下雨，所以我们坐地铁。", tokens: ["因为", "下雨", "所以", "我们", "坐", "地铁"], translation: "Because it is raining, we are taking the subway.", grammarTitle: "Cause and result", grammarFormula: "因为……，所以……" },
    { title: "Ask for help", subtitle: "Make a polite practical request", phrase: "请帮我找一下车站。", tokens: ["请", "帮", "我", "找", "一下", "车站"], translation: "Please help me find the station.", grammarTitle: "Soften an action", grammarFormula: "verb + 一下" },
    { title: "Share experience", subtitle: "Say what you have done before", phrase: "我去过北京两次。", tokens: ["我", "去", "过", "北京", "两", "次"], translation: "I have been to Beijing twice.", grammarTitle: "Past experience with 过", grammarFormula: "verb + 过 + object" },
    { title: "Choose what to eat", subtitle: "State your preferred option", phrase: "我还是想吃米饭。", tokens: ["我", "还是", "想", "吃", "米饭"], translation: "I would still prefer to eat rice.", grammarTitle: "Choose with 还是", grammarFormula: "A，还是 B" },
    { title: "Arrange a meeting", subtitle: "Set a time naturally", phrase: "我们明天下午见面吧。", tokens: ["我们", "明天", "下午", "见面", "吧"], translation: "Let’s meet tomorrow afternoon.", grammarTitle: "Suggest with 吧", grammarFormula: "proposal + 吧" },
    { title: "Describe a person", subtitle: "Connect two qualities", phrase: "她又聪明又热情。", tokens: ["她", "又", "聪明", "又", "热情"], translation: "She is both intelligent and warm.", grammarTitle: "Two parallel qualities", grammarFormula: "又 + adjective + 又 + adjective" },
    { title: "Handle a health problem", subtitle: "Explain a symptom and need", phrase: "我有点儿头疼，需要休息。", tokens: ["我", "有点儿", "头疼", "需要", "休息"], translation: "I have a bit of a headache and need to rest.", grammarTitle: "A mild negative degree", grammarFormula: "有点儿 + adjective / symptom" },
    { title: "Follow directions", subtitle: "Understand a simple route", phrase: "从这里一直往前走。", tokens: ["从", "这里", "一直", "往", "前", "走"], translation: "Go straight ahead from here.", grammarTitle: "Route from a starting point", grammarFormula: "从 + place + 往 + direction + verb" },
    { title: "Talk about habits", subtitle: "Describe a weekly routine", phrase: "我每个周末都去游泳。", tokens: ["我", "每", "个", "周末", "都", "去", "游泳"], translation: "I go swimming every weekend.", grammarTitle: "Every…all", grammarFormula: "每 + measure + noun + 都……" },
    { title: "HSK 2 checkpoint", subtitle: "Handle more everyday situations", phrase: "现在我能处理更多日常情况了。", tokens: ["现在", "我", "能", "处理", "更多", "日常", "情况", "了"], translation: "Now I can handle more everyday situations.", grammarTitle: "A new ability", grammarFormula: "现在 + subject + 能 + verb + 了" },
  ],
  "3": [
    { title: "Add another fact", subtitle: "Expand an answer naturally", phrase: "除了中文以外，我还会说英语。", tokens: ["除了", "中文", "以外", "我", "还", "会", "说", "英语"], translation: "Besides Chinese, I can also speak English.", grammarTitle: "Besides…also", grammarFormula: "除了……以外，……还……" },
    { title: "Report a delay", subtitle: "Contrast a problem and outcome", phrase: "虽然路上堵车，但是我按时到了。", tokens: ["虽然", "路上", "堵车", "但是", "我", "按时", "到", "了"], translation: "Although traffic was bad, I arrived on time.", grammarTitle: "Concede and contrast", grammarFormula: "虽然……，但是……" },
    { title: "Secure your belongings", subtitle: "Say what you did with an object", phrase: "我把护照放在包里了。", tokens: ["我", "把", "护照", "放", "在", "包", "里", "了"], translation: "I put the passport in the bag.", grammarTitle: "Move a specific object", grammarFormula: "subject + 把 + object + verb + place" },
    { title: "Explain what happened", subtitle: "Report an affected object", phrase: "我的电脑被同事拿走了。", tokens: ["我的", "电脑", "被", "同事", "拿走", "了"], translation: "My computer was taken away by a colleague.", grammarTitle: "Passive with 被", grammarFormula: "object + 被 + agent + verb" },
    { title: "Prepare for success", subtitle: "Connect a condition to a result", phrase: "只要提前准备，就不会紧张。", tokens: ["只要", "提前", "准备", "就", "不会", "紧张"], translation: "As long as you prepare early, you will not be nervous.", grammarTitle: "Sufficient condition", grammarFormula: "只要……，就……" },
    { title: "Make a strong comparison", subtitle: "Show a large difference", phrase: "这家餐厅比那家安静得多。", tokens: ["这", "家", "餐厅", "比", "那", "家", "安静", "得多"], translation: "This restaurant is much quieter than that one.", grammarTitle: "Compare by a degree", grammarFormula: "A + 比 + B + adjective + 得多" },
    { title: "Describe improvement", subtitle: "Show two things changing together", phrase: "我越练习，表达得越自然。", tokens: ["我", "越", "练习", "表达", "得", "越", "自然"], translation: "The more I practice, the more naturally I express myself.", grammarTitle: "The more…the more", grammarFormula: "越……，越……" },
    { title: "Do two things together", subtitle: "Describe simultaneous actions", phrase: "他一边听音乐，一边做饭。", tokens: ["他", "一边", "听", "音乐", "一边", "做饭"], translation: "He cooks while listening to music.", grammarTitle: "Simultaneous actions", grammarFormula: "一边……，一边……" },
    { title: "Change a travel plan", subtitle: "Respond to a disruption", phrase: "如果航班取消，我们就坐火车。", tokens: ["如果", "航班", "取消", "我们", "就", "坐", "火车"], translation: "If the flight is canceled, we will take the train.", grammarTitle: "If…then", grammarFormula: "如果……，就……" },
    { title: "Give background", subtitle: "Place an experience in the past", phrase: "我以前来过这里两次。", tokens: ["我", "以前", "来", "过", "这里", "两", "次"], translation: "I have been here twice before.", grammarTitle: "Experienced before", grammarFormula: "以前 + verb + 过" },
    { title: "State what matters", subtitle: "Frame a personal viewpoint", phrase: "对我来说，保持习惯最重要。", tokens: ["对", "我", "来说", "保持", "习惯", "最", "重要"], translation: "For me, maintaining the habit is most important.", grammarTitle: "From a viewpoint", grammarFormula: "对 + person + 来说……" },
    { title: "HSK 3 checkpoint", subtitle: "Solve everyday problems independently", phrase: "现在我可以独立解决日常问题了。", tokens: ["现在", "我", "可以", "独立", "解决", "日常", "问题", "了"], translation: "Now I can solve everyday problems independently.", grammarTitle: "New capability", grammarFormula: "现在……可以……了" },
  ],
  "4": [
    { title: "Present two strengths", subtitle: "Build a persuasive recommendation", phrase: "这个方案不但省时间，而且更安全。", tokens: ["这个", "方案", "不但", "省", "时间", "而且", "更", "安全"], translation: "This plan not only saves time, but is also safer.", grammarTitle: "Not only…but also", grammarFormula: "不但……，而且……" },
    { title: "Keep a commitment", subtitle: "Act despite a difficulty", phrase: "尽管天气很差，我们还是按时出发了。", tokens: ["尽管", "天气", "很", "差", "我们", "还是", "按时", "出发", "了"], translation: "Although the weather was bad, we still left on time.", grammarTitle: "Despite…still", grammarFormula: "尽管……，还是……" },
    { title: "Set a firm principle", subtitle: "Explain what will not change", phrase: "即使遇到困难，我也不会放弃。", tokens: ["即使", "遇到", "困难", "我", "也", "不会", "放弃"], translation: "Even if I encounter difficulties, I will not give up.", grammarTitle: "Even if…still", grammarFormula: "即使……，也……" },
    { title: "Act on known facts", subtitle: "Draw a practical conclusion", phrase: "既然大家都同意，我们就开始吧。", tokens: ["既然", "大家", "都", "同意", "我们", "就", "开始", "吧"], translation: "Since everyone agrees, let’s begin.", grammarTitle: "Since…then", grammarFormula: "既然……，就……" },
    { title: "Explain a method", subtitle: "Report how a result was achieved", phrase: "我们通过调查发现了真正的原因。", tokens: ["我们", "通过", "调查", "发现", "了", "真正", "的", "原因"], translation: "Through research, we discovered the real reason.", grammarTitle: "Achieve through a method", grammarFormula: "通过 + method + verb" },
    { title: "Report an incident", subtitle: "Describe an object-focused result", phrase: "他把重要文件忘在办公室了。", tokens: ["他", "把", "重要", "文件", "忘", "在", "办公室", "了"], translation: "He left the important documents at the office.", grammarTitle: "把 with a result", grammarFormula: "把 + object + verb + result/place" },
    { title: "Describe an impact", subtitle: "Report a passive event clearly", phrase: "比赛因为大雨被取消了。", tokens: ["比赛", "因为", "大雨", "被", "取消", "了"], translation: "The match was canceled because of heavy rain.", grammarTitle: "Passive event", grammarFormula: "subject + 被 + verb + 了" },
    { title: "Balance two sides", subtitle: "Organize a nuanced viewpoint", phrase: "一方面要提高速度，另一方面要保证质量。", tokens: ["一方面", "要", "提高", "速度", "另一方面", "要", "保证", "质量"], translation: "On one hand we need to increase speed; on the other, ensure quality.", grammarTitle: "Two-sided analysis", grammarFormula: "一方面……，另一方面……" },
    { title: "Recommend an alternative", subtitle: "Compare two possible actions", phrase: "与其等别人，不如自己先行动。", tokens: ["与其", "等", "别人", "不如", "自己", "先", "行动"], translation: "Rather than wait for others, it is better to act first yourself.", grammarTitle: "Rather than…better to", grammarFormula: "与其……，不如……" },
    { title: "State a universal rule", subtitle: "Show the same result in every case", phrase: "无论遇到什么问题，他都很冷静。", tokens: ["无论", "遇到", "什么", "问题", "他", "都", "很", "冷静"], translation: "No matter what problem he encounters, he stays calm.", grammarTitle: "No matter…all", grammarFormula: "无论……，都……" },
    { title: "Give a formal cause", subtitle: "Connect reason and consequence", phrase: "由于设备故障，因此会议推迟了。", tokens: ["由于", "设备", "故障", "因此", "会议", "推迟", "了"], translation: "Because of equipment failure, the meeting was postponed.", grammarTitle: "Formal cause and result", grammarFormula: "由于……，因此……" },
    { title: "HSK 4 checkpoint", subtitle: "Explain complex situations confidently", phrase: "我能清楚地解释观点并解决复杂问题。", tokens: ["我", "能", "清楚", "地", "解释", "观点", "并", "解决", "复杂", "问题"], translation: "I can clearly explain viewpoints and solve complex problems.", grammarTitle: "Link formal actions", grammarFormula: "verb 1 + 并 + verb 2" },
  ],
  "5": [
    { title: "Explain the real cause", subtitle: "Build a precise causal argument", phrase: "他之所以成功，是因为长期坚持。", tokens: ["他", "之所以", "成功", "是因为", "长期", "坚持"], translation: "The reason he succeeded is that he persisted for a long time.", grammarTitle: "The reason is", grammarFormula: "之所以……，是因为……" },
    { title: "Set a necessary condition", subtitle: "State what must happen first", phrase: "只有充分了解情况，才能做出判断。", tokens: ["只有", "充分", "了解", "情况", "才", "能", "做出", "判断"], translation: "Only by fully understanding the situation can one make a judgment.", grammarTitle: "Only if…then", grammarFormula: "只有……，才……" },
    { title: "Choose the stronger option", subtitle: "Recommend action over delay", phrase: "与其反复讨论，不如马上试一试。", tokens: ["与其", "反复", "讨论", "不如", "马上", "试一试"], translation: "Rather than discuss it repeatedly, it is better to try immediately.", grammarTitle: "Prefer one course", grammarFormula: "与其……，不如……" },
    { title: "Describe combined qualities", subtitle: "Join complementary strengths", phrase: "这项工作既需要经验，又需要耐心。", tokens: ["这项", "工作", "既", "需要", "经验", "又", "需要", "耐心"], translation: "This work requires both experience and patience.", grammarTitle: "Both…and", grammarFormula: "既……，又……" },
    { title: "Stay consistent", subtitle: "Hold a position across conditions", phrase: "不管结果如何，我们都要承担责任。", tokens: ["不管", "结果", "如何", "我们", "都", "要", "承担", "责任"], translation: "Whatever the result, we must take responsibility.", grammarTitle: "Regardless…all", grammarFormula: "不管……，都……" },
    { title: "Describe gradual change", subtitle: "Connect a trend and its result", phrase: "随着经验增加，我的判断越来越准确。", tokens: ["随着", "经验", "增加", "我的", "判断", "越来越", "准确"], translation: "As my experience increases, my judgment becomes more accurate.", grammarTitle: "Change along with", grammarFormula: "随着……，……越来越……" },
    { title: "Frame a formal viewpoint", subtitle: "Discuss an issue from one perspective", phrase: "对企业而言，信任是一种长期资产。", tokens: ["对", "企业", "而言", "信任", "是", "一种", "长期", "资产"], translation: "For a company, trust is a long-term asset.", grammarTitle: "From a formal perspective", grammarFormula: "对……而言，……" },
    { title: "Correct an assumption", subtitle: "Replace one interpretation with another", phrase: "这并非运气，而是认真准备的结果。", tokens: ["这", "并非", "运气", "而是", "认真", "准备", "的", "结果"], translation: "This is not luck, but the result of careful preparation.", grammarTitle: "Not…but rather", grammarFormula: "并非……，而是……" },
    { title: "Warn about a trigger", subtitle: "Show an immediate consequence", phrase: "一旦失去信任，合作就很难继续。", tokens: ["一旦", "失去", "信任", "合作", "就", "很难", "继续"], translation: "Once trust is lost, cooperation is difficult to continue.", grammarTitle: "Once…then", grammarFormula: "一旦……，就……" },
    { title: "Concede without changing course", subtitle: "Maintain a nuanced position", phrase: "尽管意见不同，我们仍然保持尊重。", tokens: ["尽管", "意见", "不同", "我们", "仍然", "保持", "尊重"], translation: "Although our opinions differ, we still maintain respect.", grammarTitle: "Although…nevertheless", grammarFormula: "尽管……，仍然……" },
    { title: "Show a resulting effect", subtitle: "Connect action to broader impact", phrase: "新的制度提高了效率，从而降低了成本。", tokens: ["新的", "制度", "提高", "了", "效率", "从而", "降低", "了", "成本"], translation: "The new system increased efficiency, thereby reducing costs.", grammarTitle: "Thereby", grammarFormula: "……，从而……" },
    { title: "HSK 5 checkpoint", subtitle: "Discuss abstract ideas with precision", phrase: "我能有条理地讨论复杂而抽象的话题。", tokens: ["我", "能", "有条理", "地", "讨论", "复杂", "而", "抽象", "的", "话题"], translation: "I can discuss complex and abstract topics systematically.", grammarTitle: "Formal modifier with 地", grammarFormula: "adverbial phrase + 地 + verb" },
  ],
  "6": [
    { title: "State an invariant conclusion", subtitle: "Argue across every possible case", phrase: "无论条件如何变化，核心原则都不能改变。", tokens: ["无论", "条件", "如何", "变化", "核心", "原则", "都", "不能", "改变"], translation: "No matter how conditions change, the core principles cannot change.", grammarTitle: "No matter how", grammarFormula: "无论……如何……，都……" },
    { title: "Define the only exception", subtitle: "Set a strict condition", phrase: "除非获得批准，否则计划不能实施。", tokens: ["除非", "获得", "批准", "否则", "计划", "不能", "实施"], translation: "Unless approval is obtained, the plan cannot be implemented.", grammarTitle: "Unless…otherwise", grammarFormula: "除非……，否则……" },
    { title: "Express a firm preference", subtitle: "Choose principle over convenience", phrase: "与其勉强接受，我宁可重新开始。", tokens: ["与其", "勉强", "接受", "我", "宁可", "重新", "开始"], translation: "Rather than reluctantly accept it, I would prefer to start over.", grammarTitle: "Rather than…would prefer", grammarFormula: "与其……，宁可……" },
    { title: "Trace a deeper cause", subtitle: "Explain an outcome analytically", phrase: "问题之所以扩大，是因为缺乏及时沟通。", tokens: ["问题", "之所以", "扩大", "是因为", "缺乏", "及时", "沟通"], translation: "The problem expanded because timely communication was lacking.", grammarTitle: "Analytical cause", grammarFormula: "之所以……，是因为……" },
    { title: "Define a concept", subtitle: "Give a concise formal explanation", phrase: "所谓专业，就是在细节上保持标准。", tokens: ["所谓", "专业", "就是", "在", "细节", "上", "保持", "标准"], translation: "Professionalism means maintaining standards in the details.", grammarTitle: "What is called…is", grammarFormula: "所谓……，就是……" },
    { title: "Draw an evidence-based conclusion", subtitle: "Move from observation to inference", phrase: "由此可见，短期收益并不代表长期价值。", tokens: ["由此可见", "短期", "收益", "并不", "代表", "长期", "价值"], translation: "From this it can be seen that short-term gains do not represent long-term value.", grammarTitle: "It follows that", grammarFormula: "由此可见，……" },
    { title: "Balance competing demands", subtitle: "Structure a two-part analysis", phrase: "一方面要控制风险，另一方面要鼓励创新。", tokens: ["一方面", "要", "控制", "风险", "另一方面", "要", "鼓励", "创新"], translation: "On one hand risk must be controlled; on the other, innovation encouraged.", grammarTitle: "Balanced analysis", grammarFormula: "一方面……，另一方面……" },
    { title: "Name the sufficient condition", subtitle: "Show what guarantees the result", phrase: "只要目标明确，方法就可以不断调整。", tokens: ["只要", "目标", "明确", "方法", "就", "可以", "不断", "调整"], translation: "As long as the goal is clear, the method can be continually adjusted.", grammarTitle: "As long as", grammarFormula: "只要……，就……" },
    { title: "Concede in formal speech", subtitle: "Recognize a fact before qualifying it", phrase: "方案虽有不足，但整体方向是正确的。", tokens: ["方案", "虽", "有", "不足", "但", "整体", "方向", "是", "正确", "的"], translation: "Although the plan has shortcomings, its overall direction is correct.", grammarTitle: "Concise concession", grammarFormula: "虽……，但……" },
    { title: "Add a simultaneous development", subtitle: "Connect parallel changes", phrase: "市场正在恢复，与此同时竞争也更加激烈。", tokens: ["市场", "正在", "恢复", "与此同时", "竞争", "也", "更加", "激烈"], translation: "The market is recovering; meanwhile, competition is also intensifying.", grammarTitle: "Meanwhile", grammarFormula: "……，与此同时……" },
    { title: "Reach the underlying point", subtitle: "Summarize a complex argument", phrase: "归根到底，真正的优势来自持续学习。", tokens: ["归根到底", "真正", "的", "优势", "来自", "持续", "学习"], translation: "Ultimately, real advantage comes from continuous learning.", grammarTitle: "At root", grammarFormula: "归根到底，……" },
    { title: "HSK 6 checkpoint", subtitle: "Express layered arguments naturally", phrase: "我能理解细微差别，并准确表达复杂立场。", tokens: ["我", "能", "理解", "细微", "差别", "并", "准确", "表达", "复杂", "立场"], translation: "I can understand subtle differences and express complex positions accurately.", grammarTitle: "Coordinate formal actions", grammarFormula: "verb 1 + 并 + verb 2" },
  ],
  "7-9": [
    { title: "Open a formal recommendation", subtitle: "Ground action in current evidence", phrase: "鉴于现有证据，我们建议暂缓实施该方案。", tokens: ["鉴于", "现有", "证据", "我们", "建议", "暂缓", "实施", "该", "方案"], translation: "In view of the existing evidence, we recommend postponing implementation of the plan.", grammarTitle: "In view of", grammarFormula: "鉴于……，……" },
    { title: "Qualify a sophisticated claim", subtitle: "Concede without abandoning the thesis", phrase: "尽管结论尚有争议，其研究价值不容忽视。", tokens: ["尽管", "结论", "尚", "有", "争议", "其", "研究", "价值", "不容", "忽视"], translation: "Although the conclusion remains disputed, its research value cannot be ignored.", grammarTitle: "Formal concession", grammarFormula: "尽管……，……不容……" },
    { title: "Develop a hypothetical", subtitle: "Reason from an uncertain premise", phrase: "倘若缺乏长期数据，任何判断都可能失真。", tokens: ["倘若", "缺乏", "长期", "数据", "任何", "判断", "都", "可能", "失真"], translation: "If long-term data is lacking, any judgment may be distorted.", grammarTitle: "Formal hypothesis", grammarFormula: "倘若……，……" },
    { title: "State a principled preference", subtitle: "Contrast two strategic options", phrase: "与其追求表面共识，宁可保留必要分歧。", tokens: ["与其", "追求", "表面", "共识", "宁可", "保留", "必要", "分歧"], translation: "Rather than pursue superficial consensus, it is preferable to preserve necessary differences.", grammarTitle: "Rather than…prefer", grammarFormula: "与其……，宁可……" },
    { title: "Define a technical idea", subtitle: "Make an abstract term operational", phrase: "所谓韧性，就是系统受到冲击后恢复的能力。", tokens: ["所谓", "韧性", "就是", "系统", "受到", "冲击", "后", "恢复", "的", "能力"], translation: "Resilience is the ability of a system to recover after a shock.", grammarTitle: "Formal definition", grammarFormula: "所谓……，就是……" },
    { title: "Write a policy rule", subtitle: "State universal formal eligibility", phrase: "凡符合条件者，均可提交申请。", tokens: ["凡", "符合", "条件", "者", "均", "可", "提交", "申请"], translation: "All those who meet the conditions may submit an application.", grammarTitle: "All who…", grammarFormula: "凡……者，均……" },
    { title: "Hold a position under pressure", subtitle: "Concede an extreme circumstance", phrase: "纵然面临巨大压力，我们也不能牺牲原则。", tokens: ["纵然", "面临", "巨大", "压力", "我们", "也", "不能", "牺牲", "原则"], translation: "Even under immense pressure, we cannot sacrifice our principles.", grammarTitle: "Even if", grammarFormula: "纵然……，也……" },
    { title: "Build a multi-part rationale", subtitle: "Present ordered supporting reasons", phrase: "一来成本过高，二来效果尚未得到验证。", tokens: ["一来", "成本", "过高", "二来", "效果", "尚未", "得到", "验证"], translation: "First, the cost is too high; second, the effect has not yet been verified.", grammarTitle: "First…second", grammarFormula: "一来……，二来……" },
    { title: "State a strict requirement", subtitle: "Make one condition indispensable", phrase: "这项任务非得由专业团队完成才行。", tokens: ["这项", "任务", "非得", "由", "专业", "团队", "完成", "才行"], translation: "This task absolutely must be completed by a professional team.", grammarTitle: "Absolutely must", grammarFormula: "非得……才……" },
    { title: "Deliver a ceremonial statement", subtitle: "Use formal institutional language", phrase: "值此合作十周年之际，我们向各位致以谢意。", tokens: ["值此", "合作", "十周年", "之际", "我们", "向", "各位", "致以", "谢意"], translation: "On the occasion of the tenth anniversary of our cooperation, we extend our thanks to everyone.", grammarTitle: "On the occasion of", grammarFormula: "值此……之际，……" },
    { title: "Close an argument", subtitle: "Synthesize evidence into a conclusion", phrase: "综上所述，该政策的长期影响仍需评估。", tokens: ["综上所述", "该", "政策", "的", "长期", "影响", "仍", "需", "评估"], translation: "In summary, the long-term impact of this policy still requires evaluation.", grammarTitle: "In summary", grammarFormula: "综上所述，……" },
    { title: "HSK 7–9 checkpoint", subtitle: "Operate in academic and professional Chinese", phrase: "我能在专业语境中准确理解并表达复杂思想。", tokens: ["我", "能", "在", "专业", "语境", "中", "准确", "理解", "并", "表达", "复杂", "思想"], translation: "I can accurately understand and express complex ideas in professional contexts.", grammarTitle: "Within a context", grammarFormula: "在 + context + 中 + predicate" },
  ],
};

const allWordPinyin = new Map<string, string>();
for (const level of levelOrder) {
  for (const word of vocabularyByLevel[level]) {
    if (!allWordPinyin.has(word.hanzi)) allWordPinyin.set(word.hanzi, word.pinyin);
  }
}

const missionPinyinOverrides = new Map<string, string>([
  ["北京", "Běijīng"],
  ["英语", "Yīngyǔ"],
  ["而言", "ér yán"],
  ["暂缓", "zànhuǎn"],
  ["失真", "shīzhēn"],
  ["凡", "fán"],
  ["十周年", "shí zhōunián"],
  ["之际", "zhī jì"],
  ["致以", "zhìyǐ"],
  ["谢意", "xièyì"],
  ["综上所述", "zōngshàng suǒshù"],
  ["语境", "yǔjìng"],
]);

function pinyinForTokens(tokens: string[]) {
  return tokens.map((token) => {
    const exact = missionPinyinOverrides.get(token) ?? allWordPinyin.get(token);
    if (exact) return exact;
    return [...token].map((character) => {
      const syllable = missionPinyinOverrides.get(character) ?? allWordPinyin.get(character);
      if (!syllable) throw new Error(`Missing mission pinyin for ${character} in ${token}`);
      return syllable;
    }).join(" ");
  }).join(" ").replace(/\s+/g, " ").trim();
}

function focusWords(level: HskLevel, tokens: string[]) {
  const levelWords = new Set(vocabularyByLevel[level].map((word) => word.hanzi));
  const candidates = [...new Set(tokens.filter((token) => /[\u3400-\u9fff]/.test(token)))];
  const focused = candidates.filter((token) => levelWords.has(token));
  return (focused.length >= 3 ? focused : candidates).slice(0, 5).join(" · ");
}

export function getCourseMissions(level: HskLevel): CourseMission[] {
  if (level === "1") {
    return hsk1Missions.map((mission, index) => ({
      ...mission,
      tokens: hsk1Tokens[index],
      grammarTitle: hsk1Grammar[Math.min(index * 3, hsk1Grammar.length - 1)].title,
      grammarFormula: hsk1Grammar[Math.min(index * 3, hsk1Grammar.length - 1)].formula,
    }));
  }
  return blueprints[level].map((mission, index) => ({
    ...mission,
    week: Math.floor(index / 2) + 1,
    words: focusWords(level, mission.tokens),
    pinyin: pinyinForTokens(mission.tokens),
  }));
}

export function getGuidedGrammar(level: HskLevel, missions: CourseMission[]) {
  if (level === "1") return hsk1Grammar;
  return missions.map((mission) => ({
    group: "Core" as const,
    label: levelMeta[level].stage,
    title: mission.grammarTitle,
    formula: mission.grammarFormula,
    example: mission.phrase,
    pinyin: mission.pinyin,
    translation: mission.translation,
  }));
}
