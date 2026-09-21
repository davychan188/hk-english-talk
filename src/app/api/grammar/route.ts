import { NextRequest, NextResponse } from "next/server";
import { getScenario } from "@/lib/scenarios";
import { hasApiKey, chatCompletion, type ChatMessage } from "@/lib/openai";
import {
  getMockGrammarTips,
  type GrammarTip,
  type GrammarLevel,
} from "@/lib/grammar";

export const runtime = "nodejs";

type Body = {
  text?: string;
  scenarioId?: string;
};

function normalizeTips(raw: unknown): GrammarTip[] {
  if (!Array.isArray(raw)) return [];
  const levels: GrammarLevel[] = ["good", "minor", "important"];
  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const o = item as Record<string, unknown>;
      const original = String(o.original ?? "").trim();
      const suggestion = String(o.suggestion ?? "").trim();
      const reasonZh = String(o.reasonZh ?? o.reason ?? "").trim();
      let level = String(o.level ?? "minor").toLowerCase() as GrammarLevel;
      if (!levels.includes(level)) level = "minor";
      if (!original || !suggestion || !reasonZh) return null;
      return { original, suggestion, reasonZh, level } satisfies GrammarTip;
    })
    .filter((t): t is GrammarTip => t !== null)
    .slice(0, 3);
}

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const text = (body.text || "").trim();
  if (!text) {
    return NextResponse.json({ error: "Missing text" }, { status: 400 });
  }

  const scenario = body.scenarioId ? getScenario(body.scenarioId) : undefined;

  if (!hasApiKey()) {
    return NextResponse.json({
      tips: getMockGrammarTips(text),
      demoMode: true,
    });
  }

  const context = scenario
    ? `Scenario: ${scenario.title} (${scenario.setting}). Partner: ${scenario.partnerName}.`
    : "General English conversation practice.";

  const messages: ChatMessage[] = [
    {
      role: "system",
      content: `You are an English coach for Hong Kong learners (Cantonese speakers), Speak/Toko style.
Analyze ONE learner utterance for grammar, articles, tense, prepositions, and natural spoken English.
Return ONLY a JSON object: {"tips":[{"original":"...","suggestion":"...","reasonZh":"...","level":"good"|"minor"|"important"}]}
Rules:
- 0–3 tips max. Prefer the most useful 1–2.
- "original" = the problematic span (or full sentence if praising).
- "suggestion" = a more natural alternative (same as original when level is "good").
- "reasonZh" = one short Traditional Chinese explanation for HK users.
- level "good": sentence is already natural — one praise tip, reasonZh like 「講得自然」.
- level "minor": polish / politeness / natural phrasing.
- level "important": clear grammar/tense/article error that confuses meaning.
- Do not invent issues. Do not score. No markdown.`,
    },
    {
      role: "user",
      content: `${context}\n\nLearner said:\n"""${text}"""`,
    },
  ];

  try {
    const raw = await chatCompletion(messages, { temperature: 0.3 });
    const cleaned = raw
      .replace(/^```json?\s*/i, "")
      .replace(/```$/i, "")
      .trim();
    let tips: GrammarTip[] = [];
    try {
      const parsed = JSON.parse(cleaned);
      tips = normalizeTips(parsed.tips ?? parsed);
    } catch {
      tips = getMockGrammarTips(text);
    }
    if (tips.length === 0) {
      tips = [
        {
          original: text,
          suggestion: text,
          reasonZh: "講得自然！繼續保持。",
          level: "good",
        },
      ];
    }
    return NextResponse.json({ tips, demoMode: false });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Grammar failed";
    return NextResponse.json(
      {
        error: message,
        tips: getMockGrammarTips(text),
        demoMode: false,
      },
      { status: 200 }
    );
  }
}
