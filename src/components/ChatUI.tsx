"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Scenario } from "@/lib/scenarios";
import type { UiMessage } from "@/lib/types";
import { MessageBubble } from "./MessageBubble";
import { FeedbackPanel } from "./FeedbackPanel";
import { MicButton } from "./MicButton";
import { GrammarTips } from "./GrammarTips";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { useVoiceOutput } from "@/hooks/useVoiceOutput";

type Props = {
  scenario: Scenario;
  demoMode: boolean;
};

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function ChatUI({ scenario, demoMode }: Props) {
  const router = useRouter();
  const [messages, setMessages] = useState<UiMessage[]>([
    {
      id: uid(),
      role: "assistant",
      content: scenario.openingLine,
      createdAt: Date.now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [ended, setEnded] = useState(false);
  const [feedback, setFeedback] = useState<string[]>([]);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [interimHint, setInterimHint] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesRef = useRef(messages);
  messagesRef.current = messages;
  const openingSpokenRef = useRef(false);

  const voiceOut = useVoiceOutput({ demoMode });
  const speakRef = useRef(voiceOut.speak);
  const stopRef = useRef(voiceOut.stop);
  const unlockRef = useRef(voiceOut.unlockAudio);
  speakRef.current = voiceOut.speak;
  stopRef.current = voiceOut.stop;
  unlockRef.current = voiceOut.unlockAudio;
  const streamingRef = useRef(streaming);
  const endedRef = useRef(ended);
  streamingRef.current = streaming;
  endedRef.current = ended;

  const sendText = useCallback(
    async (raw: string) => {
      const text = raw.trim();
      if (!text || streamingRef.current || endedRef.current) return;

      unlockRef.current();
      stopRef.current();

      const userMsgId = uid();
      const userMsg: UiMessage = {
        id: userMsgId,
        role: "user",
        content: text,
        createdAt: Date.now(),
        grammarLoading: true,
      };
      const nextMessages = [...messagesRef.current, userMsg];
      setMessages(nextMessages);
      setInput("");
      setStreaming(true);

      // Grammar tips in parallel (non-blocking)
      void (async () => {
        try {
          const gRes = await fetch("/api/grammar", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              text,
              scenarioId: scenario.id,
            }),
          });
          const gData = await gRes.json().catch(() => ({}));
          const tips = Array.isArray(gData.tips) ? gData.tips : [];
          setMessages((prev) =>
            prev.map((m) =>
              m.id === userMsgId
                ? { ...m, grammarTips: tips, grammarLoading: false }
                : m
            )
          );
        } catch {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === userMsgId ? { ...m, grammarLoading: false } : m
            )
          );
        }
      })();

      const assistantId = uid();
      setMessages((prev) => [
        ...prev,
        {
          id: assistantId,
          role: "assistant",
          content: "",
          createdAt: Date.now(),
        },
      ]);

      let acc = "";
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            scenarioId: scenario.id,
            messages: nextMessages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: "Request failed" }));
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? {
                    ...m,
                    content:
                      "抱歉，暫時無法回覆。請稍後再試。" +
                      (err.error ? ` (${err.error})` : ""),
                  }
                : m
            )
          );
          return;
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error("No body");
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          acc += decoder.decode(value, { stream: true });
          const snapshot = acc;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, content: snapshot } : m
            )
          );
        }
      } catch {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: "網路錯誤，請再試一次。" }
              : m
          )
        );
        acc = "";
      } finally {
        setStreaming(false);
        inputRef.current?.focus();
        if (acc) {
          void speakRef.current(acc);
        }
      }
    },
    [scenario.id]
  );

  const voiceIn = useVoiceInput({
    demoMode,
    onTranscript: (text) => {
      setInterimHint(null);
      setInput(text);
      void sendText(text);
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, ended]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Speak opening line once after user enables auto-play (and not muted)
  useEffect(() => {
    if (openingSpokenRef.current) return;
    if (!voiceOut.autoPlay || voiceOut.muted) return;
    // Wait for a user gesture path — speak on first mic/send unlock instead for iOS.
    // Still auto-speak opening on desktop after short delay if synthesis ready.
    const t = setTimeout(() => {
      if (openingSpokenRef.current) return;
      if (voiceOut.muted || !voiceOut.autoPlay) return;
      openingSpokenRef.current = true;
      void voiceOut.speak(scenario.openingLine);
    }, 600);
    return () => clearTimeout(t);
  }, [voiceOut, scenario.openingLine]);

  const send = () => void sendText(input);

  const endSession = useCallback(async () => {
    if (streamingRef.current || endedRef.current) return;
    stopRef.current();
    setEnded(true);
    setFeedbackLoading(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenarioId: scenario.id,
          messages: messagesRef.current.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });
      const data = await res.json();
      setFeedback(
        Array.isArray(data.tips) && data.tips.length
          ? data.tips
          : ["繼續多練習完整句子，對話會更自然。"]
      );
    } catch {
      setFeedback(["暫時無法取得回饋，請稍後再試。"]);
    } finally {
      setFeedbackLoading(false);
    }
  }, [scenario.id]);

  const restart = () => {
    voiceOut.stop();
    openingSpokenRef.current = false;
    setMessages([
      {
        id: uid(),
        role: "assistant",
        content: scenario.openingLine,
        createdAt: Date.now(),
      },
    ]);
    setEnded(false);
    setFeedback([]);
    setInput("");
    setTimeout(() => {
      inputRef.current?.focus();
      openingSpokenRef.current = true;
      void voiceOut.speak(scenario.openingLine);
    }, 50);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const onMicStart = () => {
    voiceOut.unlockAudio();
    voiceOut.stop();
    setInterimHint("正在聆聽英文…");
    voiceIn.startListening();
  };

  const onMicEnd = () => {
    setInterimHint(null);
    voiceIn.stopListening();
  };

  if (ended) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-8">
        <FeedbackPanel
          tips={feedback}
          loading={feedbackLoading}
          onRestart={restart}
          onHome={() => router.push("/")}
          partnerName={scenario.partnerName}
        />
      </div>
    );
  }

  const statusLine =
    voiceIn.micError ||
    interimHint ||
    (voiceIn.micState === "listening"
      ? "聆聽中…用英文說話，鬆開結束"
      : voiceIn.micState === "processing"
        ? "正在辨識語音…"
        : voiceOut.speaking
          ? "正在播放回覆…"
          : null);

  return (
    <div className="mx-auto flex h-full w-full max-w-2xl flex-1 flex-col">
      <header className="sticky top-0 z-10 flex items-center gap-2 border-b border-slate-200 bg-white/95 px-3 py-3 backdrop-blur sm:gap-3 sm:px-4">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="rounded-lg px-2 py-1 text-sm text-slate-600 hover:bg-slate-100"
          aria-label="返回"
        >
          ←
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-semibold text-slate-900">
            {scenario.icon} {scenario.title}
          </h1>
          <p className="truncate text-xs text-slate-500">
            與 {scenario.partnerName} 練習 · {scenario.descriptionZh}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => {
              voiceOut.unlockAudio();
              if (voiceOut.speaking) voiceOut.stop();
              voiceOut.setMuted(!voiceOut.muted);
            }}
            className={`rounded-lg px-2 py-1.5 text-xs font-medium transition ${
              voiceOut.muted
                ? "bg-slate-100 text-slate-600"
                : "bg-teal-50 text-teal-800"
            }`}
            title={voiceOut.muted ? "開啟語音" : "靜音"}
          >
            {voiceOut.muted ? "🔇 靜音" : "🔊 語音"}
          </button>
          <button
            type="button"
            onClick={() => {
              voiceOut.unlockAudio();
              voiceOut.setAutoPlay(!voiceOut.autoPlay);
            }}
            className={`hidden rounded-lg px-2 py-1.5 text-xs font-medium sm:inline-block ${
              voiceOut.autoPlay
                ? "text-teal-700"
                : "text-slate-500"
            }`}
            title="自動播放回覆"
          >
            {voiceOut.autoPlay ? "自動播放" : "手動播放"}
          </button>
          {demoMode && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800">
              Demo
            </span>
          )}
        </div>
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.map((m) => (
          <div key={m.id} className="space-y-1.5">
            <MessageBubble
              role={m.role}
              content={m.content || (streaming ? "…" : "")}
              partnerName={scenario.partnerName}
            />
            {m.role === "user" && (
              <GrammarTips tips={m.grammarTips} loading={m.grammarLoading} />
            )}
            {m.role === "assistant" && m.content && !streaming && (
              <div className="flex justify-start pl-1">
                <button
                  type="button"
                  onClick={() => {
                    voiceOut.unlockAudio();
                    void voiceOut.speak(m.content, { force: true });
                  }}
                  className="text-[11px] font-medium text-teal-700 hover:underline"
                >
                  播放語音
                </button>
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-slate-200 bg-white px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p
            className={`min-h-[1rem] flex-1 text-xs ${
              voiceIn.micError ? "text-rose-600" : "text-slate-500"
            }`}
          >
            {statusLine}
          </p>
          <button
            type="button"
            onClick={() => void endSession()}
            disabled={streaming || messages.length < 2}
            className="shrink-0 text-xs font-medium text-slate-500 underline-offset-2 hover:text-teal-700 hover:underline disabled:opacity-40"
          >
            結束並取得回饋
          </button>
        </div>
        <div className="flex items-end gap-2">
          <MicButton
            micState={voiceIn.micState}
            disabled={streaming || ended}
            onPressStart={onMicStart}
            onPressEnd={onMicEnd}
          />
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={streaming}
            placeholder="用英文回覆或按住麥克風…（Enter 送出）"
            className="max-h-32 min-h-[44px] flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-[15px] text-slate-900 outline-none ring-teal-500 placeholder:text-slate-400 focus:bg-white focus:ring-2 disabled:opacity-60"
          />
          <button
            type="button"
            onClick={send}
            disabled={streaming || !input.trim()}
            className="h-11 shrink-0 rounded-xl bg-teal-600 px-4 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:opacity-40"
          >
            送出
          </button>
        </div>
      </div>
    </div>
  );
}
