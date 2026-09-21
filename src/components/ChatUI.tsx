"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Scenario } from "@/lib/scenarios";
import type { UiMessage } from "@/lib/types";
import { MessageBubble } from "./MessageBubble";
import { FeedbackPanel } from "./FeedbackPanel";

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
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, ended]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || streaming || ended) return;

    const userMsg: UiMessage = {
      id: uid(),
      role: "user",
      content: text,
      createdAt: Date.now(),
    };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setStreaming(true);

    const assistantId = uid();
    setMessages((prev) => [
      ...prev,
      { id: assistantId, role: "assistant", content: "", createdAt: Date.now() },
    ]);

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
      let acc = "";
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
    } finally {
      setStreaming(false);
      inputRef.current?.focus();
    }
  }, [input, streaming, ended, messages, scenario.id]);

  const endSession = useCallback(async () => {
    if (streaming || ended) return;
    setEnded(true);
    setFeedbackLoading(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenarioId: scenario.id,
          messages: messages.map((m) => ({
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
  }, [streaming, ended, scenario.id, messages]);

  const restart = () => {
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
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
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

  return (
    <div className="mx-auto flex h-full w-full max-w-2xl flex-1 flex-col">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur">
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
        {demoMode && (
          <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800">
            Demo
          </span>
        )}
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.map((m) => (
          <MessageBubble
            key={m.id}
            role={m.role}
            content={m.content || (streaming ? "…" : "")}
            partnerName={scenario.partnerName}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-slate-200 bg-white px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="mb-2 flex justify-end">
          <button
            type="button"
            onClick={() => void endSession()}
            disabled={streaming || messages.length < 2}
            className="text-xs font-medium text-slate-500 underline-offset-2 hover:text-teal-700 hover:underline disabled:opacity-40"
          >
            結束並取得回饋
          </button>
        </div>
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={streaming}
            placeholder="用英文回覆…（Enter 送出）"
            className="max-h-32 min-h-[44px] flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-[15px] text-slate-900 outline-none ring-teal-500 placeholder:text-slate-400 focus:bg-white focus:ring-2 disabled:opacity-60"
          />
          <button
            type="button"
            onClick={() => void send()}
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
