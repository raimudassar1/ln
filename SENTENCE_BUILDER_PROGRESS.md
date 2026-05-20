# Sentence Builder Curriculum Progress

Last updated: 2026-05-16

## Goal

Build a large level-based Sentence Builder curriculum that helps learners progress from Novice through A2 with increasingly complex sentence patterns.

## Current Implementation Status

- Added `data/sentence_builder_levels.json` as the primary curriculum source.
- Added 6 curriculum levels:
  - Novice Level 1
  - Novice Level 2
  - A1 Level 1
  - A1 Level 2
  - A2 Level 1
  - A2 Level 2
- Each level currently contains 100 sentence-building prompts.
- Total current sentence count: 600.
- Sentence Builder UI now includes level selection, practice source selection, and configurable session length.
- Learners can choose Curriculum Bank mode or Generate Practice mode.
- Session length supports 10, 20, 50, 100, or a custom count up to 999 questions.
- Curriculum Bank mode draws from the fixed 100-sentence set for each level.
- Generate Practice mode creates level-matched sentences from reusable vocabulary and grammar templates.
- The builder uses curriculum-provided word tiles first, then falls back to automatic segmentation if needed.
- Grammar consistency audit completed for all 600 fixed curriculum prompts on 2026-05-16.
- The fixed bank was rebalanced so every level includes its intended grammar families instead of overfilling from early templates.
- Live generated-practice templates were also patched for English agreement and natural home movement wording.
- Each sentence includes:
  - `id`
  - `zh`
  - `pinyin` placeholder
  - `en`
  - `tiles`
  - `tags`
  - `difficulty`

## Design Decision

The sentences are stored in JSON data, not hardcoded inside JavaScript. This keeps the curriculum expandable and makes future review/editing easier.

## Level Progression

- Novice Level 1: identity, possession, simple actions, basic location.
- Novice Level 2: questions, negation, time words, likes, simple daily choices.
- A1 Level 1: daily routines, transport, shopping, simple sequence.
- A1 Level 2: comparisons, preferences, reason-result patterns, feelings.
- A2 Level 1: longer connected sentences, conditions, contrast, 把 structure.
- A2 Level 2: multi-clause natural sentences, opinions, conditions, preference patterns.

## Next Improvements

- Add reviewed pinyin for all 600 sentences.
- Add chapter/scenario alignment fields, for example `chapterId` or `scenarioId`.
- Add grammar-point explanations per level.
- Add unlock/progress logic so learners advance level-by-level.
- Add weak-area filtering, for example practice only measure words or tones.
- Add manual editorial review for naturalness and translation quality.
- Consider expanding beyond A2 later: B1 Level 1 and B1 Level 2.

## Files To Check

- `data/sentence_builder_levels.json`
- `js/sentence-builder.js`
- `css/main.css`
- `sw.js`
- `index.html`

## Notes

The first 600-sentence set is curriculum-generated from controlled patterns. It is useful for practice volume and level progression, but should still receive human/editorial review over time for naturalness, pinyin, and textbook alignment.
