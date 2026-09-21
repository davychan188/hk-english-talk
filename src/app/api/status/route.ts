import { NextResponse } from "next/server";
import { getProvider, hasApiKey, DEFAULT_MODEL } from "@/lib/llm";

export async function GET() {
  const provider = getProvider();
  return NextResponse.json({
    provider,
    demoMode: provider === "demo" || !hasApiKey(),
    model: provider === "grok" ? DEFAULT_MODEL : null,
    stt: "browser",
    tts: "browser-en-GB",
  });
}
