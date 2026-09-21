import { NextRequest, NextResponse } from "next/server";
import { getApiKey, hasApiKey } from "@/lib/openai";

export const runtime = "nodejs";

const DEFAULT_VOICE = process.env.OPENAI_TTS_VOICE || "nova";
const DEFAULT_TTS_MODEL = process.env.OPENAI_TTS_MODEL || "tts-1";

export async function POST(req: NextRequest) {
  if (!hasApiKey()) {
    return NextResponse.json(
      {
        error:
          "OpenAI TTS 需要 OPENAI_API_KEY。請改用瀏覽器語音合成，或設定金鑰。",
        code: "NO_API_KEY",
      },
      { status: 503 }
    );
  }

  let body: { text?: string; voice?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const text = (body.text || "").trim();
  if (!text) {
    return NextResponse.json({ error: "Missing text" }, { status: 400 });
  }
  // Cap length for cost/latency
  const clipped = text.slice(0, 4000);

  const apiKey = getApiKey()!;
  try {
    const res = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: DEFAULT_TTS_MODEL,
        voice: body.voice || DEFAULT_VOICE,
        input: clipped,
        response_format: "mp3",
      }),
    });
    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json(
        { error: `TTS error ${res.status}: ${errText}` },
        { status: 502 }
      );
    }
    const buf = await res.arrayBuffer();
    return new NextResponse(buf, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Speech failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
