"use client";

import type { MicState } from "@/hooks/useVoiceInput";

type Props = {
  micState: MicState;
  disabled?: boolean;
  onPressStart: () => void;
  onPressEnd: () => void;
};

const labels: Record<MicState, string> = {
  idle: "按住說話",
  listening: "聆聽中…鬆開結束",
  processing: "辨識中…",
  unsupported: "不支援語音",
  error: "再按重試",
};

export function MicButton({
  micState,
  disabled,
  onPressStart,
  onPressEnd,
}: Props) {
  const listening = micState === "listening";
  const processing = micState === "processing";
  const blocked =
    disabled || micState === "unsupported" || micState === "processing";

  const handlePointerDown = (e: React.PointerEvent) => {
    if (blocked) return;
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    onPressStart();
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (micState === "listening") {
      e.preventDefault();
      onPressEnd();
    }
  };

  return (
    <button
      type="button"
      disabled={blocked}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onContextMenu={(e) => e.preventDefault()}
      aria-label={labels[micState]}
      title={labels[micState]}
      className={`flex h-11 w-11 shrink-0 select-none items-center justify-center rounded-xl text-lg transition touch-none disabled:opacity-40 ${
        listening
          ? "animate-pulse bg-rose-500 text-white shadow-md shadow-rose-200"
          : processing
            ? "bg-amber-100 text-amber-800"
            : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
      }`}
    >
      {processing ? (
        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
      ) : (
        <span aria-hidden>{listening ? "⏹" : "🎤"}</span>
      )}
    </button>
  );
}
