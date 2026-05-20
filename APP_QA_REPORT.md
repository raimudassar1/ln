# App QA Report - 2026-05-18

## Scope
Tested the main static Chinese-learning app shell and high-risk learning flows after the navigation reorganization.
Focus areas requested:
- Human Pinyin Lab / TTS fallback behavior
- Human Lab answer feedback
- Beginner Launchpad Level 2 pinyin toggle
- Grammar Academy placeholder/corruption issue
- Broad route smoke test across the app
- General encoding and syntax safety checks

## Fixes Implemented

### 1. Human Pinyin Lab
Problem found:
- Some generated Human Lab drills could fail to produce usable fallback TTS because playback only used `item.hanzi`.
- Answer feedback did not clearly mark selected wrong answers and correct answers.
- Pressing Play before a question was selected did not start a question.
- Mastery-bank text contained visible `?` separators.

Fixes:
- Fallback pronunciation now uses `audioText || hanzi || example || pinyin`.
- Play button now starts a new question if no current question exists.
- Answer buttons now disable after response.
- Correct answer receives a green indicator.
- Chosen wrong answer receives a red indicator.
- Feedback box now has `correct` / `wrong` states.
- Prompt reveals Chinese character, pinyin, meaning, and coaching after answering.
- Replaced corrupted-looking separators with clean dot separators.

Verification:
- Browser test started a Human Lab question, answered it, and confirmed:
  - answer buttons disabled
  - correct option marked
  - wrong option marked when applicable
  - feedback visible
  - Chinese character appears after answering
  - page did not route away or show wrong content

### 2. Beginner Launchpad Level 2 Pinyin Toggle
Problem found:
- Pinyin hiding was conditional on level/lesson `hidePinyin`, so Level 2 could still show pinyin even after the user turned it off.

Fix:
- Pinyin visibility now obeys the display toggle globally for the current beginner level.

Verification:
- Browser test on `#/beginner-launchpad/level-2/01` confirmed pinyin remains hidden after toggling off.

### 3. Grammar Academy Placeholder Corruption
Problem found:
- `data/grammar_academy.json` had literal `?` placeholders where grammar terms should appear.
- These were not encoding replacement characters; they were real ASCII question marks written into the data.

Fix:
- Repaired Grammar Academy metadata and guidance with proper Traditional Chinese grammar terms, including:
  - 是
  - 有
  - 在
  - 嗎
  - 不 / 沒
  - 先 / 再 / 然後
  - 因為 / 所以 / 可是
  - 比 / 比較
  - 如果 / 就
  - 雖然 / 可是
  - 把
  - 不但 / 而且 / 越來越 / 另外

Verification:
- Automated scan found `0` suspicious placeholder question-mark patterns in Grammar Academy data.
- Browser test on `#/grammar` confirmed no visible placeholder pattern in the loaded Grammar Academy panel.

### 4. Router Stale Render Bug
Problem found during QA:
- A previous slow async page render could finish late and overwrite the current route content.
- This can make one route show another route's page content.

Fix:
- Added a router render token guard.
- Stale async renders now trigger a fresh render of the current route instead of leaving the wrong page on screen.

Verification:
- Re-tested Human Lab interaction after navigating between routes; no TOCFL/other stale content appeared inside Onboarding.

### 5. Route Titles
Fixes:
- Updated `/grammar` topbar title to `Grammar Academy`.
- Updated `/tocfl` topbar title to `TOCFL Exam Center`.

## Broad Route Smoke Test
The following routes were loaded in the browser and checked for:
- no spinner left behind
- no empty-state route error
- no replacement character `�`
- correct route hash
- active sidebar item

Checked routes:
- `/`
- `/beginner-launchpad`
- `/beginner-launchpad/level-2/01`
- `/onboarding`
- `/learn`
- `/b1-coach`
- `/study-plan`
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
- `/quiz/pronunciation`
- `/quiz/tones`
- `/quiz/vocabulary`
- `/quiz/flash`

Result:
- All routes loaded without route errors.
- No replacement-character mojibake was detected in page content.
- No browser console errors/warnings were reported after the smoke pass.

## Static Validation
Commands/checks passed:
- `node --check js/app.js`
- `node --check js/onboarding.js`
- `node --check js/beginner-launchpad.js`
- `node --check js/grammar.js`
- `node --check sw.js`
- Encoding/mojibake signature scan on edited files
- Grammar placeholder scan
- Local server response check

## Files Changed
- `js/onboarding.js`
- `js/beginner-launchpad.js`
- `js/app.js`
- `css/main.css`
- `data/grammar_academy.json`
- `index.html`
- `sw.js`
- `APP_QA_REPORT.md`

## Remaining Manual QA Recommended
These should still be checked by ear/hand on your actual iPhone/iPad:
- Whether iOS picks a good Traditional Chinese voice for TTS.
- Whether `b / p / m`, `z / zh`, `u / ü`, and tone-pair drills sound distinct enough on your device voice.
- Whether TOCFL official audio plays reliably on mobile Safari.
- Whether long TOCFL image panels remain readable across iPhone and iPad sizes.
- Whether localStorage progress behavior is acceptable across your three devices, since static GitHub Pages does not sync progress by itself.

## Notes
The Human Pinyin Lab is still using TTS fallback unless real human recordings are added to `assets/audio/pinyin-human` and mapped in `data/pinyin_human_manifest.json`. The UI now handles fallback more reliably, but real human audio is still the best long-term fix for confusing sounds like `bu` vs `mu`.

## 2026-05-18 Router Regression Follow-up

User-reported issue: answering a tone / Human Pinyin Lab question from `#/onboarding` could leave the URL on onboarding while the visible content changed to TOCFL Content.

Root cause: async route renders could finish after the user had already changed routes. The old render wrote into `#page-content`, then the router returned without correcting the stale content.

Fixes applied:
- Strengthened the router token guard in `js/app.js` so stale async renders re-run the current route instead of leaving old content visible.
- Bumped `index.html` app script cache and `sw.js` cache so browsers pull the new router.
- Fixed `#/vocabulary` preload timing: the Vocabulary Library now loads vocabulary/character data itself when global preload has not finished.
- Removed a stale emoji fallback from the Vocabulary search control.

Verification performed:
- `node --check` passed for `js/app.js`, `js/vocabulary.js`, `js/onboarding.js`, `js/beginner-launchpad.js`, `js/grammar.js`, and `sw.js`.
- Encoding scan found no replacement-character or common mojibake byte signatures in edited files.
- 29 route smoke checks passed: no spinner lock, empty error state, replacement character, or wrong TOCFL content on unrelated routes.
- Human Pinyin Lab answer test passed: answer buttons disable, correct/wrong indicators appear, and route remains `#/onboarding` with `Pinyin & Tones` visible.
- TOCFL-content interaction followed by navigating back to onboarding no longer overwrites onboarding with TOCFL content.
