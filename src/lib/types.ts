export type UiMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
};

export type SessionPayload = {
  scenarioId: string;
  messages: UiMessage[];
  ended?: boolean;
  feedback?: string[];
};
