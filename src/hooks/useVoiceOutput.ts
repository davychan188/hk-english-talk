"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ensureVoicesLoaded,
  isSpeechSynthesisSupported,
  speakWithBrowser,
  stopBrowserSpeech,
  textForSpeech,
} from "@/lib/speech-client";

const MUTE_KEY = "hk-english-talk-voice-muted";
const AUTO_KEY = "hk-english-talk-voice-auto";

type Options = {
  demoMode: boolean;
};

export function useVoiceOutput({ demoMode }: Options) {
  const [muted, setMuted] = useState(false);
  const [autoPlay, setAutoPlay] = useState(true);
  const [speaking, setSpeaking] = useState(false);
  const [ready, setReady] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const unlockedRef = useRef(false);

  useEffect(() => {
    try {
      const m = localStorage.getItem(MUTE_KEY);
      const a = localStorage.getItem(AUTO_KEY);
      if (m !== null) setMuted(m === "1");
      if (a !== null) setAutoPlay(a === "1");
    } catch {
      /* ignore */
    }
    void ensureVoicesLoaded().then(() => setReady(true));
  }, []);

  const persistMuted = (v: boolean) => {
    setMuted(v);
    try {
      localStorage.setItem(MUTE_KEY, v ? "1" : "0");
    } catch {
      /* ignore */
    }
  };

  const persistAuto = (v: boolean) => {
    setAutoPlay(v);
    try {
      localStorage.setItem(AUTO_KEY, v ? "1" : "0");
    } catch {
      /* ignore */
    }
  };

  const stop = useCallback(() => {
    stopBrowserSpeech();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
      audioRef.current = null;
    }
    setSpeaking(false);
  }, []);

  /** Call from a user gesture to unlock iOS audio. */
  const unlockAudio = useCallback(() => {
    if (unlockedRef.current) return;
    unlockedRef.current = true;
    if (isSpeechSynthesisSupported()) {
      // Silent utterance unlocks speechSynthesis on some iOS versions
      const u = new SpeechSynthesisUtterance(" ");
      u.volume = 0;
      window.speechSynthesis.speak(u);
      window.speechSynthesis.cancel();
    }
  }, []);

  const speak = useCallback(
    async (raw: string, opts?: { force?: boolean }) => {
      const text = textForSpeech(raw);
      if (!text) return;
      if (muted && !opts?.force) return;
      if (!autoPlay && !opts?.force) return;

      stop();
      setSpeaking(true);

      // Prefer OpenAI TTS when API key present (server returns 503 in demo)
      if (!demoMode) {
        try {
          const res = await fetch("/api/speech", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text }),
          });
          if (res.ok) {
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const audio = new Audio(url);
            audioRef.current = audio;
            audio.onended = () => {
              URL.revokeObjectURL(url);
              setSpeaking(false);
            };
            audio.onerror = () => {
              URL.revokeObjectURL(url);
              setSpeaking(false);
            };
            await audio.play();
            return;
          }
          // fall through to browser TTS
        } catch {
          // fall through
        }
      }

      if (!isSpeechSynthesisSupported()) {
        setSpeaking(false);
        return;
      }
      speakWithBrowser(text, {
        onend: () => setSpeaking(false),
        onerror: () => setSpeaking(false),
      });
    },
    [muted, autoPlay, demoMode, stop]
  );

  useEffect(() => () => stop(), [stop]);

  return {
    muted,
    setMuted: persistMuted,
    autoPlay,
    setAutoPlay: persistAuto,
    speaking,
    speak,
    stop,
    unlockAudio,
    ready,
    browserTts: typeof window !== "undefined" && isSpeechSynthesisSupported(),
  };
}
