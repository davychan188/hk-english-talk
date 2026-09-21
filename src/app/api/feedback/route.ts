import { NextRequest, NextResponse } from "next/server";
import { getScenario } from "@/lib/scenarios";
import { hasApiKey, chatCompletion, type ChatMessage } from "@/lib/llm";
import { getMockFeedback } from "@/lib/mock";

export const runtime = "nodejs";

type Body = {
  scenarioId: string;
  messages: { role: "user" | "assistant"; content: string }[];
};

export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const scenario = getScenario(body.scenarioId);
  if (!scenario) {
    return NextResponse.json({ error: "Unknown scenario" }, { status: 400 });
  }

  const messages = body.messages || [];
  if (messages.length < 2) {
    return NextResponse.json({
      tips: [
        "多說幾句再結束會得到更具體的建議。試著完成至少 2–3 輪對話。",
        "練習時用完整句子，比單字回答更能提升流暢度。",
        "結束前主動問對方一個問題，對話會更自然。",
      ],
      demoMode: !hasApiKey(),
      provider: hasApiKey() ? "grok" : "demo",
    });
  }

  if (!hasApiKey()) {
    return NextResponse.json({
      tips: getMockFeedback(scenario),
      demoMode: true,
      provider: "demo",
    });
  }

  const transcript = messages
    .map(
      (m) =>
        `${m.role === "user" ? "Learner" : scenario.partnerName}: ${m.content}`
    )
    .join("\n");

  const prompt: ChatMessage[] = [
    {
      role: "system",
      content: `You are an encouraging English coach for Hong Kong learners practising formal British English.
Given a practice dialogue, write 3 to 5 concrete, actionable feedback tips in Traditional Chinese (zh-Hant).
Focus on grammar, vocabulary, and more natural formal British phrasing (colour, favour, organise; polite register) — based on what the learner actually said.
No scores, no percentages, no vague praise. Each tip should be one clear sentence.
Return ONLY a JSON array of strings, e.g. ["提示1","提示2","提示3"].`,
    },
    {
      role: "user",
      content: `Scenario: ${scenario.title} (${scenario.setting})\n\nDialogue:\n${transcript}`,
    },
  ];

  try {
    const raw = await chatCompletion(prompt, { temperature: 0.4 });
    let tips: string[] = [];
    try {
      const cleaned = raw
        .replace(/^```json?\s*/i, "")
        .replace(/```$/i, "")
        .trim();
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed)) {
        tips = parsed.map(String).filter(Boolean).slice(0, 5);
      }
    } catch {
      tips = raw
        .split("\n")
        .map((l) => l.replace(/^[-*\d.)\]]+\s*/, "").trim())
        .filter(Boolean)
        .slice(0, 5);
    }
    if (tips.length < 3) {
      tips = [...tips, ...getMockFeedback(scenario)].slice(0, 4);
    }
    return NextResponse.json({
      tips,
      demoMode: false,
      provider: "grok",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Feedback failed";
    return NextResponse.json(
      {
        error: message,
        tips: getMockFeedback(scenario),
        demoMode: false,
        provider: "grok",
      },
      { status: 502 }
    );
  }
}
