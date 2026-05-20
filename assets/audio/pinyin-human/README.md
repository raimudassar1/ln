# Human Pinyin Lab Audio

Place licensed Mandarin pronunciation recordings here and map them in `data/pinyin_human_manifest.json`.

Example manifest entry:

```json
{
  "items": {
    "tone_ma_1": { "src": "assets/audio/pinyin-human/tone_ma_1.mp3", "speaker": "native female", "license": "CC BY" }
  }
}
```

The app will automatically use a mapped recording first. If a key is missing or the file cannot play, it falls back to the browser TTS so drills still work offline.
