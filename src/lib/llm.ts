/**
 * Dialogue engine: xAI Grok (OpenAI-compatible Chat Completions).
 * Priority: XAI_API_KEY / GROK_API_KEY → demo mock (no OpenAI required).
 */

export type Provider = "grok" | "demo";

export function getGrokApiKey(): string | undefined {
  const key =
    process.env.XAI_API_KEY ||
    process.env.GROK_API_KEY ||
    undefined;
  return key && key.trim() ? key.trim() : undefined;
}

export function hasApiKey(): boolean {
  return Boolean(getGrokApiKey());
}

export function getProvider(): Provider {
  return hasApiKey() ? "grok" : "demo";
}

export const XAI_BASE_URL =
  process.env.XAI_BASE_URL || "https://api.x.ai/v1";

/** Sensible default for practice chat; override with XAI_MODEL / GROK_MODEL. */
export const DEFAULT_MODEL =
  process.env.XAI_MODEL ||
  process.env.GROK_MODEL ||
  "grok-3-mini";

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

async function xaiChat(
  messages: ChatMessage[],
  options: { temperature?: number; stream: boolean }
): Promise<Response> {
  const apiKey = getGrokApiKey();
  if (!apiKey) {
    throw new Error("XAI_API_KEY / GROK_API_KEY not configured");
  }

  const res = await fetch(`${XAI_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      messages,
      temperature: options.temperature ?? 0.8,
      stream: options.stream,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`xAI/Grok error ${res.status}: ${text}`);
  }

  return res;
}

export async function streamChatCompletion(
  messages: ChatMessage[],
  options?: { temperature?: number }
): Promise<Response> {
  return xaiChat(messages, {
    temperature: options?.temperature ?? 0.8,
    stream: true,
  });
}

export async function chatCompletion(
  messages: ChatMessage[],
  options?: { temperature?: number }
): Promise<string> {
  const res = await xaiChat(messages, {
    temperature: options?.temperature ?? 0.5,
    stream: false,
  });
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() ?? "";
}

/** Convert OpenAI-compatible SSE stream into a plain text ReadableStream of tokens. */
export function sseToTextStream(
  body: ReadableStream<Uint8Array>
): ReadableStream<Uint8Array> {
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";

  return new ReadableStream({
    async start(controller) {
      const reader = body.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith("data:")) continue;
            const data = trimmed.slice(5).trim();
            if (data === "[DONE]") continue;
            try {
              const json = JSON.parse(data);
              const token = json.choices?.[0]?.delta?.content;
              if (token) controller.enqueue(encoder.encode(token));
            } catch {
              // skip malformed chunks
            }
          }
        }
      } finally {
        controller.close();
      }
    },
  });
}

/** @deprecated Use sseToTextStream — kept for any leftover imports. */
export const openAiSseToTextStream = sseToTextStream;
