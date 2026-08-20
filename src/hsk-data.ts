export type VocabularyWord = {
  hanzi: string;
  pinyin: string;
  meaning: string;
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

export const vocabulary: VocabularyWord[] = vocabularyRaw
  .trim()
  .split("\n")
  .map((line) => {
    const [hanzi, pinyin, meaning] = line.split("|");
    return { hanzi, pinyin, meaning };
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

export const grammarPoints: GrammarPoint[] = [
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
  { group: "Place", label: "Existence", title: "There is with 有", formula: "place + 有 + number + noun", example: "学校旁边有一家书店。", pinyin: "Xuéxiào pángbiān yǒu yì jiā shūdiàn.", translation: "There is a bookstore beside the school." },
  { group: "Place", label: "Position", title: "Use direction words", formula: "noun + 的 + 上 / 下 / 里 / 外", example: "书在桌子上。", pinyin: "Shū zài zhuōzi shàng.", translation: "The book is on the table." },
  { group: "Actions", label: "Ability", title: "会, 能, 可以", formula: "subject + modal + verb", example: "我会说中文。", pinyin: "Wǒ huì shuō Zhōngwén.", translation: "I can speak Chinese." },
  { group: "Actions", label: "Desire", title: "想 and 要", formula: "subject + 想 / 要 + verb", example: "我想喝一杯茶。", pinyin: "Wǒ xiǎng hē yì bēi chá.", translation: "I’d like to drink a cup of tea." },
  { group: "Actions", label: "Sequence", title: "Two verbs, one purpose", formula: "verb 1 + place + verb 2", example: "我去中国学汉语。", pinyin: "Wǒ qù Zhōngguó xué Hànyǔ.", translation: "I’m going to China to study Mandarin." },
  { group: "Actions", label: "Quantity", title: "Numbers need measure words", formula: "number + measure word + noun", example: "两杯茶，三个包子。", pinyin: "Liǎng bēi chá, sān ge bāozi.", translation: "Two cups of tea, three buns." },
];

export const missions = [
  { week: 1, title: "Meet someone", subtitle: "Say hello, introduce yourself, ask a name", words: "你好 · 我 · 你 · 叫 · 名字", phrase: "你好，我叫安娜。你呢？", pinyin: "Nǐ hǎo, wǒ jiào Ānnà. Nǐ ne?", translation: "Hi, I’m Anna. And you?" },
  { week: 1, title: "Talk about family", subtitle: "People, ages, and relationships", words: "家人 · 妈妈 · 哥哥 · 女儿 · 岁", phrase: "我家有四口人。", pinyin: "Wǒ jiā yǒu sì kǒu rén.", translation: "There are four people in my family." },
  { week: 1, title: "Order food", subtitle: "Get what you want without English", words: "吃 · 喝 · 茶 · 米饭 · 饺子", phrase: "我要一杯茶和十个饺子。", pinyin: "Wǒ yào yì bēi chá hé shí ge jiǎozi.", translation: "I’d like a tea and ten dumplings." },
  { week: 2, title: "Build a daily routine", subtitle: "Wake, work, study, rest", words: "起床 · 上班 · 学习 · 下班 · 睡觉", phrase: "我早上七点起床。", pinyin: "Wǒ zǎoshang qī diǎn qǐchuáng.", translation: "I get up at seven in the morning." },
  { week: 2, title: "Tell time & dates", subtitle: "Make plans precisely", words: "现在 · 点 · 分钟 · 星期 · 月", phrase: "现在九点半。", pinyin: "Xiànzài jiǔ diǎn bàn.", translation: "It’s nine thirty now." },
  { week: 2, title: "Find a place", subtitle: "Ask where and understand location", words: "哪里 · 这里 · 前 · 后 · 里", phrase: "请问，医院在哪里？", pinyin: "Qǐngwèn, yīyuàn zài nǎlǐ?", translation: "Excuse me, where is the hospital?" },
  { week: 3, title: "Shop with confidence", subtitle: "Ask prices and choose", words: "买 · 钱 · 元 · 贵 · 便宜", phrase: "这个多少钱？太贵了。", pinyin: "Zhège duōshao qián? Tài guì le.", translation: "How much is this? It’s too expensive." },
  { week: 3, title: "Study & work", subtitle: "Explain what you do", words: "学生 · 老师 · 学校 · 公司 · 工作", phrase: "我在大学学习中文。", pinyin: "Wǒ zài dàxué xuéxí Zhōngwén.", translation: "I study Chinese at university." },
  { week: 4, title: "Move around", subtitle: "Trains, taxis, and where you’re going", words: "去 · 来 · 坐 · 火车 · 出租车", phrase: "我坐火车去上海。", pinyin: "Wǒ zuò huǒchē qù Shànghǎi.", translation: "I’m taking the train to Shanghai." },
  { week: 4, title: "Weather & plans", subtitle: "Talk about today and tomorrow", words: "天气 · 热 · 冷 · 下雨 · 明天", phrase: "明天会下雨吗？", pinyin: "Míngtiān huì xià yǔ ma?", translation: "Will it rain tomorrow?" },
  { week: 5, title: "Handle health basics", subtitle: "Say what’s wrong and get help", words: "生病 · 医生 · 医院 · 看病 · 休息", phrase: "我有点儿不舒服，想去看病。", pinyin: "Wǒ yǒudiǎnr bù shūfu, xiǎng qù kànbìng.", translation: "I feel a little unwell and want to see a doctor." },
  { week: 6, title: "HSK 1 mission", subtitle: "Listen, read, respond—without translating", words: "300 words · 246 characters · 70 targets", phrase: "我会说一点儿中文了！", pinyin: "Wǒ huì shuō yìdiǎnr Zhōngwén le!", translation: "I can speak a little Chinese now!" },
];

export const listeningQuestions = [
  { prompt: "我想喝一杯茶。", answer: "I would like a cup of tea.", options: ["I would like a cup of tea.", "I bought three books.", "She is going to school."] },
  { prompt: "现在八点半。", answer: "It is 8:30 now.", options: ["It is 8:30 now.", "It is Friday today.", "The class is eight minutes."] },
  { prompt: "书店在学校后边。", answer: "The bookstore is behind the school.", options: ["The bookstore is behind the school.", "The school is inside the bookstore.", "The bookstore opens tomorrow."] },
  { prompt: "她正在打电话呢。", answer: "She is making a phone call.", options: ["She is making a phone call.", "She wants to buy a phone.", "Her phone is expensive."] },
  { prompt: "我家有三口人。", answer: "There are three people in my family.", options: ["There are three people in my family.", "My family has three cats.", "I live on the third floor."] },
];

export const sentenceChallenges = [
  { tokens: ["我", "叫", "大卫"], answer: "我叫大卫", translation: "My name is David." },
  { tokens: ["你", "想", "喝", "什么"], answer: "你想喝什么", translation: "What would you like to drink?" },
  { tokens: ["我", "在", "学校", "学习", "中文"], answer: "我在学校学习中文", translation: "I study Chinese at school." },
  { tokens: ["明天", "天气", "怎么样"], answer: "明天天气怎么样", translation: "How will the weather be tomorrow?" },
];
