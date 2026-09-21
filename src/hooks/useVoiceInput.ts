"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  getSpeechRecognitionCtor,
  isSpeechRecognitionSupported,
  type SpeechRecognitionLike,
} from "@/lib/speech-client";

export type MicState = "idle" | "listening" | "processing" | "unsupported" | "error";

type Options = {
  demoMode: boolean;
  onTranscript: (text: string) => void;
  lang?: string;
};

/**
 * Browser Web Speech API only (en-GB).
 * Server Whisper is disabled — dialogue uses xAI Grok; no OpenAI STT.
 */
export function useVoiceInput({
  demoMode: _demoMode,
  onTranscript,
  lang = "en-GB",
}: Options) {
  const [micState, setMicState] = useState<MicState>("idle");
  const [micError, setMicError] = useState<string | null>(null);
  const [browserStt, setBrowserStt] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const onTranscriptRef = useRef(onTranscript);
  onTranscriptRef.current = onTranscript;

  useEffect(() => {
    const ok = isSpeechRecognitionSupported();
    setBrowserStt(ok);
    if (!ok) setMicState("unsupported");
  }, []);

  const startListening = useCallback(() => {
    setMicError(null);
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      setMicState("unsupported");
      setMicError(
        "此瀏覽器不支援語音辨識。請改用文字輸入（Grok 對話不依賴 OpenAI Whisper）。"
      );
      return;
    }
    try {
      recognitionRef.current?.abort();
    } catch {
      /* ignore */
    }
    const rec = new Ctor();
    recognitionRef.current = rec;
    rec.lang = lang;
    rec.continuous = false;
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    let finalText = "";
    rec.onstart = () => {
      setMicState("listening");
    };
    rec.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const r = event.results[i];
        if (r.isFinal) finalText += r[0].transcript;
      }
    };
    rec.onerror = (event) => {
      if (event.error === "aborted" || event.error === "no-speech") {
        setMicState("idle");
        return;
      }
      if (event.error === "not-allowed") {
        setMicState("error");
        setMicError("麥克風權限被拒。請在瀏覽器設定允許後再試。");
        return;
      }
      setMicState("error");
      setMicError(
        `語音辨識錯誤：${event.error}。請改用文字輸入（未提供伺服器 Whisper）。`
      );
    };
    rec.onend = () => {
      const text = finalText.trim();
      setMicState("idle");
      if (text) onTranscriptRef.current(text);
    };
    try {
      rec.start();
    } catch {
      setMicState("error");
      setMicError("無法啟動語音辨識，請改用文字輸入。");
    }
  }, [lang]);

  const stopListening = useCallback(() => {
    try {
      recognitionRef.current?.stop();
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    return () => {
      try {
        recognitionRef.current?.abort();
      } catch {
        /* ignore */
      }
    };
  }, []);

  return {
    micState,
    micError,
    browserStt,
    startListening,
    stopListening,
    setMicError,
    setMicState,
  };
}
