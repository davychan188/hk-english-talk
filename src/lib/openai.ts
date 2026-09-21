/** @deprecated Import from @/lib/llm — re-exports for compatibility. */
export {
  getGrokApiKey as getApiKey,
  hasApiKey,
  getProvider,
  DEFAULT_MODEL,
  streamChatCompletion,
  chatCompletion,
  sseToTextStream,
  openAiSseToTextStream,
  type ChatMessage,
  type Provider,
} from "./llm";
