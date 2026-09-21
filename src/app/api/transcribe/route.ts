import { NextRequest, NextResponse } from "next/server";
import { getApiKey, hasApiKey } from "@/lib/openai";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  if (!hasApiKey()) {
    return NextResponse.json(
      {
        error:
          "Whisper 需要 OPENAI_API_KEY。請使用瀏覽器語音辨識，或在 .env.local 設定金鑰。",
        code: "NO_API_KEY",
      },
      { status: 503 }
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = form.get("file") || form.get("audio");
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json(
      { error: "Missing audio file (field: file)" },
      { status: 400 }
    );
  }

  const apiKey = getApiKey()!;
  const openaiForm = new FormData();
  const filename =
    (file instanceof File && file.name) || "recording.webm";
  openaiForm.append("file", file, filename);
  openaiForm.append("model", "whisper-1");
  openaiForm.append("language", "en");

  try {
    const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: openaiForm,
    });
    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: `Whisper error ${res.status}: ${text}` },
        { status: 502 }
      );
    }
    const data = await res.json();
    return NextResponse.json({ text: (data.text as string)?.trim() ?? "" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Transcribe failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
