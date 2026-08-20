export type VocabularyWord = {
  hanzi: string;
  pinyin: string;
  meaning: string;
  example: string;
  collocation: string;
  note?: string;
};

const vocabularyRaw = `
爱|ài|to love; love
八|bā|eight
爸爸|bàba|dad; father
吧|ba|suggestion particle
白天|báitiān|daytime
百|bǎi|hundred
半|bàn|half
包子|bāozi|steamed bun
杯子|bēizi|cup; glass
本|běn|measure word for books
边|biān|side; edge
病|bìng|illness; to be sick
不|bù|not; no
不客气|bú kèqi|you’re welcome
不要|búyào|don’t; do not want
菜|cài|dish; vegetable
茶|chá|tea
唱|chàng|to sing
超市|chāoshì|supermarket
车|chē|car; vehicle
吃|chī|to eat
出租车|chūzūchē|taxi
穿|chuān|to wear; put on
打电话|dǎ diànhuà|to make a phone call
大|dà|big; old
大家|dàjiā|everyone
大学|dàxué|university
大学生|dàxuéshēng|university student
到|dào|to arrive; reach
的|de|possessive particle
第|dì|ordinal prefix
弟弟|dìdi|younger brother
点|diǎn|o’clock; point
店|diàn|shop; store
电话|diànhuà|telephone
电脑|diànnǎo|computer
电视|diànshì|television
电影|diànyǐng|movie
电影院|diànyǐngyuàn|cinema
东西|dōngxi|thing; stuff
都|dōu|all; both
读|dú|to read
读书|dúshū|to read; study
对|duì|correct; toward
对不起|duìbuqǐ|sorry
多|duō|many; much
多少|duōshao|how many; how much
儿子|érzi|son
二|èr|two
饭|fàn|meal; cooked rice
饭店|fàndiàn|restaurant; hotel
房间|fángjiān|room
非常|fēicháng|very; extremely
飞机|fēijī|airplane
分|fēn|minute; part
分钟|fēnzhōng|minute
高兴|gāoxìng|happy; glad
歌|gē|song
哥哥|gēge|older brother
个|gè|general measure word
给|gěi|to give
公司|gōngsī|company
工作|gōngzuò|to work; job
狗|gǒu|dog
贵|guì|expensive
国|guó|country
还|hái|also; still
孩子|háizi|child
汉语|Hànyǔ|Mandarin Chinese
汉字|Hànzì|Chinese character
好|hǎo|good; well
好吃|hǎochī|tasty
好看|hǎokàn|good-looking; worth watching
好听|hǎotīng|pleasant to hear
好玩儿|hǎowánr|fun
号|hào|date; number
喝|hē|to drink
和|hé|and; with
很|hěn|very
后|hòu|behind; after
回|huí|to return
会|huì|can; know how to
火车|huǒchē|train
鸡蛋|jīdàn|egg
几|jǐ|how many; several
家|jiā|home; family
家人|jiārén|family member
见|jiàn|to see; meet
件|jiàn|measure word for clothes
饺子|jiǎozi|dumpling
叫|jiào|to be called; call
姐姐|jiějie|older sister
今年|jīnnián|this year
今天|jīntiān|today
九|jiǔ|nine
觉得|juéde|to feel; think
开|kāi|to open; start
开车|kāichē|to drive
看|kàn|to look; watch; read
看病|kànbìng|to see a doctor
看见|kànjiàn|to see
可以|kěyǐ|may; can
课|kè|class; lesson
口|kǒu|mouth; family measure word
块|kuài|piece; colloquial yuan
来|lái|to come
老师|lǎoshī|teacher
了|le|completed-action particle
冷|lěng|cold
里|lǐ|inside
两|liǎng|two (before measure words)
零|líng|zero
六|liù|six
妈妈|māma|mom; mother
吗|ma|yes-no question particle
买|mǎi|to buy
卖|mài|to sell
忙|máng|busy
猫|māo|cat
没关系|méi guānxi|no problem
没事|méishì|it’s okay; nothing
没有|méiyǒu|to not have; there isn’t
妹妹|mèimei|younger sister
们|men|plural suffix
米饭|mǐfàn|cooked rice
面包|miànbāo|bread
面条儿|miàntiáor|noodles
明年|míngnián|next year
明天|míngtiān|tomorrow
名字|míngzi|name
哪|nǎ|which
哪个|nǎge|which one
哪里|nǎlǐ|where
哪儿|nǎr|where
哪些|nǎxiē|which ones
那|nà|that
那边|nàbiān|over there
那个|nàge|that one
那里|nàlǐ|there
那儿|nàr|there
那些|nàxiē|those
男|nán|male; man
男朋友|nánpéngyou|boyfriend
呢|ne|topic or progressive particle
能|néng|can; be able to
你|nǐ|you
你好|nǐhǎo|hello
你们|nǐmen|you (plural)
年|nián|year
您|nín|you (polite)
牛奶|niúnǎi|milk
女|nǚ|female; woman
女儿|nǚ’ér|daughter
女朋友|nǚpéngyou|girlfriend
女士|nǚshì|Ms.; lady
朋友|péngyou|friend
便宜|piányi|cheap; inexpensive
漂亮|piàoliang|pretty; beautiful
苹果|píngguǒ|apple
七|qī|seven
起床|qǐchuáng|to get up
千|qiān|thousand
前|qián|in front; before
钱|qián|money
请|qǐng|please; invite
请问|qǐngwèn|excuse me; may I ask
去|qù|to go
去年|qùnián|last year
热|rè|hot
人|rén|person; people
认识|rènshi|to know; meet
日|rì|day; date
三|sān|three
商店|shāngdiàn|shop; store
上|shàng|up; on
上班|shàngbān|to go to work
上课|shàngkè|to attend class
上午|shàngwǔ|morning
上学|shàngxué|to go to school
少|shǎo|few; little
谁|shéi/shuí|who
什么|shénme|what
生病|shēngbìng|to get sick
十|shí|ten
时候|shíhou|time; moment
时间|shíjiān|time
事|shì|matter; thing
是|shì|to be
手机|shǒujī|mobile phone
书|shū|book
书店|shūdiàn|bookstore
水|shuǐ|water
水果|shuǐguǒ|fruit
睡|shuì|to sleep
睡觉|shuìjiào|to sleep; go to bed
说|shuō|to speak; say
说话|shuōhuà|to speak; talk
四|sì|four
岁|suì|years old
他|tā|he; him
它|tā|it
她|tā|she; her
他们|tāmen|they; them
它们|tāmen|they; them (things/animals)
她们|tāmen|they; them (female)
太|tài|too; very
天|tiān|day; sky
天气|tiānqì|weather
听|tīng|to listen
听见|tīngjiàn|to hear
同学|tóngxué|classmate
外|wài|outside
外边|wàibian|outside
玩|wán|to play; have fun
晚|wǎn|late
晚饭|wǎnfàn|dinner
晚上|wǎnshang|evening
喂|wèi|hello (on the phone)
问|wèn|to ask
问题|wèntí|question; problem
我|wǒ|I; me
我们|wǒmen|we; us
五|wǔ|five
午饭|wǔfàn|lunch
喜欢|xǐhuan|to like
下|xià|down; next
下雨|xià yǔ|to rain
下班|xiàbān|to finish work
下课|xiàkè|to finish class
下午|xiàwǔ|afternoon
先生|xiānsheng|Mr.; sir
现在|xiànzài|now
想|xiǎng|to want; miss; think
小|xiǎo|small; young
小朋友|xiǎopéngyǒu|child; kid
小时|xiǎoshí|hour
小学|xiǎoxué|primary school
小学生|xiǎoxuéshēng|primary school student
些|xiē|some
写|xiě|to write
谢谢|xièxie|thank you
新|xīn|new
星期|xīngqī|week
星期日|xīngqīrì|Sunday
星期天|xīngqītiān|Sunday
休息|xiūxi|to rest
学|xué|to learn
学生|xuéshēng|student
学习|xuéxí|to study; learn
学校|xuéxiào|school
雪|xuě|snow
要|yào|to want; need; will
也|yě|also; too
一|yī|one
衣服|yīfu|clothes
医生|yīshēng|doctor
医院|yīyuàn|hospital
一半|yíbàn|half
一下|yíxià|once; a little
椅子|yǐzi|chair
一点儿|yìdiǎnr|a little
一些|yìxiē|some
有|yǒu|to have; there is
有的|yǒude|some of
有点儿|yǒudiǎnr|a bit; somewhat
有些|yǒuxiē|some
雨|yǔ|rain
元|yuán|yuan
月|yuè|month; moon
再|zài|again
在|zài|at; in; be doing
再见|zàijiàn|goodbye
早|zǎo|early; morning
早饭|zǎofàn|breakfast
早上|zǎoshang|morning
怎么|zěnme|how
怎么样|zěnmeyàng|how; how about
找|zhǎo|to look for
这|zhè|this
这边|zhèbiān|this side; here
这个|zhège|this one
这里|zhèlǐ|here
这儿|zhèr|here
这些|zhèxiē|these
真|zhēn|really; truly
正在|zhèngzài|in the process of
只|zhī|measure word for animals
知道|zhīdào|to know
中国|Zhōngguó|China
中文|Zhōngwén|Chinese language
中午|zhōngwǔ|noon
中学|zhōngxué|middle school
中学生|zhōngxuéshēng|middle school student
住|zhù|to live; reside
桌子|zhuōzi|table; desk
字|zì|character; word
昨天|zuótiān|yesterday
坐|zuò|to sit; ride
做|zuò|to do; make
做饭|zuò fàn|to cook
`;

const vocabularyBase = vocabularyRaw
  .trim()
  .split("\n")
  .map((line) => {
    const [hanzi, pinyin, meaning] = line.split("|");
    return { hanzi, pinyin, meaning };
  });

const wordDetails: Record<string, Pick<VocabularyWord, "example" | "collocation"> & { note?: string }> = {
  爱: { example: "我爱我的家人。", collocation: "爱家人" },
  吧: { example: "我们去吃饭吧。", collocation: "走吧 / 好吧", note: "Softens a suggestion; it normally comes at the end." },
  本: { example: "我有三本书。", collocation: "一本书", note: "Measure word for bound books." },
  杯子: { example: "这是我的杯子。", collocation: "一个杯子", note: "Use 杯 for a cupful: 一杯茶." },
  不: { example: "我不喝茶。", collocation: "不是 / 不要", note: "Use 不 for habits, facts, and future negation." },
  菜: { example: "这个菜很好吃。", collocation: "吃菜 / 中国菜" },
  茶: { example: "我想喝一杯茶。", collocation: "喝茶 / 一杯茶" },
  车: { example: "这是我的车。", collocation: "开车 / 坐车" },
  吃: { example: "我们中午吃米饭。", collocation: "吃饭 / 好吃" },
  的: { example: "这是我的书。", collocation: "我的 / 你的", note: "Connects an owner or description to a noun." },
  点: { example: "现在八点半。", collocation: "九点 / 一点儿", note: "For clock time, 点 means o’clock." },
  对: { example: "你说得对。", collocation: "对不起 / 对不对" },
  个: { example: "我买了三个苹果。", collocation: "一个人 / 两个包子", note: "General measure word; learn specific measure words too." },
  给: { example: "我给妈妈打电话。", collocation: "给你 / 给妈妈" },
  和: { example: "我喝茶和牛奶。", collocation: "你和我", note: "Joins nouns; do not use it for every English ‘and’." },
  很: { example: "今天天气很热。", collocation: "很好 / 很高兴", note: "Often links a subject and adjective without meaning strongly ‘very’." },
  会: { example: "我会说中文。", collocation: "会说 / 会写", note: "Use for learned skills or a likely future event." },
  家: { example: "我家有四口人。", collocation: "我家 / 回家", note: "Also a measure word for businesses: 一家商店." },
  件: { example: "我买了一件衣服。", collocation: "一件衣服", note: "Measure word for clothes and matters." },
  了: { example: "我吃饭了。", collocation: "下雨了 / 八点了", note: "Marks a completed action or a new situation." },
  两: { example: "我要两个包子。", collocation: "两个人 / 两杯茶", note: "Use 两, not 二, before most measure words." },
  吗: { example: "你是学生吗？", collocation: "好吗 / 是吗", note: "Turns a statement into a yes/no question." },
  没有: { example: "我没有钱。", collocation: "没有人 / 没有吃", note: "Negates 有 and completed actions." },
  哪: { example: "你喜欢哪本书？", collocation: "哪个 / 哪里" },
  呢: { example: "我很好，你呢？", collocation: "你呢 / 他呢", note: "Returns a question or highlights an ongoing action." },
  能: { example: "你能来吗？", collocation: "能来 / 能不能", note: "Ability based on circumstances." },
  请: { example: "请坐。", collocation: "请问 / 请坐" },
  去: { example: "我去学校上课。", collocation: "回去 / 去中国" },
  谁: { example: "他是谁？", collocation: "谁的 / 谁呢" },
  什么: { example: "你想吃什么？", collocation: "什么名字 / 什么书" },
  是: { example: "我是学生。", collocation: "是不是 / 这是" },
  太: { example: "这个太贵了。", collocation: "太好了 / 太大了", note: "Often pairs with 了 to mean ‘too’ or ‘so’." },
  在: { example: "我在学校学习。", collocation: "在家 / 正在", note: "Marks location; 正在 marks an action in progress." },
  想: { example: "我想喝水。", collocation: "想吃 / 想去", note: "A softer want than 要; it can also mean think or miss." },
  些: { example: "我买了一些水果。", collocation: "一些 / 这些" },
  要: { example: "我要一杯茶。", collocation: "想要 / 不要", note: "Can mean want, need, or be going to." },
  也: { example: "我也是学生。", collocation: "我也 / 也很好", note: "Place 也 before the verb or adjective." },
  一: { example: "我有一个朋友。", collocation: "一个 / 一点儿", note: "Tone changes in speech before fourth- and first/second/third-tone syllables." },
  有: { example: "学校里有一家书店。", collocation: "有一个 / 有没有" },
  再: { example: "请再说一下。", collocation: "再见 / 再说", note: "Usually refers to an action happening again in the future." },
  正在: { example: "她正在打电话呢。", collocation: "正在学习 / 正在吃饭" },
  只: { example: "我有一只猫。", collocation: "一只猫 / 一只狗", note: "Measure word for many animals; also means ‘only’ in other contexts." },
  坐: { example: "我坐出租车去医院。", collocation: "请坐 / 坐火车" },
};

const actionWords = new Set("唱 穿 打电话 到 读 读书 飞 工作 回 见 叫 开 开车 看 看病 看见 来 买 卖 起床 请 去 上班 上课 上学 生病 睡 睡觉 说 说话 听 听见 玩 问 写 休息 学 学习 找 住 做 做饭".split(" "));
const adjectiveWords = new Set("大 多 高兴 贵 好 好吃 好看 好听 好玩儿 冷 忙 漂亮 热 少 晚 小 新 早".split(" "));
const numberWords = new Set("零 一 二 两 三 四 五 六 七 八 九 十 百 千 半".split(" "));

export const vocabulary: VocabularyWord[] = vocabularyBase.map((word) => {
  const detail = wordDetails[word.hanzi];
  if (detail) return { ...word, ...detail };
  if (actionWords.has(word.hanzi)) return { ...word, example: `我${word.hanzi}。`, collocation: `想${word.hanzi}` };
  if (adjectiveWords.has(word.hanzi)) return { ...word, example: `这个很${word.hanzi}。`, collocation: `很${word.hanzi}` };
  if (numberWords.has(word.hanzi)) return { ...word, example: `我有${word.hanzi}个。`, collocation: `${word.hanzi}个` };
  return { ...word, example: `这是${word.hanzi}。`, collocation: `认识“${word.hanzi}”` };
});

const charactersRaw = `
爱 八 爸 吧 白 百 班 半 包 杯 本 边 便 病 不 菜 茶 常 唱 超 车 吃 出 穿 床 打 大 蛋 到 道 得 的 弟 第 点 电 东 都 读 对 多 儿 二 饭 房 飞 非 分 服 高 哥 歌 个 给 工 公 狗 关 贵 国 果 还 孩 汉 好 号 喝 和 很 后 候 话 欢 回 会 火 机 鸡 几 家 间 见 件 叫 姐 今 九 觉 开 看 可 客 课 口 块 来 老 了 冷 里 两 亮 零 六 妈 吗 买 卖 忙 猫 么 没 妹 们 米 面 名 明 哪 那 奶 男 脑 呢 能 你 年 您 牛 女 朋 漂 苹 七 期 起 气 千 前 钱 请 去 热 人 认 日 三 商 上 少 谁 什 生 师 十 时 识 士 市 事 视 是 手 书 水 睡 说 司 四 岁 他 它 她 太 题 天 条 听 同 外 玩 晚 喂 文 问 我 五 午 西 息 习 喜 系 下 先 现 想 小 校 些 写 谢 新 星 兴 休 学 雪 样 要 也 一 衣 医 宜 以 椅 影 友 有 雨 语 元 院 月 再 在 早 怎 找 这 真 正 知 只 中 钟 住 桌 子 字 租 昨 作 坐 做
`;

export const recognitionCharacters = charactersRaw.trim().split(/\s+/);

export type GrammarPoint = {
  group: "Core" | "Questions" | "Time" | "Place" | "Actions";
  label: string;
  title: string;
  formula: string;
  example: string;
  pinyin: string;
  translation: string;
};

const coreGrammarPoints: GrammarPoint[] = [
  { group: "Core", label: "Identity", title: "The 是 sentence", formula: "subject + 是 + noun", example: "我是学生。", pinyin: "Wǒ shì xuésheng.", translation: "I am a student." },
  { group: "Core", label: "Possession", title: "Have with 有", formula: "subject + 有 + object", example: "我有一个姐姐。", pinyin: "Wǒ yǒu yí ge jiějie.", translation: "I have an older sister." },
  { group: "Core", label: "Description", title: "Adjective predicates", formula: "subject + 很 + adjective", example: "今天天气很热。", pinyin: "Jīntiān tiānqì hěn rè.", translation: "The weather is hot today." },
  { group: "Core", label: "Ownership", title: "Connect with 的", formula: "owner + 的 + noun", example: "这是我的书。", pinyin: "Zhè shì wǒ de shū.", translation: "This is my book." },
  { group: "Core", label: "Negation", title: "不 vs. 没有", formula: "不 + habitual / 没有 + completed", example: "我不喝茶。我没吃早饭。", pinyin: "Wǒ bù hē chá. Wǒ méi chī zǎofàn.", translation: "I don’t drink tea. I didn’t eat breakfast." },
  { group: "Questions", label: "Yes / no", title: "Ask with 吗", formula: "statement + 吗？", example: "你是老师吗？", pinyin: "Nǐ shì lǎoshī ma?", translation: "Are you a teacher?" },
  { group: "Questions", label: "Open question", title: "Question words stay in place", formula: "subject + question word + verb?", example: "你去哪儿？", pinyin: "Nǐ qù nǎr?", translation: "Where are you going?" },
  { group: "Questions", label: "Choice", title: "A-not-A questions", formula: "verb + 不 + verb", example: "你想不想学中文？", pinyin: "Nǐ xiǎng bu xiǎng xué Zhōngwén?", translation: "Do you want to learn Chinese?" },
  { group: "Questions", label: "Follow-up", title: "Bounce it back with 呢", formula: "noun / pronoun + 呢？", example: "我是学生，你呢？", pinyin: "Wǒ shì xuésheng, nǐ ne?", translation: "I’m a student. And you?" },
  { group: "Time", label: "When", title: "Time comes before the verb", formula: "subject + time + verb", example: "我晚上学习中文。", pinyin: "Wǒ wǎnshang xuéxí Zhōngwén.", translation: "I study Chinese in the evening." },
  { group: "Time", label: "Completed", title: "Mark completion with 了", formula: "verb + 了 + object", example: "我买了三个苹果。", pinyin: "Wǒ mǎi le sān ge píngguǒ.", translation: "I bought three apples." },
  { group: "Time", label: "In progress", title: "正在 for right now", formula: "subject + 正在 + verb + 呢", example: "她正在打电话呢。", pinyin: "Tā zhèngzài dǎ diànhuà ne.", translation: "She is making a phone call." },
  { group: "Time", label: "Change", title: "A new state with 了", formula: "new situation + 了", example: "八点了。", pinyin: "Bā diǎn le.", translation: "It’s eight o’clock now." },
  { group: "Place", label: "Location", title: "Place before action", formula: "subject + 在 + place + verb", example: "我在大学学习汉语。", pinyin: "Wǒ zài dàxué xuéxí Hànyǔ.", translation: "I study Mandarin at university." },
  { group: "Place", label: "Existence", title: "There is with 有", formula: "place + 有 + number + noun", example: "学校里有一家书店。", pinyin: "Xuéxiào lǐ yǒu yì jiā shūdiàn.", translation: "There is a bookstore inside the school." },
  { group: "Place", label: "Position", title: "Use direction words", formula: "noun + 的 + 上 / 下 / 里 / 外", example: "书在桌子上。", pinyin: "Shū zài zhuōzi shàng.", translation: "The book is on the table." },
  { group: "Actions", label: "Ability", title: "会, 能, 可以", formula: "subject + modal + verb", example: "我会说中文。", pinyin: "Wǒ huì shuō Zhōngwén.", translation: "I can speak Chinese." },
  { group: "Actions", label: "Desire", title: "想 and 要", formula: "subject + 想 / 要 + verb", example: "我想喝一杯茶。", pinyin: "Wǒ xiǎng hē yì bēi chá.", translation: "I’d like to drink a cup of tea." },
  { group: "Actions", label: "Sequence", title: "Two verbs, one purpose", formula: "verb 1 + place + verb 2", example: "我去中国学汉语。", pinyin: "Wǒ qù Zhōngguó xué Hànyǔ.", translation: "I’m going to China to study Mandarin." },
  { group: "Actions", label: "Quantity", title: "Numbers need measure words", formula: "number + measure word + noun", example: "两杯茶，三个包子。", pinyin: "Liǎng bēi chá, sān ge bāozi.", translation: "Two cups of tea, three buns." },
];

const g = (group: GrammarPoint["group"], label: string, title: string, formula: string, example: string, pinyin: string, translation: string): GrammarPoint => ({ group, label, title, formula, example, pinyin, translation });

const additionalGrammarPoints: GrammarPoint[] = [
  g("Core", "Identity", "Ask with 是不是", "subject + 是不是 + noun", "你是不是老师？", "Nǐ shì bu shì lǎoshī?", "Are you a teacher?"),
  g("Core", "Existence", "Negate 有 with 没有", "subject + 没有 + object", "我没有车。", "Wǒ méiyǒu chē.", "I do not have a car."),
  g("Core", "Scope", "Include everyone with 都", "plural subject + 都 + predicate", "我们都是学生。", "Wǒmen dōu shì xuésheng.", "We are all students."),
  g("Core", "Addition", "Add another fact with 也", "subject + 也 + predicate", "我也喜欢喝茶。", "Wǒ yě xǐhuan hē chá.", "I also like drinking tea."),
  g("Core", "Continuation", "Still and also with 还", "subject + 还 + predicate", "他还在学校。", "Tā hái zài xuéxiào.", "He is still at school."),
  g("Core", "Emphasis", "Confirm strongly with 真", "真 + adjective", "这个菜真好吃。", "Zhège cài zhēn hǎochī.", "This dish is really tasty."),
  g("Core", "Degree", "React with 太…了", "太 + adjective + 了", "这件衣服太贵了。", "Zhè jiàn yīfu tài guì le.", "These clothes are too expensive."),
  g("Core", "Degree", "Intensify with 非常", "非常 + adjective", "认识你非常高兴。", "Rènshi nǐ fēicháng gāoxìng.", "I am very happy to meet you."),
  g("Core", "Negation", "Negate an adjective", "不 + adjective", "今天不冷。", "Jīntiān bù lěng.", "It is not cold today."),
  g("Core", "Family", "Omit 的 with close relations", "pronoun + family noun", "我妈妈是医生。", "Wǒ māma shì yīshēng.", "My mother is a doctor."),
  g("Core", "Plural", "People in groups with 们", "person pronoun/noun + 们", "他们是我的同学。", "Tāmen shì wǒ de tóngxué.", "They are my classmates."),
  g("Core", "Politeness", "Respectful you with 您", "您 + predicate", "您好，您是老师吗？", "Nín hǎo, nín shì lǎoshī ma?", "Hello, are you a teacher?"),
  g("Core", "Command", "Polite requests with 请", "请 + verb", "请坐。", "Qǐng zuò.", "Please sit."),
  g("Core", "Command", "Negative commands with 不要", "不要 + verb", "不要说话。", "Búyào shuōhuà.", "Do not speak."),
  g("Core", "Suggestion", "Soften a suggestion with 吧", "proposal + 吧", "我们去吃饭吧。", "Wǒmen qù chīfàn ba.", "Let’s go eat."),
  g("Questions", "Selection", "Choose one with 哪个", "哪个 + noun", "你喜欢哪个？", "Nǐ xǐhuan nǎge?", "Which one do you like?"),
  g("Questions", "Selection", "Choose several with 哪些", "哪些 + noun", "哪些书是你的？", "Nǎxiē shū shì nǐ de?", "Which books are yours?"),
  g("Questions", "Small number", "Ask how many with 几", "几 + measure word + noun", "你家有几口人？", "Nǐ jiā yǒu jǐ kǒu rén?", "How many people are in your family?"),
  g("Questions", "Amount", "Ask an open amount with 多少", "多少 + noun", "这个多少钱？", "Zhège duōshao qián?", "How much is this?"),
  g("Questions", "Method", "Ask how with 怎么", "怎么 + verb", "这个字怎么读？", "Zhège zì zěnme dú?", "How do you read this character?"),
  g("Questions", "Opinion", "Ask how it is with 怎么样", "topic + 怎么样", "今天天气怎么样？", "Jīntiān tiānqì zěnmeyàng?", "How is the weather today?"),
  g("Questions", "Person", "Ask who with 谁", "谁 in the unknown slot", "那个人是谁？", "Nàge rén shì shéi?", "Who is that person?"),
  g("Questions", "Thing", "Ask what with 什么", "什么 in the unknown slot", "你想吃什么？", "Nǐ xiǎng chī shénme?", "What do you want to eat?"),
  g("Questions", "Place", "Ask where with 哪里 / 哪儿", "subject + 在 + 哪里", "你的学校在哪儿？", "Nǐ de xuéxiào zài nǎr?", "Where is your school?"),
  g("Questions", "Degree", "Ask degree with 多", "多 + adjective", "你女儿多大？", "Nǐ nǚ'ér duō dà?", "How old is your daughter?"),
  g("Questions", "Confirmation", "React with 是吗", "statement, 是吗？", "他是医生，是吗？", "Tā shì yīshēng, shì ma?", "He is a doctor, right?"),
  g("Time", "Date", "Say dates large to small", "year + month + day", "今天是五月八日。", "Jīntiān shì wǔ yuè bā rì.", "Today is May 8."),
  g("Time", "Day", "Place today before the action", "subject + 今天 + verb", "我今天上班。", "Wǒ jīntiān shàngbān.", "I am working today."),
  g("Time", "Week", "Name a weekday", "星期 + number", "明天星期三。", "Míngtiān xīngqīsān.", "Tomorrow is Wednesday."),
  g("Time", "Clock", "Clock time with 点 and 分", "number + 点 + number + 分", "现在九点十分。", "Xiànzài jiǔ diǎn shí fēn.", "It is 9:10 now."),
  g("Time", "Half", "Half past with 半", "number + 点半", "我八点半上课。", "Wǒ bā diǎn bàn shàngkè.", "My class starts at 8:30."),
  g("Time", "Duration", "Count minutes and hours", "number + 分钟 / 小时", "我学习一个小时。", "Wǒ xuéxí yí ge xiǎoshí.", "I study for one hour."),
  g("Time", "Order", "Use before and after", "time + 前 / 后", "下课后我回家。", "Xiàkè hòu wǒ huí jiā.", "I go home after class."),
  g("Time", "Sequence", "Do this, then that", "先 + verb 1, 再 + verb 2", "我先吃饭，再学习。", "Wǒ xiān chīfàn, zài xuéxí.", "I eat first, then study."),
  g("Time", "Future", "Plan with 要", "subject + time + 要 + verb", "我明天要上班。", "Wǒ míngtiān yào shàngbān.", "I have to work tomorrow."),
  g("Time", "Prediction", "Predict with 会", "time + 会 + event", "明天会下雨。", "Míngtiān huì xià yǔ.", "It will rain tomorrow."),
  g("Time", "Years", "Relative years need no 在", "去年 / 今年 / 明年 + predicate", "我明年去中国。", "Wǒ míngnián qù Zhōngguó.", "I am going to China next year."),
  g("Place", "Position", "Use 在 as the main verb", "subject + 在 + place", "老师在学校。", "Lǎoshī zài xuéxiào.", "The teacher is at school."),
  g("Place", "Deixis", "Point with 这边 and 那边", "这边 / 那边 + predicate", "医院在那边。", "Yīyuàn zài nàbiān.", "The hospital is over there."),
  g("Place", "Direction", "Come here, go there", "来 toward speaker / 去 away", "你来我家吧。", "Nǐ lái wǒ jiā ba.", "Come to my home."),
  g("Place", "Arrival", "Reach a destination with 到", "到 + place", "我到学校了。", "Wǒ dào xuéxiào le.", "I arrived at school."),
  g("Place", "Action", "Put action after its place", "subject + 在 + place + action", "妈妈在家做饭。", "Māma zài jiā zuòfàn.", "Mom cooks at home."),
  g("Place", "Inside", "Inside and outside", "noun + 里 / 外", "猫在房间里。", "Māo zài fángjiān lǐ.", "The cat is in the room."),
  g("Place", "Front/back", "Locate with 前 and 后", "noun + 前 / 后", "车在商店前。", "Chē zài shāngdiàn qián.", "The car is in front of the store."),
  g("Actions", "Permission", "Ask permission with 可以", "可以 + verb + 吗", "我可以坐这儿吗？", "Wǒ kěyǐ zuò zhèr ma?", "May I sit here?"),
  g("Actions", "Circumstance", "Practical ability with 能", "能 + verb", "你今天能来吗？", "Nǐ jīntiān néng lái ma?", "Can you come today?"),
  g("Actions", "Learned skill", "Learned ability with 会", "会 + learned action", "她会开车。", "Tā huì kāichē.", "She can drive."),
  g("Actions", "Brief action", "Soften an action with 一下", "verb + 一下", "请看一下。", "Qǐng kàn yíxià.", "Please take a look."),
  g("Actions", "Recipient", "Direct something with 给", "给 + person + verb/object", "我给爸爸打电话。", "Wǒ gěi bàba dǎ diànhuà.", "I call my dad."),
  g("Actions", "Ordinal", "Make order with 第", "第 + number + noun", "这是第一课。", "Zhè shì dì-yī kè.", "This is Lesson 1."),
];

export const grammarPoints: GrammarPoint[] = [...coreGrammarPoints, ...additionalGrammarPoints];

export const missions = [
  { week: 1, title: "Meet someone", subtitle: "Say hello, introduce yourself, ask a name", words: "你好 · 我 · 你 · 叫 · 名字", phrase: "你好，我叫安娜。你呢？", pinyin: "Nǐ hǎo, wǒ jiào Ānnà. Nǐ ne?", translation: "Hi, I’m Anna. And you?" },
  { week: 1, title: "Talk about family", subtitle: "People, ages, and relationships", words: "家人 · 妈妈 · 哥哥 · 女儿 · 岁", phrase: "我家有四口人。", pinyin: "Wǒ jiā yǒu sì kǒu rén.", translation: "There are four people in my family." },
  { week: 2, title: "Order food", subtitle: "Get what you want without English", words: "吃 · 喝 · 茶 · 米饭 · 饺子", phrase: "我要一杯茶和十个饺子。", pinyin: "Wǒ yào yì bēi chá hé shí ge jiǎozi.", translation: "I’d like a tea and ten dumplings." },
  { week: 2, title: "Build a daily routine", subtitle: "Wake, work, study, rest", words: "起床 · 上班 · 学习 · 下班 · 睡觉", phrase: "我早上七点起床。", pinyin: "Wǒ zǎoshang qī diǎn qǐchuáng.", translation: "I get up at seven in the morning." },
  { week: 3, title: "Tell time & dates", subtitle: "Make plans precisely", words: "现在 · 点 · 分钟 · 星期 · 月", phrase: "现在九点半。", pinyin: "Xiànzài jiǔ diǎn bàn.", translation: "It’s nine thirty now." },
  { week: 3, title: "Find a place", subtitle: "Ask where and understand location", words: "哪里 · 这里 · 前 · 后 · 里", phrase: "请问，医院在哪里？", pinyin: "Qǐngwèn, yīyuàn zài nǎlǐ?", translation: "Excuse me, where is the hospital?" },
  { week: 4, title: "Shop with confidence", subtitle: "Ask prices and choose", words: "买 · 钱 · 元 · 贵 · 便宜", phrase: "这个多少钱？太贵了。", pinyin: "Zhège duōshao qián? Tài guì le.", translation: "How much is this? It’s too expensive." },
  { week: 4, title: "Study & work", subtitle: "Explain what you do", words: "学生 · 老师 · 学校 · 公司 · 工作", phrase: "我在大学学习中文。", pinyin: "Wǒ zài dàxué xuéxí Zhōngwén.", translation: "I study Chinese at university." },
  { week: 5, title: "Move around", subtitle: "Trains, taxis, and where you’re going", words: "去 · 来 · 坐 · 火车 · 出租车", phrase: "我坐火车去学校。", pinyin: "Wǒ zuò huǒchē qù xuéxiào.", translation: "I’m taking the train to school." },
  { week: 5, title: "Weather & plans", subtitle: "Talk about today and tomorrow", words: "天气 · 热 · 冷 · 下雨 · 明天", phrase: "明天会下雨吗？", pinyin: "Míngtiān huì xià yǔ ma?", translation: "Will it rain tomorrow?" },
  { week: 6, title: "Handle health basics", subtitle: "Say what’s wrong and get help", words: "生病 · 医生 · 医院 · 看病 · 休息", phrase: "我生病了，想去医院。", pinyin: "Wǒ shēngbìng le, xiǎng qù yīyuàn.", translation: "I am sick and want to go to the hospital." },
  { week: 6, title: "HSK 1 mission", subtitle: "Listen, read, respond—without translating", words: "300 words · 246 characters · 70 targets", phrase: "我会说一点儿中文了！", pinyin: "Wǒ huì shuō yìdiǎnr Zhōngwén le!", translation: "I can speak a little Chinese now!" },
];

export const listeningQuestions = [
  { id: "l01", prompt: "我想喝一杯茶。", answer: "I would like a cup of tea.", options: ["I bought three books.", "I would like a cup of tea.", "She is going to school."] },
  { id: "l02", prompt: "现在八点半。", answer: "It is 8:30 now.", options: ["It is Friday today.", "The class is eight minutes.", "It is 8:30 now."] },
  { id: "l03", prompt: "书店在学校里。", answer: "The bookstore is inside the school.", options: ["The bookstore opens tomorrow.", "The bookstore is inside the school.", "The school has no books."] },
  { id: "l04", prompt: "她正在打电话呢。", answer: "She is making a phone call.", options: ["Her phone is expensive.", "She is making a phone call.", "She wants to buy a phone."] },
  { id: "l05", prompt: "我家有三口人。", answer: "There are three people in my family.", options: ["I have three cats.", "There are three people in my family.", "My family is at home."] },
  { id: "l06", prompt: "明天会下雨。", answer: "It will rain tomorrow.", options: ["It rained yesterday.", "It will snow tomorrow.", "It will rain tomorrow."] },
  { id: "l07", prompt: "这个苹果三块钱。", answer: "This apple costs three yuan.", options: ["This apple costs three yuan.", "I want three apples.", "These apples are cheap."] },
  { id: "l08", prompt: "我坐出租车去医院。", answer: "I am taking a taxi to the hospital.", options: ["The doctor drives a taxi.", "I am taking a taxi to the hospital.", "The hospital is behind the station."] },
  { id: "l09", prompt: "他是我的大学同学。", answer: "He is my university classmate.", options: ["He works at my university.", "He is my university classmate.", "His teacher is at university."] },
  { id: "l10", prompt: "妈妈在家做饭。", answer: "Mom is cooking at home.", options: ["Mom is eating at a restaurant.", "Mom is cooking at home.", "Dad is returning home."] },
  { id: "l11", prompt: "请问，电影院在哪儿？", answer: "Excuse me, where is the cinema?", options: ["When does the movie start?", "Is the cinema expensive?", "Excuse me, where is the cinema?"] },
  { id: "l12", prompt: "我不喜欢喝牛奶。", answer: "I do not like drinking milk.", options: ["I do not like drinking milk.", "I have no milk.", "The milk is not cold."] },
  { id: "l13", prompt: "姐姐今年二十岁。", answer: "My older sister is 20 this year.", options: ["My sister has 20 books.", "My older sister is 20 this year.", "My younger sister works today."] },
  { id: "l14", prompt: "我们星期日不上课。", answer: "We do not have class on Sunday.", options: ["We study every Sunday.", "We do not have class on Sunday.", "Our class starts on Sunday."] },
  { id: "l15", prompt: "这件衣服很好看。", answer: "These clothes look nice.", options: ["The clothes are too expensive.", "These clothes look nice.", "This shop is very big."] },
  { id: "l16", prompt: "爸爸下午五点下班。", answer: "Dad finishes work at 5 p.m.", options: ["Dad starts work at 5 a.m.", "Dad finishes work at 5 p.m.", "Dad works for five hours."] },
  { id: "l17", prompt: "桌子上有一本书。", answer: "There is a book on the table.", options: ["There is a book on the table.", "The chair is under the desk.", "This book has a table."] },
  { id: "l18", prompt: "你的汉语说得很好。", answer: "You speak Mandarin very well.", options: ["Your Chinese book is good.", "You speak Mandarin very well.", "You like listening to Mandarin."] },
  { id: "l19", prompt: "我没有看见你的手机。", answer: "I did not see your phone.", options: ["I did not see your phone.", "I bought your phone.", "Your phone is not here."] },
  { id: "l20", prompt: "我们先吃饭，再看电影。", answer: "We will eat first, then watch a movie.", options: ["We watched a movie while eating.", "We will eat first, then watch a movie.", "We do not want dinner or a movie."] },
];

export const sentenceChallenges = [
  { id: "b01", tokens: ["我", "叫", "大卫"], answer: "我叫大卫", translation: "My name is David." },
  { id: "b02", tokens: ["你", "想", "喝", "什么"], answer: "你想喝什么", translation: "What would you like to drink?" },
  { id: "b03", tokens: ["我", "在", "学校", "学习", "中文"], answer: "我在学校学习中文", translation: "I study Chinese at school." },
  { id: "b04", tokens: ["明天", "天气", "怎么样"], answer: "明天天气怎么样", translation: "How will the weather be tomorrow?" },
  { id: "b05", tokens: ["他", "是", "我的", "老师"], answer: "他是我的老师", translation: "He is my teacher." },
  { id: "b06", tokens: ["现在", "九点", "半"], answer: "现在九点半", translation: "It is 9:30 now." },
  { id: "b07", tokens: ["我家", "有", "四口", "人"], answer: "我家有四口人", translation: "There are four people in my family." },
  { id: "b08", tokens: ["这件", "衣服", "太", "贵", "了"], answer: "这件衣服太贵了", translation: "These clothes are too expensive." },
  { id: "b09", tokens: ["妈妈", "正在", "打电话", "呢"], answer: "妈妈正在打电话呢", translation: "Mom is making a phone call." },
  { id: "b10", tokens: ["请问", "医院", "在", "哪里"], answer: "请问医院在哪里", translation: "Excuse me, where is the hospital?" },
  { id: "b11", tokens: ["我", "坐", "出租车", "去", "公司"], answer: "我坐出租车去公司", translation: "I take a taxi to the company." },
  { id: "b12", tokens: ["她", "也", "喜欢", "吃", "饺子"], answer: "她也喜欢吃饺子", translation: "She also likes eating dumplings." },
  { id: "b13", tokens: ["桌子上", "有", "一本", "书"], answer: "桌子上有一本书", translation: "There is a book on the table." },
  { id: "b14", tokens: ["爸爸", "下午五点", "下班"], answer: "爸爸下午五点下班", translation: "Dad finishes work at 5 p.m." },
  { id: "b15", tokens: ["我", "没有", "看见", "你的", "手机"], answer: "我没有看见你的手机", translation: "I did not see your phone." },
  { id: "b16", tokens: ["我们", "先", "吃饭", "再", "看电影"], answer: "我们先吃饭再看电影", translation: "We eat first, then watch a movie." },
];

export const pronunciationDrills = [
  { id: "p01", focus: "1st + 1st", hanzi: "妈妈", pinyin: "māma", cue: "Keep the first syllable high and level; let the second go light." },
  { id: "p02", focus: "2nd + 3rd", hanzi: "您好", pinyin: "nín hǎo", cue: "Rise on nín, then dip low on hǎo." },
  { id: "p03", focus: "3rd + 3rd", hanzi: "你好", pinyin: "ní hǎo", cue: "The first third tone changes to a rising tone in natural speech." },
  { id: "p04", focus: "3rd + 2nd", hanzi: "美国", pinyin: "Měiguó", cue: "Stay low on měi, then rise clearly on guó. 美国 is a bonus proper noun." },
  { id: "p05", focus: "4th + neutral", hanzi: "谢谢", pinyin: "xièxie", cue: "Drop firmly on xiè; keep the second syllable short and light." },
  { id: "p06", focus: "4th + 4th", hanzi: "再见", pinyin: "zàijiàn", cue: "Make two clean falling tones without flattening the second." },
  { id: "p07", focus: "j vs zh", hanzi: "知道", pinyin: "zhīdào", cue: "Curl the tongue slightly for zh; do not pronounce it like English j." },
  { id: "p08", focus: "q vs ch", hanzi: "起床", pinyin: "qǐchuáng", cue: "q is forward and breathy; ch is farther back with the tongue curled." },
  { id: "p09", focus: "x vs sh", hanzi: "学生", pinyin: "xuésheng", cue: "x is made forward with a smile; sh is made farther back." },
  { id: "p10", focus: "ü vowel", hanzi: "女儿", pinyin: "nǚ'ér", cue: "Say ee while rounding your lips; keep the tongue forward." },
  { id: "p11", focus: "-n vs -ng", hanzi: "中文", pinyin: "Zhōngwén", cue: "End zhōng at the back of the mouth; end wén at the front." },
  { id: "p12", focus: "Full line", hanzi: "你好，我叫安娜。你呢？", pinyin: "Nǐ hǎo, wǒ jiào Ānnà. Nǐ ne?", cue: "Link the words smoothly and keep unstressed particles light." },
];

export type MockQuestion = {
  id: string;
  section: "Listening" | "Reading";
  prompt: string;
  answer: string;
  options: string[];
  explanation: string;
};

const readingQuestions: Omit<MockQuestion, "section">[] = [
  { id: "r01", prompt: "我叫李明。", answer: "My name is Li Ming.", options: ["My name is Li Ming.", "I know Li Ming.", "Li Ming is a teacher."], explanation: "叫 introduces a person’s name." },
  { id: "r02", prompt: "她有两个女儿。", answer: "She has two daughters.", options: ["She has two daughters.", "Her daughter is two.", "She has two sisters."], explanation: "两 + 个 marks a quantity of two." },
  { id: "r03", prompt: "今天星期五。", answer: "Today is Friday.", options: ["Today is May 5.", "Today is Friday.", "Friday is tomorrow."], explanation: "星期五 means Friday." },
  { id: "r04", prompt: "你去哪儿？", answer: "Where are you going?", options: ["Where are you going?", "When are you leaving?", "Who is going?"], explanation: "哪儿 replaces the unknown place." },
  { id: "r05", prompt: "我不吃鸡蛋。", answer: "I do not eat eggs.", options: ["I did not buy eggs.", "I do not eat eggs.", "The egg is not tasty."], explanation: "不 negates a habit or preference." },
  { id: "r06", prompt: "猫在椅子下。", answer: "The cat is under the chair.", options: ["The cat is on the chair.", "The cat is under the chair.", "The chair is outside."], explanation: "下 indicates under/below." },
  { id: "r07", prompt: "我会说一点儿中文。", answer: "I can speak a little Chinese.", options: ["I can write this character.", "I can speak a little Chinese.", "I want to study Chinese."], explanation: "会 marks a learned skill; 一点儿 means a little." },
  { id: "r08", prompt: "这个杯子是谁的？", answer: "Whose cup is this?", options: ["Which cup is this?", "How much is this cup?", "Whose cup is this?"], explanation: "谁的 asks whose." },
  { id: "r09", prompt: "他明年去中国。", answer: "He is going to China next year.", options: ["He came from China last year.", "He is going to China next year.", "He lives in China now."], explanation: "明年 means next year and comes before the verb." },
  { id: "r10", prompt: "我们都很高兴。", answer: "We are all very happy.", options: ["We are all very happy.", "We are not happy.", "Everyone knows us."], explanation: "都 includes every member of the plural subject." },
  { id: "r11", prompt: "请给我一杯水。", answer: "Please give me a cup of water.", options: ["Please buy me tea.", "Please give me a cup of water.", "I would like cold water."], explanation: "给 marks the recipient; 杯 is the measure word." },
  { id: "r12", prompt: "你的电脑怎么样？", answer: "How is your computer?", options: ["Where is your computer?", "Is this your computer?", "How is your computer?"], explanation: "怎么样 asks for an opinion or condition." },
  { id: "r13", prompt: "现在十二点十五分。", answer: "It is 12:15 now.", options: ["It is 12:15 now.", "It is 12:30 now.", "It is 11:45 now."], explanation: "十五分 means fifteen minutes past the hour." },
  { id: "r14", prompt: "老师在看学生的书。", answer: "The teacher is looking at the student’s book.", options: ["The student is reading the teacher’s book.", "The teacher is looking at the student’s book.", "The teacher bought the student a book."], explanation: "的 links 学生 to 书; 在 before the verb marks an ongoing action." },
  { id: "r15", prompt: "你想买哪件衣服？", answer: "Which item of clothing do you want to buy?", options: ["How many clothes did you buy?", "Which item of clothing do you want to buy?", "Why are the clothes expensive?"], explanation: "哪 asks which; 件 is the measure word for clothes." },
  { id: "r16", prompt: "我吃了三个包子。", answer: "I ate three buns.", options: ["I want three buns.", "I ate three buns.", "I made three buns."], explanation: "了 marks the completed eating action." },
  { id: "r17", prompt: "外边下雪了。", answer: "It has started snowing outside.", options: ["It is cold inside.", "It has started snowing outside.", "It will rain tomorrow."], explanation: "了 marks a new situation; 外边 means outside." },
  { id: "r18", prompt: "我先上课，再去商店。", answer: "I will attend class first, then go to the store.", options: ["I will attend class first, then go to the store.", "I went shopping before class.", "The store is inside the school."], explanation: "先…再… gives the order of two actions." },
  { id: "r19", prompt: "爸爸没有开车。", answer: "Dad did not drive.", options: ["Dad cannot drive.", "Dad did not drive.", "Dad does not have a car."], explanation: "没有 before an action negates its completion." },
  { id: "r20", prompt: "这本书很好看。", answer: "This book is enjoyable to read.", options: ["This book is new.", "This book is enjoyable to read.", "This book looks expensive."], explanation: "好看 can describe something visually appealing or worth watching/reading." },
];

export const mockExamQuestions: MockQuestion[] = [
  ...listeningQuestions.map((question) => ({ ...question, section: "Listening" as const, explanation: `The line was: ${question.prompt}` })),
  ...readingQuestions.map((question) => ({ ...question, section: "Reading" as const })),
];
