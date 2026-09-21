# HK English Talk｜香港英語對話練習

AI English conversation practice for Hong Kong learners.  
UI chrome in Traditional Chinese; practice dialogue in **formal British English**.  
Partners feel warm and natural — not textbook bots.

Powered by **xAI Grok** when configured; otherwise a full **demo mode** with mocks.

Supports **text + voice** (browser en-GB), plus Speak-style **grammar tips** under each of your lines.

---

## 快速開始 / Quick start

```bash
npm install
cp .env.example .env.local   # add XAI_API_KEY for live Grok
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Production build:

```bash
npm run build
npm start
```

### Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `XAI_API_KEY` | No* | xAI API key for Grok chat, grammar, feedback |
| `GROK_API_KEY` | No* | Alias for the same key |
| `XAI_MODEL` / `GROK_MODEL` | No | Defaults to `grok-3-mini` |
| `XAI_BASE_URL` | No | Defaults to `https://api.x.ai/v1` |

\*Without a key → **demo mode**: mock chat + heuristic grammar tips + browser en-GB STT/TTS. UI stays fully reviewable.

Get a key at [console.x.ai](https://console.x.ai/). Never commit `.env.local`.

**Provider priority:** `XAI_API_KEY` / `GROK_API_KEY` → live Grok; else demo. OpenAI is not required.

### `/api/status`

```json
{ "provider": "grok" | "demo", "demoMode": true, "model": "grok-3-mini"|null, "stt": "browser", "tts": "browser-en-GB" }
```

---

## MVP 功能 / What's in this MVP

1. **Scenario picker** — 7 Hong Kong–flavoured scenarios (coffee shop, interview, MTR, colleagues, dim sum, **football / Premier League**, weekend plans); partners use formal British English.
2. **Text chat** — Streaming Grok replies when keyed; optional brief zh-Hant tips (`💡 小提示`).
3. **Grammar suggestions** — Speak-style tips (original → British natural phrasing, zh-Hant reason, good / minor / important).
4. **Voice input (STT)** — Hold **🎤 按住說話**. Browser `SpeechRecognition` with **`en-GB`**. No server Whisper.
5. **Voice output (TTS)** — Browser **`speechSynthesis` en-GB** (~0.92 rate). xAI has no TTS.
6. **End session feedback** — 3–5 concrete tips. No fake scores.
7. **Mobile-friendly** UI; no auth.

---

## 文法建議 / Grammar tips

After you send (or speak) an English line, a card appears under your bubble:

- **你說** (struck through) vs **更自然** alternative (British preferred)  
- Short Traditional Chinese reason  
- Levels: **講得自然** / **小建議** / **要注意**  

---

## 語音使用方式 / How to use voice

1. Open a scenario.
2. Tap **🔊 語音** if muted; leave **自動播放** on to hear replies (British voice when available).
3. **Hold** the mic button, speak English, **release** to send.
4. Or type and press **送出**.
5. Tap **播放語音** under any partner message to hear it again.

### Browser notes (especially iOS)

- **Chrome / Edge**: Best for en-GB STT + TTS.
- **Safari / iOS**: TTS needs a user gesture; SpeechRecognition often limited — type instead.
- Mic/audio need **HTTPS** or `localhost`.

---

## 專案結構 / Layout

```
src/
  app/
    page.tsx
    chat/[scenarioId]/
    api/chat/                # Grok streaming (or mock)
    api/grammar/             # Grok grammar tips (or heuristics)
    api/feedback/
    api/status/              # provider: grok | demo
    api/transcribe/          # 501 — browser STT only
    api/speech/              # 501 — browser en-GB TTS only
  components/
  hooks/
  lib/
    llm.ts                   # xAI Grok client
    scenarios.ts | mock.ts | grammar.ts | speech-client.ts
```

---

## 部署 / Deploy

Vercel: set `XAI_API_KEY` (and optional `XAI_MODEL`) in project Environment Variables, then deploy.

```bash
npx vercel --prod --yes   # requires VERCEL_TOKEN or logged-in CLI
```

---

## License

Private repository — all rights reserved by the owner.
