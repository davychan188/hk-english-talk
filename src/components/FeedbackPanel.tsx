type Props = {
  tips: string[];
  loading: boolean;
  onRestart: () => void;
  onHome: () => void;
  partnerName: string;
};

export function FeedbackPanel({
  tips,
  loading,
  onRestart,
  onHome,
  partnerName,
}: Props) {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">練習回饋</h2>
        <p className="mt-1 text-sm text-slate-600">
          根據你與 {partnerName} 的對話，以下是具體可改進的地方（無分數）。
        </p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-6 text-sm text-slate-500">
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
          正在整理建議…
        </div>
      ) : (
        <ul className="space-y-3">
          {tips.map((tip, i) => (
            <li
              key={i}
              className="flex gap-3 rounded-xl bg-slate-50 px-3.5 py-3 text-sm leading-relaxed text-slate-800"
            >
              <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-100 text-xs font-bold text-teal-800">
                {i + 1}
              </span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          onClick={onRestart}
          className="flex-1 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700"
        >
          再練一次
        </button>
        <button
          type="button"
          onClick={onHome}
          className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          返回場景
        </button>
      </div>
    </div>
  );
}
