import type { GrammarPoint } from "./hsk-data.ts";
import type { LevelVocabularyWord } from "./level-content.ts";
import { getGrammarLesson } from "./grammar-lessons.ts";

export type MixerSlotKind = "subject" | "noun" | "verb" | "adjective" | "place" | "time" | "number" | "measure" | "modal" | "question" | "direction" | "generic";

export type MixerSlotPart = {
  type: "slot";
  id: string;
  label: string;
  kind: MixerSlotKind;
  options: LevelVocabularyWord[];
};

export type MixerFixedPart = {
  type: "fixed";
  id: string;
  text: string;
};

export type MixerFrame = {
  parts: Array<MixerSlotPart | MixerFixedPart>;
  sourceFormula: string;
  usesMissionPattern: boolean;
};

const preferredWords: Record<MixerSlotKind, string[]> = {
  subject: ["我", "你", "他", "她", "我们", "大家"],
  noun: ["学生", "书", "苹果", "妈妈", "老师", "朋友", "茶", "衣服", "猫"],
  verb: ["学习", "吃", "去", "喝", "看", "说", "工作", "写"],
  adjective: ["好", "大", "小", "热", "冷", "忙", "漂亮", "高兴"],
  place: ["学校", "家", "桌子", "医院", "商店", "中国", "大学"],
  time: ["今天", "明天", "昨天", "上午", "中午", "晚上"],
  number: ["一", "两", "三", "四", "五", "六", "七", "八", "九", "十"],
  measure: ["个", "本", "杯", "件", "只"],
  modal: ["会", "能", "可以", "想", "要"],
  question: ["什么", "哪里", "谁", "怎么", "哪", "几", "多少"],
  direction: ["上", "下", "里", "外", "前", "后"],
  generic: ["学习", "朋友", "学校", "今天", "好", "书"],
};

const identityRoles = ["学生", "老师", "朋友", "同学", "医生", "妈妈"];
const countableNouns = ["学生", "苹果", "书", "茶", "衣服", "猫"];
const actionObjects = ["书", "苹果", "茶", "汉字", "衣服", "饭"];
const locatedNouns = ["书", "学生", "猫", "衣服", "老师", "朋友"];

const measureNouns: Record<string, string[]> = {
  "个": ["学生", "朋友", "老师", "苹果"],
  "本": ["书"],
  "杯": ["茶"],
  "件": ["衣服"],
  "只": ["猫"],
};

const verbObjects: Record<string, string[]> = {
  "看": ["书"],
  "吃": ["苹果", "饭"],
  "喝": ["茶"],
  "写": ["汉字"],
  "买": ["衣服", "书", "苹果"],
  "学习": ["汉字"],
};

const nounPlaces: Record<string, string[]> = {
  "书": ["桌子", "学校", "家"],
  "学生": ["学校", "大学", "家"],
  "老师": ["学校", "大学"],
  "猫": ["家", "桌子"],
  "衣服": ["商店", "家"],
  "朋友": ["家", "学校"],
};

const placeActions: Record<string, string[]> = {
  "学校": ["学习", "工作"],
  "大学": ["学习", "工作"],
  "家": ["学习", "吃", "喝"],
  "医院": ["看", "工作"],
  "商店": ["买", "看"],
  "中国": ["学习", "工作"],
};

function slotKind(label: string): MixerSlotKind {
  const value = label.toLowerCase().replace(/\s+/g, " ").trim();
  if (/measure/.test(value)) return "measure";
  if (/question/.test(value)) return "question";
  if (/adjective|degree|symptom/.test(value)) return "adjective";
  if (/direction/.test(value)) return "direction";
  if (/place|destination/.test(value)) return "place";
  if (/year|month|day|hour|minute|number/.test(value)) return "number";
  if (/time/.test(value)) return "time";
  if (/modal/.test(value)) return "modal";
  if (/subject|owner|person|pronoun|agent|plural|^a$|^b$/.test(value)) return "subject";
  if (/noun|object|family|topic/.test(value)) return "noun";
  if (/new situation/.test(value)) return "adjective";
  if (/verb|action|habitual|completed|predicate|event|proposal|statement|content|method|result|situation|unknown slot/.test(value)) return "verb";
  return "generic";
}

function contextualPreference(formula: string, slotId: string, kind: MixerSlotKind) {
  const normalizedFormula = formula.toLowerCase().replace(/\s+/g, " ");
  if (/subject \+ 们 \+ 都/.test(normalizedFormula) && slotId === "subject") return ["我", "你", "他", "她"];
  if (/plural subject/.test(normalizedFormula) && kind === "subject") return ["我们", "大家", "他们", "她们"];
  if (/喜欢 \+ 哪个/.test(normalizedFormula) && kind === "noun") return ["老师", "学生", "朋友", "苹果"];
  if (/哪些 \+ noun/.test(normalizedFormula) && kind === "noun") return ["书", "衣服", "苹果"];
  if (/多少 \+ noun/.test(normalizedFormula) && kind === "noun") return ["钱", "书", "朋友"];
  if (/这个 \+ noun \+ 怎么/.test(normalizedFormula) && kind === "noun") return ["汉字", "书"];
  if (/这个 \+ noun \+ 怎么 \+ verb/.test(normalizedFormula) && kind === "verb") return ["写", "读", "看", "说"];
  if (/天气 \+ adjective/.test(normalizedFormula) && kind === "adjective") return ["好", "热", "冷"];
  if (/非常 \+ adjective/.test(normalizedFormula) && kind === "adjective") return ["高兴", "忙", "漂亮", "好"];
  if (/多 \+ adjective/.test(normalizedFormula) && kind === "adjective") return ["大", "高"];
  if (/会 \+ verb/.test(normalizedFormula) && kind === "verb") return ["写", "读", "说", "看"];
  if (/modal \+ verb/.test(normalizedFormula) && kind === "verb") return ["写", "读", "说", "看"];
  if (/可以 \+ verb/.test(normalizedFormula) && kind === "verb") return ["写", "读", "说", "看"];
  if (/verb \+ 一下/.test(normalizedFormula) && kind === "verb") return ["看", "听", "说", "写"];
  if (/month \+ 月 \+ day/.test(normalizedFormula) && slotId === "month") return ["五", "八", "三", "一"];
  if (/month \+ 月 \+ day/.test(normalizedFormula) && slotId === "day") return ["八", "十", "五", "一"];
  if (/hour \+ 点/.test(normalizedFormula) && slotId === "hour") return ["八", "九", "七", "一"];
  if (/minute \+ 分/.test(normalizedFormula) && slotId === "minute") return ["十", "五", "三", "一"];
  if (/给 \+ person/.test(normalizedFormula) && slotId === "person") return ["妈妈", "老师", "朋友", "爸爸"];
  if (/是 \+ noun/.test(normalizedFormula) && slotId === "noun") return identityRoles;
  if (/subject \+ (是|是不是) \+ noun/.test(normalizedFormula) && kind === "noun") return identityRoles;
  if (/measure word|measure \+/.test(normalizedFormula) && kind === "noun") return countableNouns;
  if (/verb.*(object|noun)|(object|noun).*verb/.test(normalizedFormula) && kind === "noun") return actionObjects;
  if (/noun \+ 在 \+ place/.test(normalizedFormula) && kind === "noun") return locatedNouns;
  if (/subject \+ (有|没有) \+ object/.test(normalizedFormula) && kind === "noun") return ["书", "朋友", "猫", "衣服", "茶", "钱"];
  if (/owner \+ 的 \+ noun/.test(normalizedFormula) && kind === "noun") return ["书", "朋友", "老师", "衣服", "猫", "妈妈"];
  if (/verb 1 \+ place \+ verb 2/.test(normalizedFormula) && slotId === "verb 1") return ["去", "到", "回"];
  if (/verb 1 \+ place \+ verb 2/.test(normalizedFormula) && slotId === "verb 2") return ["学习", "工作", "看", "买", "吃", "喝"];
  return [];
}

function mixerWords(kind: MixerSlotKind, words: LevelVocabularyWord[], prioritized: string[] = []) {
  const byHanzi = new Map(words.map((word) => [word.hanzi, word]));
  const order = [...new Set([...prioritized, ...preferredWords[kind]])];
  const selected = order.map((hanzi) => byHanzi.get(hanzi)).filter((word): word is LevelVocabularyWord => Boolean(word));
  if (selected.length >= 3) return selected.slice(0, 6);
  const additions = words.filter((word) => !selected.some((item) => item.hanzi === word.hanzi)).slice(0, 6 - selected.length);
  return [...selected, ...additions];
}

function placeholderLabel(part: string) {
  const value = part.trim();
  if (!/[a-z]/i.test(value)) return null;
  if (/^(subject|owner|person|pronoun|agent|plural subject|noun|object|family noun|topic|verb|verb \d+|action|habitual|completed|predicate|event|proposal|statement|content|method|result|new situation|adjective|degree|symptom|place|destination|direction|time|year|month|day|hour|minute|number|measure|measure word|modal|question word|a|b)$/i.test(value)) return value;
  return null;
}

function cleanFixedPart(part: string) {
  const hanzi = part.match(/[\p{Script=Han}]+/gu)?.join("") ?? "";
  return hanzi || part.replace(/[()（）]/g, "").trim();
}

function parseFormula(formula: string, words: LevelVocabularyWord[]) {
  // This target presents two complete alternatives. The mixer teaches one
  // branch at a time instead of incorrectly combining both branches.
  const activeFormula = formula === "不 + habitual / 没有 + completed" ? "不 + habitual" : formula;
  const prepared = activeFormula
    .replace(/[？?。]/g, "")
    .replace(/……|…/g, " + content + ")
    .replace(/[，,]/g, " + ， + ");
  const rawParts = prepared.split(/\s*\+\s*/).map((part) => part.trim()).filter(Boolean);
  const parts: MixerFrame["parts"] = [];
  let fixedIndex = 0;

  for (const rawPart of rawParts) {
    const inSlot = rawPart.match(/^([\p{Script=Han}]+)\s+in the .+$/u);
    if (inSlot) {
      const label = "unknown slot";
      parts.push({ type: "slot", id: label, label, kind: "verb", options: mixerWords("verb", words) });
      parts.push({ type: "fixed", id: `fixed-${fixedIndex++}`, text: inSlot[1] });
      continue;
    }

    const firstAlternative = rawPart.split(/\s*\/\s*/)[0].trim();
    const label = placeholderLabel(firstAlternative);
    if (label) {
      const normalized = label.toLowerCase().replace(/\s+/g, " ");
      const kind = slotKind(normalized);
      parts.push({ type: "slot", id: normalized, label, kind, options: mixerWords(kind, words, contextualPreference(activeFormula, normalized, kind)) });
      continue;
    }

    const fixed = cleanFixedPart(firstAlternative).replace(/[—-]/g, "");
    if (fixed) parts.push({ type: "fixed", id: `fixed-${fixedIndex++}`, text: fixed });
  }

  return parts;
}

export function buildGrammarMixerFrame(point: GrammarPoint, fallbackFormula: string, words: LevelVocabularyWord[]): MixerFrame {
  const practiceFormula = getGrammarLesson(point).completeFrame ?? point.formula;
  const targetParts = parseFormula(practiceFormula, words);
  if (targetParts.some((part) => part.type === "slot")) {
    return { parts: targetParts, sourceFormula: practiceFormula, usesMissionPattern: false };
  }

  const fallbackParts = parseFormula(fallbackFormula, words);
  if (fallbackParts.some((part) => part.type === "slot")) {
    return { parts: fallbackParts, sourceFormula: fallbackFormula, usesMissionPattern: true };
  }

  return {
    parts: [
      { type: "slot", id: "subject", label: "subject", kind: "subject", options: mixerWords("subject", words) },
      { type: "fixed", id: "fixed-fallback", text: "是" },
      { type: "slot", id: "noun", label: "noun", kind: "noun", options: mixerWords("noun", words) },
    ],
    sourceFormula: "subject + 是 + noun",
    usesMissionPattern: true,
  };
}

export function initialMixerSelections(frame: MixerFrame) {
  const selections: Record<string, number> = {};
  for (const part of frame.parts) {
    if (part.type === "slot" && selections[part.id] === undefined) {
      selections[part.id] = 0;
    }
  }

  const select = (slotId: string, hanzi: string) => {
    const slot = frame.parts.find((part): part is MixerSlotPart => part.type === "slot" && part.id === slotId);
    const index = slot?.options.findIndex((word) => word.hanzi === hanzi) ?? -1;
    if (index >= 0) selections[slotId] = index;
  };

  // Start each lab with a natural model sentence while keeping every slot
  // independently changeable for the learner's own combinations.
  if (frame.sourceFormula === "subject + 有 + object") select("object", "书");
  if (frame.sourceFormula === "subject + verb + 了 + object") {
    select("verb", "吃");
    select("object", "苹果");
  }
  if (frame.sourceFormula === "place + 里 + 有 + number + measure word + noun") {
    select("place", "学校");
    select("number", "一");
    select("measure word", "个");
    select("noun", "学生");
  }
  if (frame.sourceFormula === "noun + 在 + place + 上") {
    select("noun", "书");
    select("place", "桌子");
  }
  if (frame.sourceFormula === "subject + 去 + place + verb + object") {
    select("place", "学校");
    select("verb", "学习");
    select("object", "汉字");
  }
  if (frame.sourceFormula === "new situation + 了") select("new situation", "热");
  if (frame.sourceFormula === "pronoun + family noun") select("family noun", "妈妈");
  if (frame.sourceFormula === "pronoun + family noun + 是 + noun") {
    select("family noun", "妈妈");
    select("noun", "医生");
  }
  if (frame.sourceFormula === "subject + adjective + 了") select("adjective", "热");
  if (frame.sourceFormula === "subject + 有 + 几 + measure word + noun") {
    select("measure word", "本");
    select("noun", "书");
  }
  if (frame.sourceFormula === "subject + 有 + number + measure word + noun") {
    select("measure word", "本");
    select("noun", "书");
  }
  if (frame.sourceFormula === "你 + 多 + adjective") select("adjective", "大");
  if (frame.sourceFormula === "subject + 来 + 我家 + 吧") select("subject", "你");
  if (frame.sourceFormula === "subject + 先 + verb 1 + ， + 再 + verb 2") {
    select("verb 1", "吃");
    select("verb 2", "学习");
  }
  if (frame.sourceFormula === "subject + 给 + person + number + measure word + noun") {
    select("person", "妈妈");
    select("number", "一");
    select("measure word", "本");
    select("noun", "书");
  }

  if (frame.sourceFormula === "subject + 想 + 不 + 想 + verb + object") select("subject", "你");
  if (frame.sourceFormula === "subject + 是 + noun + 吗" || frame.sourceFormula === "subject + 是不是 + noun") select("subject", "你");
  if (frame.sourceFormula === "subject + 想 + verb + question word" || frame.sourceFormula === "subject + 想 + verb + 什么") select("subject", "你");
  if (frame.sourceFormula === "subject + 喜欢 + 哪个 + noun") select("subject", "你");
  if (frame.sourceFormula === "subject + 有 + 几 + measure word + noun") select("subject", "你");
  if (frame.sourceFormula === "subject + 是 + noun + ， + 是吗") select("subject", "他");
  if (frame.sourceFormula === "请 + verb + object" || frame.sourceFormula === "不要 + verb + object") {
    select("verb", "看");
    select("object", "书");
  }
  if (frame.sourceFormula === "这个 + noun + 怎么 + verb") {
    select("noun", "汉字");
    select("verb", "写");
  }
  if (frame.sourceFormula === "这 + measure word + noun + 多少 + 钱") {
    select("measure word", "本");
    select("noun", "书");
  }
  if (frame.sourceFormula === "哪些 + noun + 是 + owner + 的") select("owner", "你");
  if (frame.sourceFormula === "这个 + noun + 怎么样") select("noun", "书");
  if (frame.sourceFormula === "您 + 是 + noun + 吗") select("noun", "老师");
  if (frame.sourceFormula === "今天 + 是 + month + 月 + day + 日") {
    select("month", "五");
    select("day", "八");
  }
  if (frame.sourceFormula === "现在 + 是 + hour + 点 + minute + 分") {
    select("hour", "九");
    select("minute", "十");
  }
  if (frame.sourceFormula === "subject + hour + 点半 + verb") {
    select("subject", "我");
    select("hour", "八");
  }
  if (frame.sourceFormula === "subject + 会 + verb + object" || frame.sourceFormula === "subject + modal + verb + object") {
    select("verb", "写");
    select("object", "汉字");
  }
  if (frame.sourceFormula === "subject + 非常 + adjective") select("adjective", "高兴");

  // Run the same compatibility rules used after learner changes so the
  // opening model never starts with a mismatched verb/object, classifier/noun,
  // or located noun/place pair.
  for (const slot of uniqueSlots(frame)) {
    Object.assign(selections, updateMixerSelection(frame, selections, slot.id, selections[slot.id] ?? 0).selections);
  }

  return selections;
}

export function mixerExpectedTokens(frame: MixerFrame, selections: Record<string, number>) {
  return frame.parts.map((part) => {
    if (part.type === "fixed") return part.text;
    return part.options[selections[part.id] ?? 0]?.hanzi ?? part.label;
  });
}

export type MixerSelectionUpdate = {
  selections: Record<string, number>;
  adjustedSlotIds: string[];
  note: string;
};

function uniqueSlots(frame: MixerFrame) {
  return frame.parts
    .filter((part): part is MixerSlotPart => part.type === "slot")
    .filter((part, index, items) => items.findIndex((item) => item.id === part.id) === index);
}

function selectedHanzi(slot: MixerSlotPart | undefined, selections: Record<string, number>) {
  if (!slot) return "";
  return slot.options[selections[slot.id] ?? 0]?.hanzi ?? "";
}

function setSlotToFirstMatch(
  next: Record<string, number>,
  slot: MixerSlotPart | undefined,
  preferredHanzi: string[],
  adjusted: string[],
) {
  if (!slot || preferredHanzi.length === 0) return;
  const current = selectedHanzi(slot, next);
  if (preferredHanzi.includes(current)) return;
  const optionIndex = preferredHanzi
    .map((hanzi) => slot.options.findIndex((option) => option.hanzi === hanzi))
    .find((index) => index >= 0) ?? -1;
  if (optionIndex < 0) return;
  next[slot.id] = optionIndex;
  if (!adjusted.includes(slot.id)) adjusted.push(slot.id);
}

function firstReverseMatch(relations: Record<string, string[]>, value: string) {
  return Object.entries(relations).filter(([, matches]) => matches.includes(value)).map(([key]) => key);
}

export function updateMixerSelection(
  frame: MixerFrame,
  selections: Record<string, number>,
  changedSlotId: string,
  optionIndex: number,
): MixerSelectionUpdate {
  const slots = uniqueSlots(frame);
  const byId = new Map(slots.map((slot) => [slot.id, slot]));
  const changedSlot = byId.get(changedSlotId);
  const next = { ...selections, [changedSlotId]: optionIndex };
  const adjusted: string[] = [];
  const changedHanzi = selectedHanzi(changedSlot, next);
  const measureSlot = slots.find((slot) => slot.kind === "measure");
  const nounSlot = slots.find((slot) => slot.kind === "noun");
  const placeSlot = slots.find((slot) => slot.kind === "place");
  const verbSlots = slots.filter((slot) => slot.kind === "verb");
  const formula = frame.sourceFormula.toLowerCase().replace(/\s+/g, " ");

  if (measureSlot && nounSlot) {
    if (changedSlotId === measureSlot.id) setSlotToFirstMatch(next, nounSlot, measureNouns[changedHanzi] ?? [], adjusted);
    if (changedSlotId === nounSlot.id) setSlotToFirstMatch(next, measureSlot, firstReverseMatch(measureNouns, changedHanzi), adjusted);
  }

  if (verbSlots.length === 1 && nounSlot && /verb.*(object|noun)|(object|noun).*verb/.test(formula)) {
    const verbSlot = verbSlots[0];
    if (changedSlotId === verbSlot.id) setSlotToFirstMatch(next, nounSlot, verbObjects[changedHanzi] ?? [], adjusted);
    if (changedSlotId === nounSlot.id) setSlotToFirstMatch(next, verbSlot, firstReverseMatch(verbObjects, changedHanzi), adjusted);
  }

  if (nounSlot && placeSlot && /noun \+ 在 \+ place/.test(formula)) {
    if (changedSlotId === nounSlot.id) setSlotToFirstMatch(next, placeSlot, nounPlaces[changedHanzi] ?? [], adjusted);
    if (changedSlotId === placeSlot.id) setSlotToFirstMatch(next, nounSlot, firstReverseMatch(nounPlaces, changedHanzi), adjusted);
  }

  if (verbSlots.length >= 2 && placeSlot && /verb 1 \+ place \+ verb 2/.test(formula)) {
    const firstVerb = byId.get("verb 1") ?? verbSlots[0];
    const secondVerb = byId.get("verb 2") ?? verbSlots[1];
    if (changedSlotId === placeSlot.id) {
      setSlotToFirstMatch(next, firstVerb, ["去"], adjusted);
      setSlotToFirstMatch(next, secondVerb, placeActions[changedHanzi] ?? [], adjusted);
    }
    if (changedSlotId === secondVerb.id) {
      setSlotToFirstMatch(next, placeSlot, firstReverseMatch(placeActions, changedHanzi), adjusted);
      setSlotToFirstMatch(next, firstVerb, ["去"], adjusted);
    }
  }

  const adjustedLabels = adjusted.map((slotId) => byId.get(slotId)?.label ?? slotId);
  const note = adjustedLabels.length
    ? `Updated ${adjustedLabels.join(" and ")} so the words describe a natural situation.`
    : "This choice fits the rest of the sentence.";
  return { selections: next, adjustedSlotIds: adjusted, note };
}
