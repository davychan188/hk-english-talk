import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Whisper/OpenAI transcription is not used — dialogue runs on xAI Grok.
 * Voice input relies on the browser Web Speech API (en-GB).
 */
export async function POST() {
  return NextResponse.json(
    {
      error:
        "伺服器語音轉文字（Whisper）已停用。本應用使用 xAI Grok 對話，請改用瀏覽器麥克風語音辨識（en-GB），或直接輸入文字。",
      code: "BROWSER_STT_ONLY",
      hint: "Use browser SpeechRecognition (en-GB) or type your reply.",
    },
    { status: 501 }
  );
}
