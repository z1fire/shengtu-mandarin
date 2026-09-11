"""Audit HSK vocabulary that a Hanzi-only speech engine can misread.

The Web Speech API does not accept a pinyin pronunciation alongside its text.
For a vocabulary item with multiple dictionary readings, this script creates a
hidden, same-sound Hanzi alias from monophonic characters. The app speaks that
alias while continuing to display and assess the real vocabulary item.
"""

from __future__ import annotations

import argparse
import gzip
import json
import re
import sys
from collections import defaultdict
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CEDICT_PATH = ROOT / "tmp" / "cedict" / "cedict.txt.gz"
GENERATED_MODULE = ROOT / "src" / "vocabulary-pronunciation.ts"
LEVEL_ORDER = ["1", "2", "3", "4", "5", "6", "7-9"]
TONE_MARKS = {
    "a": "āáǎà",
    "e": "ēéěè",
    "i": "īíǐì",
    "o": "ōóǒò",
    "u": "ūúǔù",
    "ü": "ǖǘǚǜ",
}


def load_hsk_vocabulary() -> dict[str, list[tuple[str, str]]]:
    hsk1_source = (ROOT / "src" / "hsk-data.ts").read_text(encoding="utf-8")
    hsk1_match = re.search(r"const vocabularyRaw = `\s*(.*?)\s*`;", hsk1_source, re.DOTALL)
    if not hsk1_match:
        raise RuntimeError("Could not find the HSK 1 vocabulary block")
    vocabulary: dict[str, list[tuple[str, str]]] = {
        "1": [
            (parts[0], parts[1])
            for line in hsk1_match.group(1).splitlines()
            if len(parts := line.split("|")) >= 2
        ]
    }

    expanded_source = (ROOT / "src" / "hsk-expanded-data.ts").read_text(encoding="utf-8")
    marker = 'export const expandedVocabulary: Record<Exclude<HskLevel, "1">, ExpandedWord[]> = '
    start = expanded_source.index(marker) + len(marker)
    end = expanded_source.index(";\n", start)
    expanded = json.loads(expanded_source[start:end])
    vocabulary.update({level: [(entry["h"], entry["p"]) for entry in entries] for level, entries in expanded.items()})
    return vocabulary


def load_cedict_readings() -> dict[str, set[str]]:
    readings: dict[str, set[str]] = defaultdict(set)
    pattern = re.compile(r"^\S+\s+(\S+)\s+\[([^]]+)\]\s+/")
    with gzip.open(CEDICT_PATH, "rt", encoding="utf-8") as source:
        for line in source:
            match = pattern.match(line)
            if match:
                simplified, pinyin = match.groups()
                readings[simplified].add(pinyin.lower())
    return readings


def numbered_syllable_to_marked(syllable: str) -> str:
    match = re.fullmatch(r"([a-z:ü]+)([1-5])?", syllable.lower())
    if not match:
        return syllable.lower()
    base, tone_text = match.groups()
    base = base.replace("u:", "ü").replace("v", "ü")
    tone = int(tone_text or "5")
    if tone == 5:
        return base
    if "a" in base:
        mark_index = base.index("a")
    elif "e" in base:
        mark_index = base.index("e")
    elif "ou" in base:
        mark_index = base.index("o")
    else:
        mark_index = max(index for index, char in enumerate(base) if char in "aeiouü")
    vowel = base[mark_index]
    return f"{base[:mark_index]}{TONE_MARKS[vowel][tone - 1]}{base[mark_index + 1:]}"


def marked_reading(reading: str) -> str:
    return "".join(numbered_syllable_to_marked(syllable) for syllable in reading.split())


def normalize_marked_pinyin(pinyin: str) -> str:
    first_reading = pinyin.split("/")[0]
    return re.sub(r"[^a-züāáǎàēéěèīíǐìōóǒòūúǔù]", "", first_reading.lower())


def choose_target_reading(pinyin: str, alternatives: list[str]) -> str | None:
    target = normalize_marked_pinyin(pinyin)
    return next((reading for reading in alternatives if normalize_marked_pinyin(marked_reading(reading)) == target), None)


def build_character_rank(vocabulary: dict[str, list[tuple[str, str]]]) -> dict[str, int]:
    rank: dict[str, int] = {}
    position = 0
    for level in LEVEL_ORDER:
        for hanzi, _ in vocabulary[level]:
            for character in hanzi:
                if "\u3400" <= character <= "\u9fff" and character not in rank:
                    rank[character] = position
                    position += 1
    return rank


def build_safe_syllable_aliases(
    readings: dict[str, set[str]],
    character_rank: dict[str, int],
    common_characters: set[str],
) -> dict[str, str]:
    candidates: dict[str, list[str]] = defaultdict(list)
    for character, character_readings in readings.items():
        if character in common_characters and len(character_readings) == 1:
            candidates[next(iter(character_readings))].append(character)
    return {
        reading: min(characters, key=lambda character: (character_rank.get(character, 1_000_000), ord(character)))
        for reading, characters in candidates.items()
    }


def audit_vocabulary() -> tuple[dict[str, str], dict[str, int], list[tuple[str, str, str]]]:
    vocabulary = load_hsk_vocabulary()
    readings = load_cedict_readings()
    character_rank = build_character_rank(vocabulary)
    # Device voices can misread obscure dictionary characters even when their
    # dictionary pinyin is unambiguous. Only use characters taught by HSK 1–6
    # as invisible aliases; otherwise the familiar original word is safer.
    common_characters = {
        character
        for level in LEVEL_ORDER[:6]
        for hanzi, _ in vocabulary[level]
        for character in hanzi
        if character in character_rank
    }
    syllable_aliases = build_safe_syllable_aliases(readings, character_rank, common_characters)
    audio_aliases: dict[str, str] = {}
    counts: dict[str, int] = {}
    unresolved: list[tuple[str, str, str]] = []

    for level, entries in vocabulary.items():
        risks = 0
        for hanzi, pinyin in entries:
            alternatives = sorted(readings.get(hanzi, set()))
            if len(alternatives) <= 1:
                continue
            risks += 1
            target_reading = choose_target_reading(pinyin, alternatives)
            alias = "" if target_reading is None else "".join(syllable_aliases.get(syllable, "") for syllable in target_reading.split())
            complete_alias = bool(target_reading and alias and len(alias) == len(target_reading.split()) and alias != hanzi)
            if complete_alias:
                audio_aliases[f"{hanzi}|{pinyin}"] = alias
            else:
                unresolved.append((hanzi, pinyin, " / ".join(alternatives)))
        counts[level] = risks
    return audio_aliases, counts, unresolved


def typescript_module(audio_aliases: dict[str, str]) -> str:
    mapping = json.dumps(audio_aliases, ensure_ascii=False, indent=2, sort_keys=True)
    return f'''// Generated by scripts/audit_audio_pronunciation.py --write.
// Hidden same-sound aliases stop Hanzi-only device voices from guessing the
// wrong reading. Displayed vocabulary, pinyin, meanings, and scoring are unchanged.

type PronunciationWord = {{ hanzi: string; pinyin: string }};

const VOCABULARY_AUDIO_ALIASES: Record<string, string> = {mapping};

export const VOCABULARY_AUDIO_ALIAS_COUNT = {len(audio_aliases)};

export function vocabularySpeechText(word: PronunciationWord): string {{
  return VOCABULARY_AUDIO_ALIASES[`${{word.hanzi}}|${{word.pinyin}}`] ?? word.hanzi;
}}
'''


def main() -> None:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    parser = argparse.ArgumentParser()
    parser.add_argument("--write", action="store_true", help="Regenerate src/vocabulary-pronunciation.ts")
    parser.add_argument("--check", action="store_true", help="Verify the generated module is current")
    parser.add_argument("--verbose", action="store_true", help="List unresolved readings and neutral-tone single-character cards")
    args = parser.parse_args()

    if not CEDICT_PATH.exists():
        raise SystemExit(f"Missing audit dictionary: {CEDICT_PATH}")
    audio_aliases, counts, unresolved = audit_vocabulary()
    generated = typescript_module(audio_aliases)

    if args.write:
        GENERATED_MODULE.write_text(generated, encoding="utf-8", newline="\n")
    if args.check:
        current = GENERATED_MODULE.read_text(encoding="utf-8") if GENERATED_MODULE.exists() else ""
        if current != generated:
            raise SystemExit("Pronunciation alias module is stale; run the audit with --write")
        if audio_aliases.get("还|hái") != "孩":
            raise SystemExit("Regression: 还 hái must use the unambiguous 孩 audio alias")
        if "大|dà" in audio_aliases:
            raise SystemExit("Regression: common 大 dà must not be replaced by an obscure audio alias")

    for level in LEVEL_ORDER:
        print(f"HSK {level}: {counts[level]} potentially ambiguous headwords")
    print(f"Exact pinyin-matched aliases: {len(audio_aliases)}")
    print(f"Contextual/default readings retained: {len(unresolved)}")
    if args.verbose:
        vocabulary = load_hsk_vocabulary()
        levels = {(hanzi, pinyin): level for level, entries in vocabulary.items() for hanzi, pinyin in entries}
        print("\nUnresolved polyphonic headwords:")
        for hanzi, pinyin, alternatives in unresolved:
            print(f"HSK {levels.get((hanzi, pinyin), '?')} | {hanzi} | {pinyin} | {alternatives}")
        tone_marks = set("āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ")
        print("\nNeutral-tone single-character cards:")
        for level, entries in vocabulary.items():
            for hanzi, pinyin in entries:
                if len(hanzi) == 1 and not any(character in tone_marks for character in pinyin):
                    print(f"HSK {level} | {hanzi} | {pinyin}")


if __name__ == "__main__":
    main()
