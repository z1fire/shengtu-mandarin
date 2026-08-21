# Shēngtú Mandarin

Shēngtú is a speaking-first HSK 3.0 Level 1 learning platform. It follows the official November 2025 syllabus (effective July 2026) and turns the Level 1 specification into a six-week daily practice loop.

## What is included

- Complete 300-word Level 1 vocabulary bank with examples, collocations, usage notes, audio playback, search, and scheduled review
- All 246 Level 1 recognition characters
- All 70 grammar targets, each with a formula, example, audio, and recall check
- Real spaced repetition with a bounded daily queue, four review grades, and due dates
- Mobile-first app navigation with a Today dashboard, five-step guided daily lesson, and focused Course, Library, Mock, and Progress views
- Twenty listening drills, sixteen sentence challenges, and twelve tone/sound pronunciation drills
- Twelve real-life missions, each integrated into a three-day sequence with daily grammar, mission listening, sentence building, and a speaking checkpoint
- A preserved searchable Library containing all 300 words, 246 characters, and 70 grammar targets for reference and extra practice
- Timed 40-question HSK 1 practice mock with scoring and wrong-answer review
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

Shēngtú is an independent learning tool and is not affiliated with Chinese Test International.
