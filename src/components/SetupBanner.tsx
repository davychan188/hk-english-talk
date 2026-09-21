"use client";

type Props = {
  demoMode: boolean;
};

export function SetupBanner({ demoMode }: Props) {
  if (!demoMode) return null;

  return (
    <div className="w-full border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
      <p className="mx-auto max-w-3xl leading-relaxed">
        <span className="font-semibold">示範模式／Demo mode：</span>
        尚未設定{" "}
        <code className="rounded bg-amber-100 px-1.5 py-0.5 text-xs">
          XAI_API_KEY
        </code>{" "}
        （或{" "}
        <code className="rounded bg-amber-100 px-1.5 py-0.5 text-xs">
          GROK_API_KEY
        </code>
        ）。介面可完整預覽；對話與文法建議為模擬回覆。於專案根目錄建立{" "}
        <code className="rounded bg-amber-100 px-1.5 py-0.5 text-xs">
          .env.local
        </code>{" "}
        並加入 xAI 金鑰後重啟即可使用 Grok 串流對話。語音輸入／播放使用瀏覽器英式英語（en-GB），無需金鑰。
      </p>
    </div>
  );
}
