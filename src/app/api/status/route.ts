import { NextResponse } from "next/server";
import { hasApiKey } from "@/lib/openai";

export async function GET() {
  return NextResponse.json({
    demoMode: !hasApiKey(),
    model: process.env.OPENAI_MODEL || process.env.AI_MODEL || "gpt-4o-mini",
  });
}
