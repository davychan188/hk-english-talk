import type { Scenario } from "./scenarios";

const mockReplies: Record<string, string[]> = {
  "coffee-shop": [
    "Nice choice! Would you like that for here or to go? And any milk preference — oat, soy, or regular?",
    "Coming right up. It's pretty busy this morning — do you work nearby?",
    "Ha, yeah Central is always buzzing. By the way, if you ever want something sweeter, our honey latte is popular.",
    "Sounds good! Anything else I can get you while you wait?",
  ],
  "job-interview": [
    "Thanks for sharing that. What would you say is a strength you bring to a team?",
    "That's helpful. Can you tell me about a time you had to handle a tight deadline?",
    "Interesting. Why are you interested in this role specifically?",
    "Great. Do you have any questions for me about the team or the company?",
  ],
  "mtr-directions": [
    "Sure! Take the Island Line toward Chai Wan — it's about three stops. Get off at Causeway Bay, Exit A.",
    "No worries. If you need the Star Ferry instead, hop on the Tsuen Wan Line to Central, then follow the signs to Pier 7.",
    "Yep, you're on the right track. The next train should be in about two minutes.",
    "Happy to help! Need anything else — like which exit for Times Square?",
  ],
  "new-colleagues": [
    "Glad to hear it! Lunch tip: there's a solid cha chaan teng downstairs if you want something quick.",
    "Ha, yeah the onboarding docs are a lot. Feel free to ping me anytime if something's confusing.",
    "We usually grab coffee around 3 if you want to join. No pressure though!",
    "Nice — you'll settle in fast. Want me to intro you to a few people on the team?",
  ],
  "dim-sum": [
    "Let's get har gow and cha siu bao for sure. You still like spring rolls?",
    "Same here — work's been hectic. At least we made it to yum cha this weekend!",
    "Haha true. Want to share a plate of cheung fun? The shrimp one's really good here.",
    "Perfect. Next round's on me if you pick the tea!",
  ],
};

export function getMockReply(
  scenarioId: string,
  userMessage: string,
  turnIndex: number
): string {
  const replies = mockReplies[scenarioId] ?? mockReplies["coffee-shop"];
  const base = replies[turnIndex % replies.length];

  const lower = userMessage.toLowerCase();
  let tip = "";
  if (lower.includes("i want") && !lower.includes("i'd like")) {
    tip =
      "\n\n💡 小提示：「I'd like…」比「I want…」更自然、更有禮貌。";
  } else if (lower.includes("how to go") || lower.includes("how go")) {
    tip =
      "\n\n💡 小提示：問路可說「How do I get to…?」或「Could you tell me the way to…?」。";
  } else if (turnIndex === 1) {
    tip =
      "\n\n💡 小提示：回覆時加一點細節（例如原因或感受），對話會更自然。";
  }

  return base + tip;
}

export function getMockFeedback(scenario: Scenario): string[] {
  return [
    `試多用完整句子回答，例如「I'd like a flat white, please」而不是單字。`,
    `可以用「Could you…?」或「Would you mind…?」讓請求聽起來更自然。`,
    `練習銜接語：如「Actually…」「By the way…」「That sounds great」讓對話更流暢。`,
    `在「${scenario.title}」情境中，記得回覆對方的問題，再主動加一句相關話題。`,
  ];
}

/** Simulate streaming by yielding characters with small delays. */
export async function* mockStreamText(
  text: string,
  delayMs = 12
): AsyncGenerator<string> {
  for (const ch of text) {
    yield ch;
    await new Promise((r) => setTimeout(r, delayMs));
  }
}
