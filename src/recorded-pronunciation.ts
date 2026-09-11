type PronunciationWord = { hanzi: string; pinyin: string };

// Neutral-tone particles are context-dependent, so a device TTS voice can
// choose the wrong dictionary reading when the character is played alone.
const RECORDED_VOCABULARY_AUDIO: Record<string, string> = {
  "了|le": "./audio/zh-le.mp3",
};

export function recordedVocabularyAudioPath(word: PronunciationWord): string | null {
  return RECORDED_VOCABULARY_AUDIO[`${word.hanzi}|${word.pinyin}`] ?? null;
}
