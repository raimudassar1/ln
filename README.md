# 漢語學習 — Beginner to TOCFL B1

A comprehensive web-based Chinese learning platform designed for learners progressing from absolute beginner to TOCFL Level B1 (Intermediate). This application features a rich set of interactive tools, structured lessons, and extensive data to support character mastery, vocabulary acquisition, and reading comprehension.

## 📊 Project Statistics

- **Total Characters:** 1,443 (TOCFL Novice, A1, A2, and B1)
- **Unique Vocabulary:** 2,500+ words (Complete Workplace/Tech and Foundation data)
- **Structured Chapters:** 35 (Novice to B1, including 5 Tech Industry Chapters)
- **Beginner Playground Chapters:** 20 (High-repetition foundation with stage-based progression)
- **Character Playground Blocks:** 8 (Radical-based character mastery curriculum)
- **Graded Readings:** 45 passages (Taipei MRT, Hsinchu Science Park, THSR, Culture, Nature)
- **B1 Grammar Patterns:** 30 essential logical connectors and structures

## 🚀 Key Learning Features

| Feature | Status | Description |
| :--- | :--- | :--- |
| **Tech Workplace Module** | ✅ NEW | Chapters 31-35 covering Semiconductor Fabs, Office Sync, and HR/Contracts. |
| **Character Radical Blocks** | ✅ NEW | 8 blocks of radical-focused learning (Human Body, Nature, Metal, etc.). |
| **Stage-Based Learning** | ✅ NEW | Foundation playground now organized by Weekly Stages (Week 1 to 16). |
| **Taiwan Career Guide** | ✅ NEW | Curated content for working at companies like Micron and TSMC. |
| **Beginner Playground** | ✅ Complete | 100 lessons focused on "baby-style" high-repetition recognition (10x drills). |
| **Voice Practice** | ✅ Complete | Record and play back your own pronunciation for comparison with native TTS. |
| **PWA Support** | ✅ Complete | Installable on mobile/desktop with full offline support. |

## 📂 Project Structure

- `index.html`: Main application shell and router.
- `css/main.css`: Comprehensive styling with light/dark mode and animations.
- `js/`: Modularized application logic.
  - `app.js`: Core state management and router.
  - `playground.js`: Logic for the 100 high-repetition foundation lessons.
  - `voice.js`: MediaRecorder wrapper for speaking practice.
  - `sw.js`: Service worker for PWA offline capabilities.
  - `srs.js`: Spaced-repetition algorithm (SM-2).
- `data/`: JSON data sources for characters, vocabulary, and playgrounds.

## 🛠️ Tech Stack

- **Frontend:** Vanilla JavaScript (ES6+), CSS3 (Animations, Variables), HTML5.
- **PWA:** Web App Manifest and Service Workers.
- **Libraries:** [Hanzi Writer](https://chanind.github.io/hanzi-writer/) for stroke animations.
- **Media:** Web Audio API & MediaRecorder API for voice practice.

## ⏭️ Next Features & Improvements

- [ ] **B2/C1 Content Expansion:** Integrate advanced TOCFL levels.
- [ ] **Tone Training Game:** Specialized mini-game for distinguishing the 4 tones.
- [ ] **Handwriting Recognition:** Integrate AI-based stroke order validation.
- [ ] **Cloud Sync:** Allow users to sync progress across multiple devices.
