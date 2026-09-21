/** Browser speech helpers (Web Speech API). Client-only — formal British English. */

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

/** Prefer a British English voice (en-GB). */
export function pickBritishVoice(): SpeechSynthesisVoice | null {
  if (!isSpeechSynthesisSupported()) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  const prefer = [
    (v: SpeechSynthesisVoice) =>
      v.lang.startsWith("en-GB") &&
      /google uk english female|uk english female/i.test(v.name),
    (v: SpeechSynthesisVoice) =>
      v.lang.startsWith("en-GB") &&
      /google uk english male|uk english male|daniel|serena|martha|libby|siri.*british/i.test(
        v.name
      ),
    (v: SpeechSynthesisVoice) =>
      v.lang.startsWith("en-GB") && /female/i.test(v.name),
    (v: SpeechSynthesisVoice) => v.lang.startsWith("en-GB"),
    (v: SpeechSynthesisVoice) =>
      /british|en.gb|england|uk english/i.test(`${v.lang} ${v.name}`),
    (v: SpeechSynthesisVoice) => v.lang.startsWith("en"),
  ];
  for (const pred of prefer) {
    const found = voices.find(pred);
    if (found) return found;
  }
  return voices[0] ?? null;
}

/** @deprecated Use pickBritishVoice */
export const pickEnglishVoice = pickBritishVoice;

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
  u.lang = "en-GB";
  u.rate = 0.92;
  const voice = pickBritishVoice();
  if (voice) {
    u.voice = voice;
    if (voice.lang) u.lang = voice.lang;
  }
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
    setTimeout(() => {
      window.speechSynthesis.removeEventListener("voiceschanged", handler);
      resolve();
    }, 1500);
  });
}
