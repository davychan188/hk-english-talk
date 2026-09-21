# HK English Talk｜香港英語對話練習

AI English conversation practice for Hong Kong learners.  
UI chrome in Traditional Chinese; practice dialogue in English. Partners feel warm and natural — not textbook bots.

Supports **text + voice**, plus Speak-style **grammar tips** under each of your lines.

---

## 快速開始 / Quick start

```bash
npm install
cp .env.example .env.local   # optional — add your API key
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
| `OPENAI_API_KEY` | No* | Live chat, grammar tips, Whisper STT, OpenAI TTS |
| `AI_API_KEY` | No* | Alias for the same key |
| `OPENAI_MODEL` / `AI_MODEL` | No | Defaults to `gpt-4o-mini` |
| `OPENAI_TTS_MODEL` | No | Defaults to `tts-1` |
| `OPENAI_TTS_VOICE` | No | Defaults to `nova` |

\*Without a key, the app runs in **demo mode**: mock chat + heuristic grammar tips + **browser** Web Speech STT/TTS. UI stays fully reviewable.

Never commit `.env.local` or hardcode secrets.

---

## MVP 功能 / What's in this MVP

1. **Scenario picker** — 5 Hong Kong–flavoured scenarios (coffee shop, office interview, MTR directions, new colleagues, dim sum).
2. **Text chat** — Streaming replies when an API key is set; optional brief zh-Hant tips (`💡 小提示`).
3. **Grammar suggestions** — After each learner utterance, Speak-style tips (original → more natural, zh-Hant reason, level: good / minor / important). Non-blocking under the user bubble. Demo heuristics without an API key; LLM via `/api/grammar` when keyed.
4. **Voice input (STT)** — Hold **🎤 按住說話**. Uses browser `SpeechRecognition` (`en-US`) with zero keys. Fallback: record → `/api/transcribe` (Whisper) when an API key is set.
5. **Voice output (TTS)** — Auto-plays partner replies after streaming ends (toggle **靜音** / **自動播放**). Browser `speechSynthesis` in demo; `/api/speech` (OpenAI TTS) when keyed. Per-message **播放語音** button. Tips in Chinese are not spoken.
6. **End session feedback** — 3–5 concrete tips. No fake scores.
7. **Mobile-friendly** UI; no auth.

---

## 文法建議 / Grammar tips

After you send (or speak) an English line, a card appears under your bubble:

- **你說** (struck through) vs **更自然** alternative  
- Short Traditional Chinese reason  
- Levels: **講得自然** / **小建議** / **要注意**  

Chat and voice keep going — tips never block the conversation.

---

## 語音使用方式 / How to use voice

1. Open a scenario.
2. Tap **🔊 語音** if muted; leave **自動播放** on to hear replies.
3. **Hold** the mic button, speak English, **release** to send.
4. Or type and press **送出** as before.
5. Tap **播放語音** under any partner message to hear it again.

### Browser notes (especially iOS)

- **Chrome / Edge (desktop & Android)**: Web Speech STT + TTS work best.
- **Safari (macOS / iOS)**: `speechSynthesis` works after a user gesture; dictation/`SpeechRecognition` support is limited or unavailable on many iOS versions — use typing, or set an API key for Whisper mic fallback (MediaRecorder).
- Mic and audio require **HTTPS** (or `localhost`) and microphone permission.
- First tap on mic/send helps unlock audio on iOS.

---

## 專案結構 / Layout

```
src/
  app/
    page.tsx                 # Home / scenario picker
    chat/[scenarioId]/      # Practice chat (+ voice)
    api/chat/                # Streaming LLM (or mock)
    api/feedback/            # End-of-session tips
    api/grammar/             # Per-utterance grammar tips
    api/transcribe/          # Whisper STT fallback
    api/speech/              # OpenAI TTS
    api/status/
  components/                # ChatUI, MicButton, …
  hooks/                     # useVoiceInput, useVoiceOutput
  lib/
    scenarios.ts | openai.ts | mock.ts | speech-client.ts
```

---

## 下一步 / Next steps

- Better iOS STT (always-on Whisper path UX)
- Persist session history
- More scenarios & difficulty levels
- Deploy on Vercel — set `OPENAI_API_KEY` in project env

---

## License

Private repository — all rights reserved by the owner.
