# App Pre-Upload QA Report

Date: 2026-05-19
Server used for browser QA: http://127.0.0.1:4188

## Executive Summary

Upload readiness: **Good, with normal learner-content caveats**.

The previous Learning Path routing bug has been fixed and verified. Static route scanning found no remaining literal bad hash routes. Browser route smoke testing passed 33 main routes/subroutes with no blank pages, no route error panels, no stuck spinners, no replacement-character corruption, and no console errors.

This app is now strong as a self-learning system for an absolute beginner through early B1 preparation, especially because it combines beginner onboarding, pinyin/tone drills, SRS, sentence building, grammar academy, dialogue practice, native TOCFL content, and a 6-month coach roadmap. The biggest remaining product risk is not routing; it is content pedagogy balance: beginners need more guided daily sequencing, fewer parallel choices at first, and more feedback quality on open-ended writing/speaking.

## Technical QA Results

### Static Checks

- Route/link scan across `index.html` and `js/*.js`: **0 real broken literal routes**.
- JavaScript syntax check: **30 JS files + `sw.js` passed**.
- Encoding/mojibake scan across JS and data files: **0 mojibake signature hits**.
- Service worker cache bumped to `tocfl-cache-v99`.

### Browser Route Smoke Test

33 routes tested:

- `/`
- `/b1-coach`
- `/study-plan`
- `/learn`
- `/beginner-launchpad`
- `/beginner-launchpad/level-1/01`
- `/beginner-launchpad/level-2/01`
- `/beginner-launchpad/level-3/01`
- `/beginner-launchpad/test`
- `/quiz/flash`
- `/onboarding`
- `/quiz/pronunciation`
- `/quiz/tones`
- `/playground`
- `/vocabulary-books`
- `/chapters`
- `/grammar`
- `/dialogue`
- `/reading`
- `/scenarios`
- `/flashcards`
- `/mixed-recall`
- `/sentence-builder`
- `/char-playground`
- `/library`
- `/vocabulary`
- `/tocfl`
- `/tocfl-content`
- `/exams`
- `/mock-test/reading`
- `/mock-test/listening`
- `/quiz/vocabulary`
- `/settings`

Result: **33 / 33 passed**.

Pass criteria:

- Page mounted real content.
- No stuck spinner.
- No empty-state route error.
- No replacement-character corruption.
- No console errors during load.

### High-Risk Button Tests

Learning Path buttons verified in browser:

- `Browse Characters` opens `#/library` and loads Character Library.
- `Quick Quiz` opens `#/quiz/pronunciation` and loads quiz setup.
- Neither button falls back to Dashboard anymore.

Fixes applied:

- `navigate()` now normalizes `/route`, `#/route`, and `route` safely.
- Learning Path now self-loads character data before rendering level buttons.
- Learning Path level filter is passed to Character Library and Pronunciation Quiz.
- Remaining old `navigate('#/...')` usage in Learning Path and SRS was cleaned.

## Content Inventory

### Character / Vocabulary Base

- Characters: **1,726**
- By level:
  - Novice: **291**
  - A1: **402**
  - A2: **509**
  - B1: **305**
  - B2: **72**
  - C1: **1**
- Vocabulary sets: **57**
- Vocabulary words: **2,089**

### Beginner Launchpad

- Level 1: **20 lessons**, **105 words**, **100 dialogue lines**, **100 story lines**, **100 exercises**
- Level 2: **20 lessons**, **160 words**, **120 dialogue lines**, **120 story lines**, **100 exercises**
- Level 3: **20 lessons**, **300 words**, **120 dialogue lines**, **120 story lines**, **100 exercises**

### Sentence Builder

- Levels: **6**
- Total curated sentences: **600**
- Coverage:
  - Novice 1: 100
  - Novice 2: 100
  - A1-1: 100
  - A1-2: 100
  - A2-1: 100
  - A2-2: 100

### Grammar Academy

- Levels: **3**
- Data size: ~230 KB structured grammar content
- Remaining `?` marks are normal English question punctuation, not broken placeholders.

### Native TOCFL Content

- Native bank questions/items: **840**
- Rendered question images: **840**
- Text/script items: **624**
- Render failures: **0**
- Available levels currently: Novice and Band A content only, matching the current scope.

## Learning Quality Rating

### For Absolute Beginners Under 50 Words

Rating: **8.0 / 10**

Strengths:

- Beginner Launchpad gives a much better bridge than jumping directly into books.
- Pinyin/Tone onboarding is now richer and more test-like.
- Picture Flash Quiz being under Beginner is pedagogically correct.
- Sentence Builder and Mixed Recall are excellent active-recall tools.
- The dashboard and B1 Coach give direction instead of a pile of isolated resources.

Weaknesses:

- Beginner path is still choice-heavy. A real beginner may not know whether to do Launchpad, Pinyin, Flash Quiz, Playground, or Study Today first.
- TTS is useful but not equivalent to real native audio for pinyin/tone mastery.
- Writing feedback is limited because static apps cannot deeply grade open Chinese writing without a backend or AI API.
- Some advanced systems are visible early, which can overwhelm beginners unless the dashboard strongly guides them.

### For 6-Month B1 Preparation

Rating: **7.5 / 10**

Strengths:

- There is enough volume for daily practice.
- Native TOCFL content is a major advantage.
- Weakness Engine, Mixed Recall, Sentence Builder, Grammar Academy, and B1 Coach together form a serious training system.
- The app can support cross-device use through exported/imported progress, but true sync is not automatic in a static-only app.

Weaknesses:

- Six months to B1 is aggressive; the app needs strict daily study plans and periodic timed exams to keep the learner honest.
- Speaking practice is weaker than reading/listening/recognition.
- Writing needs stronger rubrics and model-answer comparison.
- Real-human pronunciation audio remains the biggest missing piece for tone confidence.

### UI / UX Learning Flow

Rating: **8.0 / 10**

Strengths:

- Main navigation is now more logical: Start, Beginner, Course, Practice, Exams.
- Dashboard is more modern and task-focused.
- Mobile bottom nav is simpler than the earlier all-icon layout.
- Main route reliability is now strong.

Weaknesses:

- The app is large; some pages still feel like full libraries rather than guided lessons.
- A beginner mode should hide advanced complexity until the learner is ready.
- Some pages still need deeper visual hierarchy polishing, but they are functional.

## Overall Rating

Current app rating for self-learning Mandarin from beginner to B1 prep: **8.0 / 10**.

Upload readiness rating: **8.5 / 10**.

It is good enough to upload to GitHub as a serious learning app, but it should be labeled as a personal/static learning system rather than a polished commercial product. The most important next upgrades are real audio, stronger writing/speaking feedback, and a stricter beginner daily path.

## Recommended Next Improvements

1. Add a ?Today for Beginners? mode that tells the learner exactly what to do: Pinyin drill, 10 words, 1 mini dialogue, 1 sentence builder, 1 quiz.
2. Add a real-human audio pack for pinyin initials/finals/tone pairs.
3. Add weekly checkpoint exams inside B1 Coach.
4. Add writing model answers and self-check rubrics.
5. Add a beginner lock/focus mode that hides advanced sections until the learner chooses ?show everything.?
6. Add export/import progress reminder because static GitHub Pages cannot automatically sync across three devices.

## Known Limitations

- Full exhaustive clicking of every generated button on every page is not practically complete without a dedicated end-to-end test suite. Current coverage includes static route scanning, route smoke tests, and high-risk Learning Path button tests.
- Static app architecture means no true cross-device sync unless using manual import/export or adding a backend/cloud storage later.
- TTS quality depends on the browser/device voices installed by the user.
