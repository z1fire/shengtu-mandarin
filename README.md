# Shēngtú Mandarin

Shēngtú is a mobile-first, guided Mandarin learning app covering the complete
current HSK 3.0 curriculum: HSK 1–6 plus the combined advanced HSK 7–9 band.
Each level has its own spaced-repetition history, 12 guided speaking missions,
daily grammar/listening/building/speaking steps, searchable official vocabulary,
recognition characters, grammar targets, and a 40-question readiness check.

It follows the official November 2025 syllabus, effective July 2026. HSK 1
retains its hand-curated examples and complete practice mock; higher levels add
the full official inventories and level-appropriate guided practice.

## What is included

- All 11,000 official vocabulary entries with pinyin, English glosses, audio playback, search, and scheduled review
- All 3,088 incremental recognition-character targets across HSK 1–9
- Complete official grammar inventories for every level, plus guided daily grammar retrieval
- Real spaced repetition with a bounded daily queue, four review grades, and due dates
- Mobile-first app navigation with a Today dashboard, five-step guided daily lesson, and focused Course, Library, Mock, and Progress views
- Twenty listening drills, sixteen sentence challenges, and twelve tone/sound pronunciation drills
- Twelve real-life missions per level, each integrated into a three-session sequence with daily grammar, mission listening, sentence building, and a speaking checkpoint
- A searchable Library that can show the active level or the full cumulative syllabus through that level
- Timed 40-question HSK 1 practice mock plus vocabulary readiness checkpoints for HSK 2–9
- Accurate local-date streaks, automatic daily resets, one-time XP, and per-task minute tracking
- Export/import progress backups plus an installable, offline-ready app shell
- Responsive, keyboard-accessible interface with reduced-motion support

Progress is stored in the browser with `localStorage` and can be exported as a portable JSON backup. There is no account or analytics layer.

## Development

```bash
npm install
npm run dev
```

Build the Sites deployment:

```bash
npm run build
```

Build the static GitHub Pages version:

```bash
npm run build:pages
```

The GitHub Actions workflow in `.github/workflows/pages.yml` publishes the static build from `main`.

## Curriculum sources

- [Official HSK 3.0 resource center](https://www.chinesetest.cn/syllabus)
- [HSK Examination Syllabus, published November 2025](https://hsk.cn-bj.ufileos.com/3.0/%E6%96%B0%E7%89%88HSK%E8%80%83%E8%AF%95%E5%A4%A7%E7%BA%B2%EF%BC%88%E8%AF%8D%E6%B1%87%E3%80%81%E6%B1%89%E5%AD%97%E3%80%81%E8%AF%AD%E6%B3%95%EF%BC%89.pdf)
- [Official HSK 3.0 competency descriptions](https://hsk.cn-bj.ufileos.com/3.0/HSK3.0%E8%80%83%E8%AF%95%E8%83%BD%E5%8A%9B%E6%8F%8F%E8%BF%B0.pdf)
- [CC-CEDICT English glosses](https://cc-cedict.org/editor/editor.php?handler=Download) — CC BY-SA 4.0; see [third-party notices](./THIRD_PARTY_NOTICES.md)

Shēngtú is an independent learning tool and is not affiliated with Chinese Test International.
