type PronunciationWord = { hanzi: string; pinyin: string };

// Neutral-tone particles are context-dependent, so a device TTS voice can
// choose the wrong dictionary reading when the character is played alone.
const RECORDED_VOCABULARY_AUDIO: Record<string, string> = {
  "吧|ba": "./audio/zh-ba.mp3",
  "的|de": "./audio/zh-de.mp3",
  "了|le": "./audio/zh-le.mp3",
  "吗|ma": "./audio/zh-ma.mp3",
  "们|men": "./audio/zh-men.mp3",
  "呢|ne": "./audio/zh-ne.mp3",
  "啊|a": "./audio/zh-a.ogg",
  "得|de": "./audio/zh-de.mp3",
  "地|de": "./audio/zh-de.mp3",
  "着|zhe": "./audio/zh-zhe.mp3",
  "啦|la": "./audio/zh-la.ogg",
  "嘛|ma": "./audio/zh-ma.mp3",
};

export const RECORDED_VOCABULARY_AUDIO_COUNT = Object.keys(RECORDED_VOCABULARY_AUDIO).length;

export function recordedVocabularyAudioPath(word: PronunciationWord): string | null {
  return RECORDED_VOCABULARY_AUDIO[`${word.hanzi}|${word.pinyin}`] ?? null;
}
