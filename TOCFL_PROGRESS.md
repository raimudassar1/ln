# TOCFL Lab Progress

## Implemented in this pass

- Added a new `#/tocfl` route named **TOCFL Lab**.
- Added a standalone `js/tocfl.js` module for TOCFL preparation and simulation.
- Added grouped phone bottom navigation:
  - Start
  - Study
  - Quiz
  - Reading
  - Practice
- Added a secondary mobile section bar that opens short route choices for each group.
- Added TOCFL Lab to the desktop/sidebar navigation under mock tests.
- Added cache busting for `tocfl.js`, `app.js`, `main.css`, and service worker assets.
- TOCFL Lab currently generates practice/simulation questions from existing website data:
  - `characters_all.json`
  - `vocabulary.json`
  - `readings.json`
  - `book1_content.json`
- Supported modes:
  - Prepare
  - Simulation
  - Review
- Supported bands:
  - Novice / 準備級 / Pre-A1
  - Band A / 入門基礎級 / A1-A2
  - Band B / 進階高階級 / B1-B2
- Supported skill flows:
  - Listening with TTS playback
  - Reading objective questions
  - Writing practice prompts
  - Mixed listening + reading flow
- Added local result history in `tocfl_progress.tocflHistory`.

## Current limitations

- This is a strong website-generated simulation foundation, not an official TOCFL item bank.
- Listening uses browser TTS from generated text, not recorded official-style audio.
- Picture-based listening/reading placeholders are not implemented yet because we need a picture asset bank.
- Writing has model-answer review, but not automated rubric grading yet.
- Band B supports B1/B2 structure, but a deeper B1-specific and B2-specific item difficulty model should be added.
- Official 700-point Rasch/IRT scoring is approximated with website percentage bands.

## Next steps

1. Build a dedicated `data/tocfl_items.json` item bank with official-style metadata:
   - band
   - skill
   - section
   - difficulty
   - prompt
   - audio text or audio URL
   - image URL where needed
   - options
   - answer
   - explanation
   - vocabulary tags
   - grammar tags
2. Add picture assets for Novice and Band A picture-description sections.
3. Add a real timer and pause/resume behavior for full simulations.
4. Add writing rubrics:
   - task completion
   - organization
   - grammar accuracy
   - vocabulary range
   - coherence and style
5. Connect TOCFL misses to the Weakness Engine:
   - listening detail
   - reading inference
   - grammar gap
   - vocabulary gap
   - tone/listening confusion
6. Add review pages grouped by weak skill and TOCFL band.
7. Expand Band B passages with longer monologue/dialogue and reading comprehension tasks.

## Design note

The current implementation intentionally keeps the TOCFL feature data-driven and modular. Future work should expand the item bank rather than hard-coding many questions directly into UI code.

## Update: TOCFL Exam Center redesign

Implemented after first foundation pass:

- Reworked TOCFL UI into a clearer **TOCFL Exam Center**.
- Modes are now:
  - Study Plan
  - Practice Parts
  - Mock Exams
  - Review
- Added five fixed official-style mock simulation sets per band:
  - Novice Mock 1-5
  - Band A Mock 1-5
  - Band B Mock 1-5
- Each mock set supports:
  - Listening block
  - Reading block
  - Full Listening + Reading block
- Mock questions are stable per mock ID using seeded generation.
- Section counts follow public TOCFL-style structure:
  - Novice Listening: 25 items across 3 sections
  - Novice Reading: 25 items across 2 sections
  - Band A Listening: 50 items across 4 sections
  - Band A Reading: 50 items across 5 sections
  - Band B Listening: 50 items across Dialogue + Monologue
  - Band B Reading: 50 items across Gap Filling + Reading Comprehension
- Added exam-room UI:
  - timer
  - section label
  - question progress bar
  - question palette
  - answer review
- Added reference links to public TOCFL sources.

Important note: the implementation uses official public structure as reference, but does not copy entire official/mock exam passages into the site. The generated items use this website's existing curriculum data to avoid copyright problems and to keep practice aligned with the learner's current content.

## Update: Native TOCFL Content Browser

Implemented a local official-content browser for the downloaded Novice and Band A / A1-A2 TOCFL folders.

- Added route: `#/tocfl-content`.
- Added sidebar and mobile Quiz section entry: `TOCFL Content`.
- Generated native bank: `data/tocfl_native_bank.json`.
- Extracted visual question panels into `assets/tocfl-native/`.
- Current bank coverage:
  - 840 total questions
  - 840 extracted visual panels
  - 624 questions with selectable extracted question text and/or listening scripts
  - 518 local MP3 files connected where matching audio exists
  - official answer sheets connected for reveal/review
- Browser mode preserves the original official PDF/image layout while also showing copyable Chinese text when the source PDF exposes text.
- Test mode lets the learner answer locally and checks against the downloaded answer sheets.

Notes for future continuation:

- Some official PDFs are image-only, so their Chinese is preserved visually but not yet copyable text. To make every image-only prompt copyable, add OCR extraction for those PDFs.
- The current implementation is limited to the user-provided local Novice and Band A content. B-level official-content import is intentionally not included yet.
- Original PDF and answer-sheet links remain available as fallback, but the main study/test flow is native in the webpage.

## Update: Native TOCFL Render Fix

Fixed the issue where some TOCFL items displayed only the official watermark/logo instead of the real question pictures.

- Rebuilt all 840 native question visuals from rendered PDF page screenshots instead of embedded PDF image extraction.
- Cropped the rendered screenshots to the useful question area so the page no longer shows full A4 whitespace.
- Updated `data/tocfl_native_bank.json` so every question points to `assets/tocfl-native-rendered/` images.
- Added selectable answer buttons in browse mode.
- Answers now check instantly against the official answer sheet and show Correct / Not quite feedback.

Note: some official PDFs include a faint watermark behind the real question content. The old problem was extracting only that watermark layer. The rendered version preserves the actual question content and may still show the faint official background watermark when it is part of the PDF page.
