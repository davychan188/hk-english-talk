import type { GrammarTip } from "./grammar";

export type UiMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
  /** Speak-style grammar tips (user messages only). */
  grammarTips?: GrammarTip[];
  grammarLoading?: boolean;
};

export type SessionPayload = {
  scenarioId: string;
  messages: UiMessage[];
  ended?: boolean;
  feedback?: string[];
};
