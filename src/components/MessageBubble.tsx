type Props = {
  role: "user" | "assistant";
  content: string;
  partnerName?: string;
};

/** Split assistant content so 💡 tips render softer. */
function renderAssistant(content: string) {
  const parts = content.split(/(?=💡)/);
  return parts.map((part, i) => {
    if (part.startsWith("💡")) {
      return (
        <p
          key={i}
          className="mt-2 rounded-lg bg-teal-50 px-2.5 py-1.5 text-sm text-teal-900"
        >
          {part.trim()}
        </p>
      );
    }
    return (
      <p key={i} className="whitespace-pre-wrap leading-relaxed">
        {part}
      </p>
    );
  });
}

export function MessageBubble({ role, content, partnerName }: Props) {
  const isUser = role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-[15px] sm:max-w-[75%] ${
          isUser
            ? "rounded-br-md bg-teal-600 text-white"
            : "rounded-bl-md border border-slate-200 bg-white text-slate-800 shadow-sm"
        }`}
      >
        {!isUser && partnerName && (
          <p className="mb-1 text-xs font-semibold text-teal-700">
            {partnerName}
          </p>
        )}
        {isUser ? (
          <p className="whitespace-pre-wrap leading-relaxed">{content}</p>
        ) : (
          renderAssistant(content)
        )}
      </div>
    </div>
  );
}
