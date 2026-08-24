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

type ConversationScenario = "social" | "question" | "service" | "directions" | "plan" | "report" | "opinion" | "checkpoint";
type MissionDialogue = { opener: ConversationSupport; reply: ConversationSupport; closing: ConversationSupport };

const foundationDialogues: Record<ConversationScenario, MissionDialogue> = {
  social: {
    opener: { hanzi: "你好，可以介绍一下吗？", pinyin: "Nǐ hǎo, kěyǐ jièshào yíxià ma?", translation: "Hello, can you tell me about it?" },
    reply: { hanzi: "原来是这样。", pinyin: "Yuánlái shì zhèyàng.", translation: "I see." },
    closing: { hanzi: "对，就是这样。", pinyin: "Duì, jiù shì zhèyàng.", translation: "Yes, that’s right." },
  },
  question: {
    opener: { hanzi: "你好，你想问什么？", pinyin: "Nǐ hǎo, nǐ xiǎng wèn shénme?", translation: "Hello, what would you like to ask?" },
    reply: { hanzi: "我来帮你看一下。", pinyin: "Wǒ lái bāng nǐ kàn yíxià.", translation: "I’ll help you check." },
    closing: { hanzi: "好的，谢谢。", pinyin: "Hǎo de, xièxie.", translation: "Okay, thank you." },
  },
  service: {
    opener: { hanzi: "你好，需要什么帮助？", pinyin: "Nǐ hǎo, xūyào shénme bāngzhù?", translation: "Hello, how can I help?" },
    reply: { hanzi: "好的，我来帮你。", pinyin: "Hǎo de, wǒ lái bāng nǐ.", translation: "Okay, I’ll help you." },
    closing: { hanzi: "好的，谢谢你。", pinyin: "Hǎo de, xièxie nǐ.", translation: "Okay, thank you." },
  },
  directions: {
    opener: { hanzi: "请问，我应该怎么走？", pinyin: "Qǐngwèn, wǒ yīnggāi zěnme zǒu?", translation: "Excuse me, which way should I go?" },
    reply: { hanzi: "好的，我明白了。谢谢！", pinyin: "Hǎo de, wǒ míngbai le. Xièxie!", translation: "Okay, I understand. Thank you!" },
    closing: { hanzi: "不客气。", pinyin: "Bú kèqi.", translation: "You’re welcome." },
  },
  plan: {
    opener: { hanzi: "你觉得我们应该怎么办？", pinyin: "Nǐ juéde wǒmen yīnggāi zěnme bàn?", translation: "What do you think we should do?" },
    reply: { hanzi: "好的，这个办法很好。", pinyin: "Hǎo de, zhège bànfǎ hěn hǎo.", translation: "Okay, that’s a good approach." },
    closing: { hanzi: "好，那就这样吧。", pinyin: "Hǎo, nà jiù zhèyàng ba.", translation: "Good, let’s do that." },
  },
  report: {
    opener: { hanzi: "请说说发生了什么。", pinyin: "Qǐng shuōshuo fāshēng le shénme.", translation: "Please tell me what happened." },
    reply: { hanzi: "好的，我明白了。", pinyin: "Hǎo de, wǒ míngbai le.", translation: "Okay, I understand." },
    closing: { hanzi: "如果有问题，我们再讨论。", pinyin: "Rúguǒ yǒu wèntí, wǒmen zài tǎolùn.", translation: "If there are questions, we can discuss them further." },
  },
  opinion: {
    opener: { hanzi: "你怎么看这个问题？", pinyin: "Nǐ zěnme kàn zhège wèntí?", translation: "What do you think about this issue?" },
    reply: { hanzi: "你的想法很清楚。", pinyin: "Nǐ de xiǎngfǎ hěn qīngchu.", translation: "Your idea is very clear." },
    closing: { hanzi: "谢谢，我也想听听你的看法。", pinyin: "Xièxie, wǒ yě xiǎng tīngting nǐ de kànfǎ.", translation: "Thank you. I’d also like to hear your view." },
  },
  checkpoint: {
    opener: { hanzi: "你现在可以用中文做什么？", pinyin: "Nǐ xiànzài kěyǐ yòng Zhōngwén zuò shénme?", translation: "What can you do in Chinese now?" },
    reply: { hanzi: "很好，你进步了！", pinyin: "Hěn hǎo, nǐ jìnbù le!", translation: "Great, you’ve improved!" },
    closing: { hanzi: "谢谢，我会继续练习。", pinyin: "Xièxie, wǒ huì jìxù liànxí.", translation: "Thank you. I’ll keep practicing." },
  },
};

const independentDialogues: Record<ConversationScenario, MissionDialogue> = {
  social: {
    opener: { hanzi: "请介绍一下你的情况。", pinyin: "Qǐng jièshào yíxià nǐ de qíngkuàng.", translation: "Please tell me about your situation." },
    reply: { hanzi: "原来如此，我了解了。", pinyin: "Yuánlái rúcǐ, wǒ liǎojiě le.", translation: "I see. I understand now." },
    closing: { hanzi: "对，这就是我的情况。", pinyin: "Duì, zhè jiù shì wǒ de qíngkuàng.", translation: "Yes, that’s my situation." },
  },
  question: {
    opener: { hanzi: "你想了解哪方面的情况？", pinyin: "Nǐ xiǎng liǎojiě nǎ fāngmiàn de qíngkuàng?", translation: "What would you like to find out about?" },
    reply: { hanzi: "我确认以后再告诉你。", pinyin: "Wǒ quèrèn yǐhòu zài gàosu nǐ.", translation: "I’ll confirm it and then tell you." },
    closing: { hanzi: "好的，麻烦你了。", pinyin: "Hǎo de, máfan nǐ le.", translation: "Okay, thank you for taking care of it." },
  },
  service: {
    opener: { hanzi: "你好，需要我帮你处理什么？", pinyin: "Nǐ hǎo, xūyào wǒ bāng nǐ chǔlǐ shénme?", translation: "Hello, what do you need me to help with?" },
    reply: { hanzi: "好的，我马上帮你处理。", pinyin: "Hǎo de, wǒ mǎshàng bāng nǐ chǔlǐ.", translation: "Okay, I’ll take care of it right away." },
    closing: { hanzi: "谢谢，麻烦你了。", pinyin: "Xièxie, máfan nǐ le.", translation: "Thank you for handling it." },
  },
  directions: {
    opener: { hanzi: "请问，接下来应该怎么走？", pinyin: "Qǐngwèn, jiēxiàlái yīnggāi zěnme zǒu?", translation: "Excuse me, which way should I go next?" },
    reply: { hanzi: "明白了，谢谢你说得这么清楚。", pinyin: "Míngbai le, xièxie nǐ shuō de zhème qīngchu.", translation: "I understand. Thank you for explaining it so clearly." },
    closing: { hanzi: "不客气，路上小心。", pinyin: "Bú kèqi, lùshang xiǎoxīn.", translation: "You’re welcome. Take care on the way." },
  },
  plan: {
    opener: { hanzi: "关于这件事，你有什么建议？", pinyin: "Guānyú zhè jiàn shì, nǐ yǒu shénme jiànyì?", translation: "What do you suggest we do about this?" },
    reply: { hanzi: "这个建议很合理。", pinyin: "Zhège jiànyì hěn hélǐ.", translation: "That suggestion is very reasonable." },
    closing: { hanzi: "好，我们就按这个办法做。", pinyin: "Hǎo, wǒmen jiù àn zhège bànfǎ zuò.", translation: "Good, we’ll do it that way." },
  },
  report: {
    opener: { hanzi: "请说明一下具体情况。", pinyin: "Qǐng shuōmíng yíxià jùtǐ qíngkuàng.", translation: "Please explain the situation." },
    reply: { hanzi: "好的，前因后果已经清楚了。", pinyin: "Hǎo de, qiányīn-hòuguǒ yǐjīng qīngchu le.", translation: "Okay, the context is clear now." },
    closing: { hanzi: "如果需要，我可以补充更多信息。", pinyin: "Rúguǒ xūyào, wǒ kěyǐ bǔchōng gèng duō xìnxī.", translation: "If needed, I can add more information." },
  },
  opinion: {
    opener: { hanzi: "你如何看待这个问题？", pinyin: "Nǐ rúhé kàndài zhège wèntí?", translation: "How do you view this issue?" },
    reply: { hanzi: "你的观点很清楚，也很有道理。", pinyin: "Nǐ de guāndiǎn hěn qīngchu, yě hěn yǒu dàolǐ.", translation: "Your view is clear and makes sense." },
    closing: { hanzi: "谢谢，我也想听听你的意见。", pinyin: "Xièxie, wǒ yě xiǎng tīngting nǐ de yìjiàn.", translation: "Thank you. I’d also like to hear your opinion." },
  },
  checkpoint: {
    opener: { hanzi: "现在你能独立处理哪些问题？", pinyin: "Xiànzài nǐ néng dúlì chǔlǐ nǎxiē wèntí?", translation: "What problems can you handle independently now?" },
    reply: { hanzi: "很好，你的表达进步很大。", pinyin: "Hěn hǎo, nǐ de biǎodá jìnbù hěn dà.", translation: "Excellent. Your expression has improved a lot." },
    closing: { hanzi: "谢谢，我会继续提高。", pinyin: "Xièxie, wǒ huì jìxù tígāo.", translation: "Thank you. I’ll keep improving." },
  },
};

const advancedDialogues: Record<ConversationScenario, MissionDialogue> = {
  social: {
    opener: { hanzi: "请概括一下相关情况。", pinyin: "Qǐng gàikuò yíxià xiāngguān qíngkuàng.", translation: "Please summarize the relevant situation." },
    reply: { hanzi: "好的，背景已经很清楚了。", pinyin: "Hǎo de, bèijǐng yǐjīng hěn qīngchu le.", translation: "Good, the background is clear now." },
    closing: { hanzi: "如有需要，我可以进一步补充。", pinyin: "Rú yǒu xūyào, wǒ kěyǐ jìnyíbù bǔchōng.", translation: "If needed, I can add further details." },
  },
  question: {
    opener: { hanzi: "您希望了解哪个方面？", pinyin: "Nín xīwàng liǎojiě nǎge fāngmiàn?", translation: "Which aspect would you like to understand?" },
    reply: { hanzi: "我会核实相关信息后回复您。", pinyin: "Wǒ huì héshí xiāngguān xìnxī hòu huífù nín.", translation: "I’ll verify the relevant information and reply." },
    closing: { hanzi: "好的，感谢您的协助。", pinyin: "Hǎo de, gǎnxiè nín de xiézhù.", translation: "Thank you for your assistance." },
  },
  service: {
    opener: { hanzi: "请问您需要我们如何处理？", pinyin: "Qǐngwèn nín xūyào wǒmen rúhé chǔlǐ?", translation: "How would you like us to handle this?" },
    reply: { hanzi: "好的，我们会按要求推进。", pinyin: "Hǎo de, wǒmen huì àn yāoqiú tuījìn.", translation: "Understood. We’ll proceed as requested." },
    closing: { hanzi: "谢谢，后续保持沟通。", pinyin: "Xièxie, hòuxù bǎochí gōutōng.", translation: "Thank you. Let’s stay in contact as this proceeds." },
  },
  directions: {
    opener: { hanzi: "请说明接下来的具体路径。", pinyin: "Qǐng shuōmíng jiēxiàlái de jùtǐ lùjìng.", translation: "Please explain the specific route from here." },
    reply: { hanzi: "明白了，路线非常清楚。", pinyin: "Míngbai le, lùxiàn fēicháng qīngchu.", translation: "Understood. The route is very clear." },
    closing: { hanzi: "不客气，祝您一路顺利。", pinyin: "Bú kèqi, zhù nín yílù shùnlì.", translation: "You’re welcome. Have a smooth journey." },
  },
  plan: {
    opener: { hanzi: "针对这一情况，您建议采取什么措施？", pinyin: "Zhēnduì zhè yī qíngkuàng, nín jiànyì cǎiqǔ shénme cuòshī?", translation: "What action do you recommend for this situation?" },
    reply: { hanzi: "这个方案具有可行性。", pinyin: "Zhège fāng'àn jùyǒu kěxíngxìng.", translation: "This proposal is feasible." },
    closing: { hanzi: "好，我们就按这个思路推进。", pinyin: "Hǎo, wǒmen jiù àn zhège sīlù tuījìn.", translation: "Good, we’ll proceed along those lines." },
  },
  report: {
    opener: { hanzi: "请概括一下目前的具体情况。", pinyin: "Qǐng gàikuò yíxià mùqián de jùtǐ qíngkuàng.", translation: "Please summarize the current situation." },
    reply: { hanzi: "好的，问题的来龙去脉已经清楚了。", pinyin: "Hǎo de, wèntí de láilóng-qùmài yǐjīng qīngchu le.", translation: "Good, the cause and course of the issue are clear now." },
    closing: { hanzi: "如有需要，我可以进一步提供依据。", pinyin: "Rú yǒu xūyào, wǒ kěyǐ jìnyíbù tígōng yījù.", translation: "If needed, I can provide further evidence." },
  },
  opinion: {
    opener: { hanzi: "您对这一问题持什么立场？", pinyin: "Nín duì zhè yī wèntí chí shénme lìchǎng?", translation: "What position do you take on this issue?" },
    reply: { hanzi: "您的论点清晰，依据也很充分。", pinyin: "Nín de lùndiǎn qīngxī, yījù yě hěn chōngfèn.", translation: "Your argument is clear and well supported." },
    closing: { hanzi: "谢谢，我也希望听听您的分析。", pinyin: "Xièxie, wǒ yě xīwàng tīngting nín de fēnxī.", translation: "Thank you. I’d also like to hear your analysis." },
  },
  checkpoint: {
    opener: { hanzi: "您目前能在专业语境中完成哪些任务？", pinyin: "Nín mùqián néng zài zhuānyè yǔjìng zhōng wánchéng nǎxiē rènwu?", translation: "What tasks can you now complete in professional contexts?" },
    reply: { hanzi: "很好，您的表达已经准确而有条理。", pinyin: "Hěn hǎo, nín de biǎodá yǐjīng zhǔnquè ér yǒu tiáolǐ.", translation: "Excellent. Your expression is now accurate and well organized." },
    closing: { hanzi: "谢谢，我会继续提高表达的深度。", pinyin: "Xièxie, wǒ huì jìxù tígāo biǎodá de shēndù.", translation: "Thank you. I’ll keep developing greater depth in my expression." },
  },
};

const missionDialogueOverrides: Record<string, MissionDialogue> = {
  "Meet someone": {
    opener: { hanzi: "你好，你叫什么名字？", pinyin: "Nǐ hǎo, nǐ jiào shénme míngzi?", translation: "Hello, what’s your name?" },
    reply: { hanzi: "我叫李明，很高兴认识你。", pinyin: "Wǒ jiào Lǐ Míng, hěn gāoxìng rènshi nǐ.", translation: "I’m Li Ming. Nice to meet you." },
    closing: { hanzi: "我也很高兴认识你。", pinyin: "Wǒ yě hěn gāoxìng rènshi nǐ.", translation: "Nice to meet you too." },
  },
  "Make a plan": {
    opener: { hanzi: "你准备好了吗？", pinyin: "Nǐ zhǔnbèi hǎo le ma?", translation: "Are you ready?" },
    reply: { hanzi: "好，那我们开始吧。", pinyin: "Hǎo, nà wǒmen kāishǐ ba.", translation: "Good, then let’s begin." },
    closing: { hanzi: "好，我们开始吧。", pinyin: "Hǎo, wǒmen kāishǐ ba.", translation: "Okay, let’s begin." },
  },
  "Compare choices": {
    opener: { hanzi: "你觉得哪件衣服更好？", pinyin: "Nǐ juéde nǎ jiàn yīfu gèng hǎo?", translation: "Which item of clothing do you think is better?" },
    reply: { hanzi: "那我们选这件吧。", pinyin: "Nà wǒmen xuǎn zhè jiàn ba.", translation: "Then let’s choose this one." },
    closing: { hanzi: "好，我也觉得这件更合适。", pinyin: "Hǎo, wǒ yě juéde zhè jiàn gèng héshì.", translation: "Okay, I also think this one is more suitable." },
  },
  "Secure your belongings": {
    opener: { hanzi: "你把护照放在哪里了？", pinyin: "Nǐ bǎ hùzhào fàng zài nǎlǐ le?", translation: "Where did you put the passport?" },
    reply: { hanzi: "很好，放在包里比较安全。", pinyin: "Hěn hǎo, fàng zài bāo lǐ bǐjiào ānquán.", translation: "Good. It’s safer in the bag." },
    closing: { hanzi: "对，我会保管好它。", pinyin: "Duì, wǒ huì bǎoguǎn hǎo tā.", translation: "Right, I’ll keep it safe." },
  },
  "Do two things together": {
    opener: { hanzi: "他做饭的时候在做什么？", pinyin: "Tā zuòfàn de shíhou zài zuò shénme?", translation: "What does he do while cooking?" },
    reply: { hanzi: "原来他喜欢一边做饭一边听音乐。", pinyin: "Yuánlái tā xǐhuan yìbiān zuòfàn yìbiān tīng yīnyuè.", translation: "I see, he likes listening to music while cooking." },
    closing: { hanzi: "对，这样做饭更有意思。", pinyin: "Duì, zhèyàng zuòfàn gèng yǒuyìsi.", translation: "Right, cooking is more enjoyable that way." },
  },
  "Keep a commitment": {
    opener: { hanzi: "天气那么差，你们最后按时出发了吗？", pinyin: "Tiānqì nàme chà, nǐmen zuìhòu ànshí chūfā le ma?", translation: "The weather was so bad—did you leave on time in the end?" },
    reply: { hanzi: "是的，你们遵守了承诺。", pinyin: "Shì de, nǐmen zūnshǒu le chéngnuò.", translation: "Yes, you kept your commitment." },
    closing: { hanzi: "对，我们答应了就要做到。", pinyin: "Duì, wǒmen dāying le jiù yào zuòdào.", translation: "Right. If we promise something, we should do it." },
  },
  "State a universal rule": {
    opener: { hanzi: "他遇到问题时一般怎么样？", pinyin: "Tā yùdào wèntí shí yìbān zěnmeyàng?", translation: "How does he usually react when he encounters a problem?" },
    reply: { hanzi: "难怪大家都很信任他。", pinyin: "Nánguài dàjiā dōu hěn xìnrèn tā.", translation: "No wonder everyone trusts him." },
    closing: { hanzi: "我也觉得冷静很重要。", pinyin: "Wǒ yě juéde lěngjìng hěn zhòngyào.", translation: "I also think staying calm is important." },
  },
  "Warn about a trigger": {
    opener: { hanzi: "你为什么强调维护信任？", pinyin: "Nǐ wèishénme qiángdiào wéihù xìnrèn?", translation: "Why do you emphasize protecting trust?" },
    reply: { hanzi: "确实，失去信任会影响长期合作。", pinyin: "Quèshí, shīqù xìnrèn huì yǐngxiǎng chángqī hézuò.", translation: "Indeed, losing trust affects long-term cooperation." },
    closing: { hanzi: "所以我们必须认真维护信任。", pinyin: "Suǒyǐ wǒmen bìxū rènzhēn wéihù xìnrèn.", translation: "So we must protect trust carefully." },
  },
  "Define a concept": {
    opener: { hanzi: "你怎么理解“专业”？", pinyin: "Nǐ zěnme lǐjiě ‘zhuānyè’?", translation: "How do you understand ‘professionalism’?" },
    reply: { hanzi: "这个定义强调了持续的标准。", pinyin: "Zhège dìngyì qiángdiào le chíxù de biāozhǔn.", translation: "This definition emphasizes consistent standards." },
    closing: { hanzi: "对，细节最能体现专业程度。", pinyin: "Duì, xìjié zuì néng tǐxiàn zhuānyè chéngdù.", translation: "Right. Details show the level of professionalism most clearly." },
  },
  "Define a technical idea": {
    opener: { hanzi: "请解释一下什么是“韧性”。", pinyin: "Qǐng jiěshì yíxià shénme shì ‘rènxìng’.", translation: "Please explain what ‘resilience’ is." },
    reply: { hanzi: "这个定义清楚地说明了系统的恢复能力。", pinyin: "Zhège dìngyì qīngchu de shuōmíng le xìtǒng de huīfù nénglì.", translation: "That definition clearly explains a system’s ability to recover." },
    closing: { hanzi: "是的，恢复能力是这个概念的核心。", pinyin: "Shì de, huīfù nénglì shì zhège gàiniàn de héxīn.", translation: "Yes, recovery ability is the core of the concept." },
  },
  "Write a policy rule": {
    opener: { hanzi: "谁可以提交申请？", pinyin: "Shéi kěyǐ tíjiāo shēnqǐng?", translation: "Who may submit an application?" },
    reply: { hanzi: "明白了，符合条件是基本要求。", pinyin: "Míngbai le, fúhé tiáojiàn shì jīběn yāoqiú.", translation: "Understood. Meeting the conditions is the basic requirement." },
    closing: { hanzi: "对，所有申请人都必须满足条件。", pinyin: "Duì, suǒyǒu shēnqǐngrén dōu bìxū mǎnzú tiáojiàn.", translation: "Right. Every applicant must meet the conditions." },
  },
  "Deliver a ceremonial statement": {
    opener: { hanzi: "在合作十周年之际，您想说些什么？", pinyin: "Zài hézuò shí zhōunián zhī jì, nín xiǎng shuō xiē shénme?", translation: "What would you like to say on the tenth anniversary of our cooperation?" },
    reply: { hanzi: "感谢贵方多年来的信任与支持。", pinyin: "Gǎnxiè guìfāng duōnián lái de xìnrèn yǔ zhīchí.", translation: "Thank you for your trust and support over the years." },
    closing: { hanzi: "期待我们今后继续深化合作。", pinyin: "Qīdài wǒmen jīnhòu jìxù shēnhuà hézuò.", translation: "We look forward to deepening our cooperation in the future." },
  },
};

function conversationScenario(mission: CourseMission): ConversationScenario {
  const title = mission.title.toLowerCase();
  if (title.includes("checkpoint") || title.includes("hsk 1 mission")) return "checkpoint";
  if (title.includes("follow directions")) return "directions";
  if (/meet someone|family|daily routine|time & dates|study & work|move around|share experience|describe a person|talk about habits|add another fact|give background/.test(title)) return "social";
  if (mission.phrase.includes("？") || mission.translation.trim().endsWith("?")) return "question";
  if (/order|health|ask for help/.test(title)) return "service";
  if (/plan|prepare|choose|arrange|commitment|alternative|recommend|condition|preference|rule|requirement|policy|strict|warn|change a travel|act on known/.test(title)) return "plan";
  if (/report|explain|cause|incident|impact|effect|development|rationale|assumption|delay|what happened|gradual|improvement|secure/.test(title)) return "report";
  return "opinion";
}

function dialogueRegister(mission: CourseMission) {
  if (mission.level === "1" || mission.level === "2") return foundationDialogues;
  if (mission.level === "3" || mission.level === "4" || mission.level === "5") return independentDialogues;
  return advancedDialogues;
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
  void phase;
  const dialogue = missionDialogueOverrides[mission.title] ?? dialogueRegister(mission)[conversationScenario(mission)];
  return [
    { speaker: "PARTNER", learner: false, ...dialogue.opener },
    { speaker: "YOU", learner: true, hanzi: mission.phrase, pinyin: mission.pinyin, translation: mission.translation },
    { speaker: "PARTNER", learner: false, ...dialogue.reply },
    { speaker: "YOU", learner: true, ...dialogue.closing },
  ];
}
