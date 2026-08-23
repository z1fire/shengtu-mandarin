import type { GrammarPoint } from "./hsk-data.ts";
import type { LevelVocabularyWord } from "./level-content.ts";

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
  number: ["一", "两", "三", "四", "五", "十"],
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
  if (/year|month|day|hour|number/.test(value)) return "number";
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
  if (/^(subject|owner|person|pronoun|agent|plural subject|noun|object|family noun|topic|verb|verb \d+|action|habitual|completed|predicate|event|proposal|statement|content|method|result|new situation|adjective|degree|symptom|place|destination|direction|time|year|month|day|hour|number|measure|measure word|modal|question word|a|b)$/i.test(value)) return value;
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
    .replace(/[，,]/g, " + ");
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
  const targetParts = parseFormula(point.formula, words);
  if (targetParts.some((part) => part.type === "slot")) {
    return { parts: targetParts, sourceFormula: point.formula, usesMissionPattern: false };
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
  if (frame.sourceFormula === "verb + 了 + object") {
    select("verb", "吃");
    select("object", "苹果");
  }
  if (frame.sourceFormula === "place + 有 + number + measure word + noun") {
    select("place", "学校");
    select("number", "一");
    select("measure word", "个");
    select("noun", "学生");
  }
  if (frame.sourceFormula === "noun + 在 + place + 上 / 下 / 里 / 外") {
    select("noun", "书");
    select("place", "桌子");
  }
  if (frame.sourceFormula === "verb 1 + place + verb 2") {
    select("verb 1", "去");
    select("place", "学校");
    select("verb 2", "学习");
  }
  if (frame.sourceFormula === "new situation + 了") select("new situation", "热");
  if (frame.sourceFormula === "pronoun + family noun") select("family noun", "妈妈");

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
