/** Browser speech helpers (Web Speech API). Client-only. */

export type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
};

export type SpeechRecognitionEventLike = {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      length: number;
      [index: number]: { transcript: string };
    };
  };
};

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

export function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export function isSpeechRecognitionSupported(): boolean {
  return getSpeechRecognitionCtor() !== null;
}

export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/** Prefer an English voice for practice partners. */
export function pickEnglishVoice(): SpeechSynthesisVoice | null {
  if (!isSpeechSynthesisSupported()) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  const prefer = [
    (v: SpeechSynthesisVoice) =>
      v.lang.startsWith("en-GB") && /female|samantha|karen|moira|fiona/i.test(v.name),
    (v: SpeechSynthesisVoice) => v.lang.startsWith("en-US") && /samantha|female/i.test(v.name),
    (v: SpeechSynthesisVoice) => v.lang.startsWith("en-GB"),
    (v: SpeechSynthesisVoice) => v.lang.startsWith("en-US"),
    (v: SpeechSynthesisVoice) => v.lang.startsWith("en"),
  ];
  for (const pred of prefer) {
    const found = voices.find(pred);
    if (found) return found;
  }
  return voices[0] ?? null;
}

/** Strip zh-Hant tip lines before speaking. */
export function textForSpeech(content: string): string {
  return content
    .split("\n")
    .filter((line) => !line.trim().startsWith("💡"))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

export function speakWithBrowser(
  text: string,
  options?: { onend?: () => void; onerror?: () => void }
): SpeechSynthesisUtterance | null {
  if (!isSpeechSynthesisSupported() || !text) {
    options?.onend?.();
    return null;
  }
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "en-US";
  u.rate = 0.95;
  const voice = pickEnglishVoice();
  if (voice) u.voice = voice;
  u.onend = () => options?.onend?.();
  u.onerror = () => options?.onerror?.();
  window.speechSynthesis.speak(u);
  return u;
}

export function stopBrowserSpeech() {
  if (isSpeechSynthesisSupported()) {
    window.speechSynthesis.cancel();
  }
}

/** Ensure voices are loaded (Chrome loads async). */
export function ensureVoicesLoaded(): Promise<void> {
  if (!isSpeechSynthesisSupported()) return Promise.resolve();
  const existing = window.speechSynthesis.getVoices();
  if (existing.length) return Promise.resolve();
  return new Promise((resolve) => {
    const handler = () => {
      window.speechSynthesis.removeEventListener("voiceschanged", handler);
      resolve();
    };
    window.speechSynthesis.addEventListener("voiceschanged", handler);
    // Fallback timeout
    setTimeout(() => {
      window.speechSynthesis.removeEventListener("voiceschanged", handler);
      resolve();
    }, 1500);
  });
}
