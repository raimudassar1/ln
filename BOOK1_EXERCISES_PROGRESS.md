# Book 1 Comprehensive Exercises Progress

Last updated: 2026-05-16

## Goal

Turn Book 1 Course Books into a complete learning and testing environment for all 15 lessons, using the lesson dialogues and vocabulary as source material.

## Implemented In This Pass

- Added `data/book1_exercises.json` generated from:
  - `data/book1_dialogues.json`
  - `books/book1/vocabulary_b1.json`
- Covered all 15 Book 1 lessons.
- Current total: 600 generated activities (Expanded to cover both Dialogue 1 and Dialogue 2).
- Each lesson includes:
  - Listening comprehension based on both dialogue parts.
  - Reading comprehension based on dialogue speakers and meaning.
  - Pinyin recognition (10 per lesson) based on lesson vocabulary.
  - Writing recall prompts (10 per lesson) based on lesson vocabulary.
- Added a Comprehensive Practice section inside Course Books after dialogues and before vocabulary.
- Added tabs for Listening, Reading, Pinyin, and Writing.
- Added checking/feedback behavior for multiple-choice and writing prompts.
- Wrong answers can feed the Weakness Engine.
- Fixed TTS playback for dialogues and exercises.

## Design Direction

This should become the main Book 1 lesson practice environment:

1. Listen to full dialogue or selected line.
2. Answer comprehension questions.
3. Read the dialogue/story version.
4. Match speaker/meaning.
5. Practice pinyin recognition.
6. Type Chinese from English and pinyin hints.
7. Review vocabulary after the active practice.

## Current Limitations

- The first version uses generated exercises from existing source data, not hand-authored exam-quality questions.
- Full-dialogue audio is currently simulated through line-level TTS unless native full audio files are mapped later.
- Writing checks exact Traditional/Simplified answers from vocabulary entries; it does not yet support fuzzy semantic answers.
- Reading currently uses dialogue text rather than newly authored prose stories.

## Next Improvements

- Add full dialogue/story audio playback per lesson.
- Add short prose reading passages derived from each lesson dialogue.
- Add fill-in-the-blank cloze exercises using missing vocabulary or particles.
- Add dictation mode: listen, then type pinyin or Chinese.
- Add score tracking per lesson and skill area.
- Add review mode that only repeats missed listening/reading/writing prompts.
- Add manually reviewed comprehension questions for each lesson.

## Files To Check

- `data/book1_exercises.json`
- `data/book1_dialogues.json`
- `js/vocabulary_books.js`
- `sw.js`
- `index.html`
