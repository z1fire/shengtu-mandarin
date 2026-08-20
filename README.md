# Shēngtú Mandarin

Shēngtú is a speaking-first HSK 3.0 Level 1 learning platform. It follows the official November 2025 syllabus (effective July 2026) and turns the Level 1 specification into a six-week daily practice loop.

## What is included

- Complete 300-word Level 1 vocabulary bank with pinyin, English glosses, audio playback, search, and mastery tracking
- All 246 Level 1 recognition characters
- Twenty high-yield lessons covering the official 70 grammar targets
- Listening comprehension, active-recall flashcards, sentence building, and speech-recognition practice
- Twelve real-life missions across a six-week fast-track path
- On-device streak, XP, time, vocabulary, and mission progress
- Current HSK 3.0 Level 1 trial-exam structure and rollout note
- Responsive, keyboard-accessible interface with reduced-motion support

Progress is stored only in the browser with `localStorage`; there is no account or analytics layer.

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
