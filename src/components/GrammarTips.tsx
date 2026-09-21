"use client";

import type { GrammarTip, GrammarLevel } from "@/lib/grammar";

type Props = {
  tips?: GrammarTip[];
  loading?: boolean;
};

const levelStyle: Record<
  GrammarLevel,
  { badge: string; label: string; border: string }
> = {
  good: {
    badge: "bg-emerald-100 text-emerald-800",
    label: "講得自然",
    border: "border-emerald-200 bg-emerald-50/80",
  },
  minor: {
    badge: "bg-amber-100 text-amber-900",
    label: "小建議",
    border: "border-amber-200 bg-amber-50/80",
  },
  important: {
    badge: "bg-rose-100 text-rose-900",
    label: "要注意",
    border: "border-rose-200 bg-rose-50/80",
  },
};

export function GrammarTips({ tips, loading }: Props) {
  if (loading) {
    return (
      <div className="ml-auto w-full max-w-[85%] sm:max-w-[75%]">
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500 shadow-sm">
          <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
          分析句子中…
        </div>
      </div>
    );
  }

  if (!tips?.length) return null;

  return (
    <div className="ml-auto flex w-full max-w-[85%] flex-col gap-1.5 sm:max-w-[75%]">
      {tips.map((tip, i) => {
        const style = levelStyle[tip.level] ?? levelStyle.minor;
        const isPraise =
          tip.level === "good" ||
          tip.original.trim().toLowerCase() ===
            tip.suggestion.trim().toLowerCase();

        return (
          <div
            key={i}
            className={`rounded-xl border border-l-4 px-3 py-2.5 text-left shadow-sm ${style.border} ${
              tip.level === "important"
                ? "border-l-rose-400"
                : tip.level === "good"
                  ? "border-l-emerald-400"
                  : "border-l-amber-400"
            }`}
          >
            <div className="mb-1.5 flex items-center gap-2">
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${style.badge}`}
              >
                {style.label}
              </span>
              <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                文法建議
              </span>
            </div>

            {!isPraise && (
              <div className="space-y-1 text-[13px] leading-snug">
                <p className="text-slate-600">
                  <span className="mr-1.5 text-[10px] font-semibold text-slate-400">
                    你說
                  </span>
                  <span className="line-through decoration-rose-300/80">
                    {tip.original}
                  </span>
                </p>
                <p className="text-slate-900">
                  <span className="mr-1.5 text-[10px] font-semibold text-teal-600">
                    更自然
                  </span>
                  <span className="font-medium text-teal-900">
                    {tip.suggestion}
                  </span>
                </p>
              </div>
            )}

            <p
              className={`text-[12px] leading-relaxed text-slate-700 ${
                isPraise ? "" : "mt-1.5"
              }`}
            >
              {tip.reasonZh}
            </p>
          </div>
        );
      })}
    </div>
  );
}
