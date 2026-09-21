import { scenarios } from "@/lib/scenarios";
import { ScenarioCard } from "@/components/ScenarioCard";
import { SetupBanner } from "@/components/SetupBanner";
import { hasApiKey } from "@/lib/openai";

export default function HomePage() {
  const demoMode = !hasApiKey();

  return (
    <>
      <SetupBanner demoMode={demoMode} />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:py-12">
        <header className="mb-8 sm:mb-10">
          <p className="text-sm font-medium text-teal-700">HK English Talk</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            香港英語對話練習
          </h1>
          <p className="mt-3 max-w-xl text-base leading-relaxed text-slate-600">
            選擇一個生活情境，用英文與暖心夥伴練習。介面為繁體中文；對話請用英文。
            結束後會得到具體文法／用字建議——沒有假分數。
          </p>
        </header>

        <section aria-label="練習場景">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
            選擇場景 / Scenarios
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {scenarios.map((s) => (
              <ScenarioCard key={s.id} scenario={s} />
            ))}
          </div>
        </section>

        <footer className="mt-12 border-t border-slate-200 pt-6 text-center text-xs text-slate-400">
          MVP · 文字 + 語音對話練習
        </footer>
      </main>
    </>
  );
}
