import { notFound } from "next/navigation";
import { getScenario, scenarios } from "@/lib/scenarios";
import { hasApiKey } from "@/lib/llm";
import { ChatUI } from "@/components/ChatUI";
import { SetupBanner } from "@/components/SetupBanner";

type Props = {
  params: Promise<{ scenarioId: string }>;
};

export default async function ChatPage({ params }: Props) {
  const { scenarioId } = await params;
  const scenario = getScenario(scenarioId);
  if (!scenario) notFound();

  const demoMode = !hasApiKey();

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <SetupBanner demoMode={demoMode} />
      <ChatUI scenario={scenario} demoMode={demoMode} />
    </div>
  );
}

export function generateStaticParams() {
  return scenarios.map((s) => ({ scenarioId: s.id }));
}
