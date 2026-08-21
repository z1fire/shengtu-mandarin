"""Generate compact HSK 3.0 level data from the official 2025 syllabus.

The source PDF is published by Chinese Tests Service and takes effect in July
2026. English glosses come from CC-CEDICT (CC BY-SA 4.0). This script keeps
the hand-curated HSK 1 data in src/hsk-data.ts and generates levels 2-9.
"""

from __future__ import annotations

import gzip
import json
import re
from collections import defaultdict
from pathlib import Path

import pdfplumber
from pypdf import PdfReader


ROOT = Path(__file__).resolve().parents[1]
PDF_PATH = ROOT / "tmp" / "pdfs" / "hsk-2025-syllabus.pdf"
CEDICT_PATH = ROOT / "tmp" / "cedict" / "cedict.txt.gz"
OUTPUT_PATH = ROOT / "src" / "hsk-expanded-data.ts"
LEVELS = ("1", "2", "3", "4", "5", "6", "7-9")
VOCABULARY_LEVEL_ENDS = ((300, "1"), (500, "2"), (1000, "3"), (2000, "4"), (3600, "5"), (5400, "6"), (11000, "7-9"))

VOCABULARY_PAGES = range(3, 278)
CHARACTER_PAGE_SPANS = {
    "1": (279, 281),
    "2": (281, 282),
    "3": (282, 284),
    "4": (284, 287),
    "5": (287, 290),
    "6": (290, 293),
    "7-9": (293, 300),
}
GRAMMAR_PAGE_SPANS = {
    "1": (309, 312),
    "2": (312, 315),
    "3": (315, 318),
    "4": (318, 321),
    "5": (321, 324),
    "6": (324, 326),
    "7-9": (326, 330),
}

POS_FALLBACKS = {
    "名": "noun",
    "动": "verb",
    "形": "adjective",
    "副": "adverb",
    "代": "pronoun",
    "数": "number",
    "量": "measure word",
    "介": "preposition",
    "连": "conjunction",
    "助": "particle",
    "叹": "interjection",
    "拟声": "onomatopoeia",
}

MANUAL_GLOSSES = {
    "除了": "apart from; besides; in addition to",
    "笔": "pen; pencil; writing brush; stroke",
    "办": "to handle; to manage; to organize; to set up",
    "郊区": "suburbs; outskirts; suburban district",
    "城区": "urban area; city proper",
    "生态": "ecology; ecological state; ecosystem",
    "偏偏": "unexpectedly; contrary to expectations; stubbornly; precisely",
    "新能源": "new energy; alternative energy sources",
    "不予": "to not grant; to deny; to refrain from",
    "精彩纷呈": "brilliant and varied; highlights appearing one after another",
    "居于": "to occupy; to be situated in; to rank at",
    "口哨儿": "whistle (sound or instrument)",
    "压轴": "to feature as the finale; headline act; finale",
    "致力于": "to devote oneself to; to be committed to",
}


def clean_homograph_marker(word: str) -> str:
    return re.sub(r"(?<=[\u3400-\u9fff])\d+$", "", word.strip())


def level_for_sequence(sequence: int) -> str:
    return next(level for end, level in VOCABULARY_LEVEL_ENDS if sequence <= end)


def row_text(chars: list[dict], left: float, right: float, top: float) -> str:
    selected = [
        char
        for char in chars
        if left <= float(char["x0"]) < right
        and abs(float(char["top"]) - top) <= 2.4
        and float(char.get("size", 0)) <= 14
    ]
    selected.sort(key=lambda char: float(char["x0"]))
    return "".join(str(char["text"]) for char in selected).strip()


def extract_vocabulary(pdf: pdfplumber.PDF) -> dict[str, list[dict]]:
    rows: list[dict] = []
    for page_index in VOCABULARY_PAGES:
        page = pdf.pages[page_index]
        chars = page.chars
        sequence_words = [
            word
            for word in page.extract_words(extra_attrs=["size"])
            if 70 <= float(word["x0"]) < 110
            and 84 <= float(word["top"]) <= 760
            and str(word["text"]).isdigit()
            and float(word.get("size", 0)) <= 14
        ]
        for sequence_word in sequence_words:
            top = float(sequence_word["top"])
            sequence = int(sequence_word["text"])
            level_raw = row_text(chars, 130, 195, top)
            level_match = re.search(r"7-9|[1-6]", level_raw)
            if not level_match:
                continue
            level = level_for_sequence(sequence)
            source_word = row_text(chars, 195, 300, top)
            pinyin = row_text(chars, 300, 438, top + 1.05)
            part_of_speech = row_text(chars, 438, 530, top)
            if not source_word or not pinyin:
                raise RuntimeError(f"Incomplete vocabulary row {sequence} on PDF page {page_index + 1}")
            rows.append(
                {
                    "seq": sequence,
                    "level": level,
                    "source": source_word,
                    "hanzi": clean_homograph_marker(source_word),
                    "pinyin": pinyin,
                    "pos": part_of_speech,
                }
            )

    by_sequence = {row["seq"]: row for row in rows}
    missing = [sequence for sequence in range(1, 11001) if sequence not in by_sequence]
    if missing:
        raise RuntimeError(f"Missing official vocabulary rows: {missing[:20]} (total {len(missing)})")
    ordered = [by_sequence[sequence] for sequence in range(1, 11001)]
    grouped = {level: [] for level in LEVELS}
    for row in ordered:
        grouped[row["level"]].append(row)
    return grouped


def extract_characters(reader: PdfReader) -> dict[str, list[str]]:
    grouped: dict[str, list[str]] = {}
    for level, (start, end) in CHARACTER_PAGE_SPANS.items():
        numbered: dict[int, str] = {}
        for page_index in range(start, end):
            text = reader.pages[page_index].extract_text() or ""
            for line in text.splitlines():
                number, separator, rest = line.partition(".")
                if separator and number.strip().isdigit() and rest.strip():
                    index = int(number.strip())
                    if index < 2000:
                        numbered[index] = rest.strip()[0]
        if not numbered or sorted(numbered) != list(range(1, max(numbered) + 1)):
            raise RuntimeError(f"Character list for HSK {level} is not contiguous")
        grouped[level] = [numbered[index] for index in sorted(numbered)]
    return grouped


def clean_table_cell(value: str | None) -> str:
    if not value:
        return ""
    lines = [line.strip() for line in value.splitlines() if line.strip()]
    lines = [line for line in lines if line not in {"汉", "考", "国", "际", "汉考国际"}]
    return "".join(lines).strip()


def extract_grammar(pdf: pdfplumber.PDF) -> dict[str, list[dict]]:
    grouped: dict[str, list[dict]] = {}
    for level, (start, end) in GRAMMAR_PAGE_SPANS.items():
        targets: list[dict] = []
        context = ["", "", ""]
        for page_index in range(start, end):
            tables = pdf.pages[page_index].extract_tables()
            if not tables:
                continue
            for row in tables[0]:
                if len(row) < 4:
                    continue
                cells = [clean_table_cell(cell) for cell in row[:4]]
                if cells[3] in {"语法内容", ""}:
                    continue
                for index in range(3):
                    if cells[index] and cells[index] not in {"类别", "类别名称", "细目"}:
                        context[index] = cells[index]
                        for deeper in range(index + 1, 3):
                            if not cells[deeper]:
                                context[deeper] = ""
                category = context[0] or "语法"
                title = context[2] or context[1] or category
                targets.append({"category": category, "title": title, "formula": cells[3]})
        unique: list[dict] = []
        seen: set[tuple[str, str, str]] = set()
        for target in targets:
            key = (target["category"], target["title"], target["formula"])
            if key not in seen:
                seen.add(key)
                unique.append(target)
        grouped[level] = unique
    return grouped


def load_cedict() -> dict[str, list[str]]:
    entries: dict[str, list[str]] = defaultdict(list)
    pattern = re.compile(r"^\S+\s+(\S+)\s+\[[^]]+\]\s+/(.+)/$")
    with gzip.open(CEDICT_PATH, "rt", encoding="utf-8") as source:
        for line in source:
            if not line or line.startswith("#"):
                continue
            match = pattern.match(line.strip())
            if not match:
                continue
            simplified, definitions_raw = match.groups()
            definitions = definitions_raw.split("/")
            useful = [
                definition.strip()
                for definition in definitions
                if definition.strip()
                and not definition.startswith("CL:")
                and not definition.lower().startswith("variant of ")
                and not definition.lower().startswith("old variant of ")
                and not definition.lower().startswith("see also ")
            ]
            entries[simplified].extend(useful or [definition.strip() for definition in definitions if definition.strip()])
    return entries


def fallback_meaning(part_of_speech: str) -> str:
    meanings = [english for chinese, english in POS_FALLBACKS.items() if chinese in part_of_speech]
    return ", ".join(dict.fromkeys(meanings)) or "official HSK term"


def concise_definition(definition: str, limit: int = 130) -> str:
    definition = re.sub(r"\s+", " ", definition).strip()
    if len(definition) <= limit:
        return definition
    compact = definition
    previous = ""
    while compact != previous:
        previous = compact
        compact = re.sub(r"\s*\([^()]*\)", "", compact).strip()
    parts = [part.strip(" ;,") for part in compact.split(";") if part.strip(" ;,")]
    selected: list[str] = []
    for part in parts:
        candidate = "; ".join([*selected, part])
        if selected and len(candidate) > limit:
            break
        selected.append(part)
        if len(candidate) >= limit:
            break
    result = "; ".join(selected) or compact
    if len(result) > limit:
        clipped = result[: limit - 1].rsplit(" ", 1)[0].rstrip(" ;,")
        result = f"{clipped}…"
    return result


def add_meanings(vocabulary: dict[str, list[dict]], cedict: dict[str, list[str]]) -> tuple[int, int]:
    found = 0
    total = 0
    for rows in vocabulary.values():
        for row in rows:
            total += 1
            if row["hanzi"] in MANUAL_GLOSSES:
                found += 1
                row["meaning"] = MANUAL_GLOSSES[row["hanzi"]]
                continue
            definitions = cedict.get(row["hanzi"], [])
            cleaned: list[str] = []
            for definition in definitions:
                definition = concise_definition(definition)
                candidate = "; ".join([*cleaned, definition])
                if definition and definition not in cleaned and (not cleaned or len(candidate) <= 135):
                    cleaned.append(definition)
                if len(cleaned) == 3:
                    break
            if cleaned:
                found += 1
                row["meaning"] = "; ".join(cleaned)
            else:
                row["meaning"] = fallback_meaning(row["pos"])
    return found, total


def compact_vocabulary(vocabulary: dict[str, list[dict]]) -> dict[str, list[dict]]:
    return {
        level: [
            {"h": row["hanzi"], "p": row["pinyin"], "m": row["meaning"], "s": row["seq"], "pos": row["pos"]}
            for row in rows
        ]
        for level, rows in vocabulary.items()
        if level != "1"
    }


def typescript_literal(value: object) -> str:
    return json.dumps(value, ensure_ascii=False, separators=(",", ":"))


def main() -> None:
    if not PDF_PATH.exists() or not CEDICT_PATH.exists():
        raise SystemExit("Download the official syllabus PDF and CC-CEDICT before running this generator.")
    reader = PdfReader(PDF_PATH)
    with pdfplumber.open(PDF_PATH) as pdf:
        vocabulary = extract_vocabulary(pdf)
        characters = extract_characters(reader)
        grammar = extract_grammar(pdf)
    cedict = load_cedict()
    found, total = add_meanings(vocabulary, cedict)

    vocab_counts = {level: len(rows) for level, rows in vocabulary.items()}
    character_counts = {level: len(rows) for level, rows in characters.items()}
    grammar_counts = {level: len(rows) for level, rows in grammar.items()}
    if vocab_counts != {"1": 300, "2": 200, "3": 500, "4": 1000, "5": 1600, "6": 1800, "7-9": 5600}:
        raise RuntimeError(f"Unexpected vocabulary counts: {vocab_counts}")

    output = f'''// Generated by scripts/generate_hsk_expanded.py. Do not edit by hand.
// Official syllabus: Chinese Tests Service, published November 2025, effective July 2026.
// English glosses: CC-CEDICT, Creative Commons Attribution-ShareAlike 4.0.

export type HskLevel = "1" | "2" | "3" | "4" | "5" | "6" | "7-9";

export type ExpandedWord = {{
  h: string;
  p: string;
  m: string;
  s: number;
  pos: string;
}};

export type OfficialGrammarTarget = {{
  category: string;
  title: string;
  formula: string;
}};

export const expandedVocabulary: Record<Exclude<HskLevel, "1">, ExpandedWord[]> = {typescript_literal(compact_vocabulary(vocabulary))};

export const expandedCharacters: Record<HskLevel, string[]> = {typescript_literal(characters)};

export const officialGrammarTargets: Record<HskLevel, OfficialGrammarTarget[]> = {typescript_literal(grammar)};

export const officialLevelCounts = {{
  vocabulary: {typescript_literal(vocab_counts)},
  characters: {typescript_literal(character_counts)},
  grammarRows: {typescript_literal(grammar_counts)},
}} as const;
'''
    OUTPUT_PATH.write_text(output, encoding="utf-8", newline="\n")
    print(f"Wrote {OUTPUT_PATH.relative_to(ROOT)}")
    print(f"Vocabulary: {vocab_counts}")
    print(f"Characters: {character_counts}")
    print(f"Grammar rows: {grammar_counts}")
    print(f"CC-CEDICT coverage: {found}/{total} ({found / total:.1%})")


if __name__ == "__main__":
    main()
