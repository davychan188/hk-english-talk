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

/**
 * Browser en-GB TTS only (xAI has no TTS; OpenAI speech removed).
 */
export function useVoiceOutput({ demoMode: _demoMode }: Options) {
  const [muted, setMuted] = useState(false);
  const [autoPlay, setAutoPlay] = useState(true);
  const [speaking, setSpeaking] = useState(false);
  const [ready, setReady] = useState(false);
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
    setSpeaking(false);
  }, []);

  const unlockAudio = useCallback(() => {
    if (unlockedRef.current) return;
    unlockedRef.current = true;
    if (isSpeechSynthesisSupported()) {
      const u = new SpeechSynthesisUtterance(" ");
      u.volume = 0;
      u.lang = "en-GB";
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

      if (!isSpeechSynthesisSupported()) {
        setSpeaking(false);
        return;
      }
      speakWithBrowser(text, {
        onend: () => setSpeaking(false),
        onerror: () => setSpeaking(false),
      });
    },
    [muted, autoPlay, stop]
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
