import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * xAI does not offer TTS. Client uses browser speechSynthesis (en-GB).
 */
export async function POST() {
  return NextResponse.json(
    {
      error:
        "伺服器 TTS 已停用。請使用瀏覽器英式語音（en-GB speechSynthesis）。",
      code: "BROWSER_TTS_ONLY",
    },
    { status: 501 }
  );
}
