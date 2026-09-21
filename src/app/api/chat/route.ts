import { NextRequest } from "next/server";
import { getScenario } from "@/lib/scenarios";
import {
  hasApiKey,
  streamChatCompletion,
  openAiSseToTextStream,
  type ChatMessage,
} from "@/lib/openai";
import { getMockReply, mockStreamText } from "@/lib/mock";

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
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const scenario = getScenario(body.scenarioId);
  if (!scenario) {
    return new Response(JSON.stringify({ error: "Unknown scenario" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const userTurns = (body.messages || []).filter((m) => m.role === "user");
  const lastUser = userTurns[userTurns.length - 1]?.content ?? "";

  if (!hasApiKey()) {
    const reply = getMockReply(
      scenario.id,
      lastUser,
      Math.max(0, userTurns.length - 1)
    );
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of mockStreamText(reply)) {
          controller.enqueue(encoder.encode(chunk));
        }
        controller.close();
      },
    });
    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Demo-Mode": "true",
        "Cache-Control": "no-cache",
      },
    });
  }

  const history: ChatMessage[] = [
    { role: "system", content: scenario.systemPrompt },
    ...(body.messages || []).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
  ];

  try {
    const openaiRes = await streamChatCompletion(history);
    if (!openaiRes.body) {
      throw new Error("No response body from OpenAI");
    }
    const textStream = openAiSseToTextStream(openaiRes.body);
    return new Response(textStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Chat failed";
    return new Response(JSON.stringify({ error: message }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }
}
