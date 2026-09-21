import type { Scenario } from "./scenarios";

const mockReplies: Record<string, string[]> = {
  "coffee-shop": [
    "Certainly. Would you like that for here or to take away? And which milk would you prefer — oat, soya, or regular?",
    "Of course — coming right up. It's rather busy this morning. Do you work nearby?",
    "Yes, Central does keep one on one's toes. By the way, if you'd prefer something a little sweeter, our honey latte is quite popular.",
    "Very good. Is there anything else I can get for you while you wait?",
  ],
  "job-interview": [
    "Thank you for sharing that. What would you say is a particular strength you bring to a team?",
    "That's helpful. Could you tell me about a time you had to manage a tight deadline?",
    "Interesting. Why are you interested in this role in particular?",
    "Excellent. Do you have any questions for me about the team or the organisation?",
  ],
  "mtr-directions": [
    "Certainly. Take the Island Line towards Chai Wan — about three stops. Alight at Causeway Bay, Exit A.",
    "Not at all. If you need the Star Ferry instead, take the Tsuen Wan Line to Central, then follow the signs to Pier 7.",
    "Yes, you're on the right track. The next train should be along in about two minutes.",
    "Happy to help. Is there anything else — for example, which exit for Times Square?",
  ],
  "new-colleagues": [
    "I'm glad to hear it. For lunch, there's a reliable cha chaan teng downstairs if you'd like something quick.",
    "Quite — the onboarding materials are a fair amount to take in. Please do feel free to ask me if anything is unclear.",
    "We often take coffee around three if you'd care to join. No pressure at all, of course.",
    "Wonderful — I'm sure you'll settle in quickly. Would you like me to introduce you to a few people on the team?",
  ],
  "dim-sum": [
    "Let's order har gow and char siu bao, shall we? Do you still fancy spring rolls?",
    "Same here — work has been rather hectic. At least we've made it to yum cha this weekend.",
    "Quite right. Shall we share a plate of cheung fun? The prawn one is particularly good here.",
    "Perfect. The next round is on me if you choose the tea.",
  ],
  "football-chat": [
    "I tend to favour Liverpool myself, though United have been rather spirited lately. Who do you usually support?",
    "Quite — the atmosphere here on a Saturday evening is excellent. Shall we order a drink before kick-off?",
    "Yes, that fixture should be competitive. Do you prefer watching at home, or out at a sports bar like this?",
    "Agreed. If it ends in a draw, at least we'll have had a decent evening. Any predictions for the score?",
  ],
  "weekend-plans": [
    "I might take a gentle hike on Hong Kong Island if the weather holds. What about you?",
    "That sounds lovely. Brunch in Sai Ying Pun is rather pleasant at the weekend, if you fancy a recommendation.",
    "Quite understandable — a quiet Sunday can be just as restorative. Do you have any series you're watching?",
    "Wonderful. Perhaps we could compare notes on Monday — enjoy your weekend either way.",
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
      "\n\n💡 小提示：正式場合用「I'd like…」比「I want…」更有禮貌（英式慣用）。";
  } else if (lower.includes("how to go") || lower.includes("how go")) {
    tip =
      "\n\n💡 小提示：問路可說「How do I get to…?」或「Could you tell me the way to…?」。";
  } else if (/\bcolor\b|\bfavor\b|\borganize\b/i.test(userMessage)) {
    tip =
      "\n\n💡 小提示：英式拼法為 colour／favour／organise。";
  } else if (turnIndex === 1) {
    tip =
      "\n\n💡 小提示：回覆時加一點細節（例如原因或感受），對話會更自然。";
  }

  return base + tip;
}

export function getMockFeedback(scenario: Scenario): string[] {
  return [
    `試多用完整、禮貌的句子，例如「I'd like a flat white, please」而不是單字。`,
    `可以用「Could you…?」或「Would you mind…?」讓請求聽起來更正式、自然。`,
    `練習銜接語：如「Actually…」「By the way…」「That sounds lovely」讓對話更流暢。`,
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
