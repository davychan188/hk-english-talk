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
 * Prefer Web Speech API. If unsupported and API key mode, fall back to
 * MediaRecorder → /api/transcribe (Whisper).
 */
export function useVoiceInput({ demoMode, onTranscript, lang = "en-US" }: Options) {
  const [micState, setMicState] = useState<MicState>("idle");
  const [micError, setMicError] = useState<string | null>(null);
  const [browserStt, setBrowserStt] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const usingWhisperRef = useRef(false);
  const demoModeRef = useRef(demoMode);
  demoModeRef.current = demoMode;
  const onTranscriptRef = useRef(onTranscript);
  onTranscriptRef.current = onTranscript;

  useEffect(() => {
    setBrowserStt(isSpeechRecognitionSupported());
  }, []);

  const cleanupStream = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  const startWhisperRecording = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setMicState("unsupported");
      setMicError("此瀏覽器不支援錄音。請改用文字輸入。");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const mime = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : MediaRecorder.isTypeSupported("audio/mp4")
          ? "audio/mp4"
          : "";
      const recorder = mime
        ? new MediaRecorder(stream, { mimeType: mime })
        : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      usingWhisperRef.current = true;
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        setMicState("processing");
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        cleanupStream();
        if (blob.size < 100) {
          setMicState("error");
          setMicError("錄音太短，請再試一次。");
          return;
        }
        if (demoModeRef.current) {
          setMicState("error");
          setMicError(
            "此瀏覽器無內建語音辨識；Whisper 備援需要 OPENAI_API_KEY。"
          );
          return;
        }
        try {
          const form = new FormData();
          const ext = blob.type.includes("mp4") ? "mp4" : "webm";
          form.append("file", blob, `recording.${ext}`);
          const res = await fetch("/api/transcribe", {
            method: "POST",
            body: form,
          });
          const data = await res.json();
          if (!res.ok) {
            setMicState("error");
            setMicError(data.error || "語音轉文字失敗");
            return;
          }
          const text = (data.text as string)?.trim();
          setMicState("idle");
          setMicError(null);
          if (text) onTranscriptRef.current(text);
          else {
            setMicState("error");
            setMicError("未能辨識內容，請再說一次。");
          }
        } catch {
          setMicState("error");
          setMicError("上傳錄音失敗，請檢查網路。");
        }
      };
      recorder.start();
      setMicState("listening");
      setMicError(null);
    } catch {
      setMicState("error");
      setMicError("無法使用麥克風。請允許權限後再試。");
    }
  }, []);

  const startListening = useCallback(() => {
    setMicError(null);
    const Ctor = getSpeechRecognitionCtor();
    if (Ctor) {
      usingWhisperRef.current = false;
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
        if (!demoModeRef.current) {
          void startWhisperRecording();
          return;
        }
        setMicState("error");
        setMicError(`語音辨識錯誤：${event.error}`);
      };
      rec.onend = () => {
        const text = finalText.trim();
        setMicState("idle");
        if (text) onTranscriptRef.current(text);
      };
      try {
        rec.start();
      } catch {
        void startWhisperRecording();
      }
      return;
    }
    void startWhisperRecording();
  }, [lang, startWhisperRecording]);

  const stopListening = useCallback(() => {
    if (usingWhisperRef.current && mediaRecorderRef.current) {
      if (mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      return;
    }
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
      cleanupStream();
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
