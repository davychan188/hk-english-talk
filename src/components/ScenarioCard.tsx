import Link from "next/link";
import type { Scenario } from "@/lib/scenarios";

type Props = {
  scenario: Scenario;
};

export function ScenarioCard({ scenario }: Props) {
  return (
    <Link
      href={`/chat/${scenario.id}`}
      className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-300 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500"
    >
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-2xl transition group-hover:bg-teal-100">
        {scenario.icon}
      </div>
      <h2 className="text-lg font-semibold text-slate-900">{scenario.title}</h2>
      <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
        {scenario.descriptionZh}
      </p>
      <p className="mt-4 text-sm font-medium text-teal-700 group-hover:text-teal-800">
        開始練習 →
      </p>
    </Link>
  );
}
