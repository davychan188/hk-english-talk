# HK English Talk｜香港英語對話練習

AI English conversation practice for Hong Kong learners.  
UI chrome in Traditional Chinese; practice dialogue in English. Partners feel warm and natural — not textbook bots.

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
| `OPENAI_API_KEY` | No* | OpenAI API key for live streaming chat |
| `AI_API_KEY` | No* | Alias for the same key |
| `OPENAI_MODEL` / `AI_MODEL` | No | Defaults to `gpt-4o-mini` |

\*Without a key, the app runs in **demo mode** with mock streaming replies so the full UI is reviewable.

Never commit `.env.local` or hardcode secrets.

---

## MVP 功能 / What's in this MVP

1. **Scenario picker** — 5 Hong Kong–flavoured scenarios (coffee shop, office interview, MTR directions, new colleagues, dim sum). English title + Traditional Chinese description.
2. **Text chat** — Streaming replies when an API key is set; stays in character; optional brief zh-Hant correction tips (`💡 小提示`).
3. **End session feedback** — 3–5 concrete tips on grammar / vocab / natural phrasing. No fake scores.
4. **Mobile-friendly** clean UI; no auth.

---

## 專案結構 / Layout

```
src/
  app/
    page.tsx                 # Home / scenario picker
    chat/[scenarioId]/      # Practice chat
    api/chat/                # Streaming LLM (or mock)
    api/feedback/            # End-of-session tips
    api/status/              # Demo-mode flag
  components/                # ChatUI, ScenarioCard, FeedbackPanel, …
  lib/
    scenarios.ts             # Scenario data + prompts
    openai.ts                # API key helper + OpenAI client
    mock.ts                  # Demo replies & tips
```

---

## 下一步 / Next steps

- Voice input / output (speech-to-text + TTS)
- Persist session history (localStorage or DB)
- More scenarios & difficulty levels
- Deploy (Vercel recommended — set `OPENAI_API_KEY` in project env)

---

## License

Private repository — all rights reserved by the owner.
