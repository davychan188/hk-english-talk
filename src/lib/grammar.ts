export type GrammarLevel = "good" | "minor" | "important";

export type GrammarTip = {
  original: string;
  suggestion: string;
  reasonZh: string;
  level: GrammarLevel;
};

/** Heuristic mock tips for demo mode (no API key). */
export function getMockGrammarTips(text: string): GrammarTip[] {
  const trimmed = text.trim();
  if (!trimmed) return [];

  const tips: GrammarTip[] = [];
  const lower = trimmed.toLowerCase();

  // Past time + present tense verb
  if (
    /\b(yesterday|last\s+(week|night|month|year)|ago)\b/i.test(trimmed) &&
    /\b(i|he|she|we|they)\s+go\b/i.test(trimmed)
  ) {
    const suggestion = trimmed.replace(/\bgo\b/i, (m) =>
      m[0] === "G" ? "Went" : "went"
    );
    tips.push({
      original: trimmed.match(/\b(i|he|she|we|they)\s+go\b/i)?.[0] ?? "go",
      suggestion: suggestion.match(/\b(i|he|she|we|they)\s+went\b/i)?.[0] ?? "went",
      reasonZh: "有 yesterday／last… 等過去時間時，動詞要用過去式（went）。",
      level: "important",
    });
  }

  // I want → I'd like (politeness)
  if (/\bi\s+want\b/i.test(trimmed) && !/\bi('d| would)\s+like\b/i.test(trimmed)) {
    tips.push({
      original: trimmed.match(/\bi\s+want\b/i)?.[0] ?? "I want",
      suggestion: "I'd like",
      reasonZh: "點餐或請求時，「I'd like…」比「I want…」更自然、更有禮貌。",
      level: "minor",
    });
  }

  // how to go / how go → How do I get to
  if (/\bhow\s+to\s+go\b/i.test(trimmed) || /\bhow\s+go\b/i.test(trimmed)) {
    tips.push({
      original: trimmed.match(/\bhow\s+(to\s+)?go\b/i)?.[0] ?? "how to go",
      suggestion: "How do I get to…?",
      reasonZh: "問路時用「How do I get to…?」更像母語者日常說法。",
      level: "important",
    });
  }

  // Missing article before singular countable (very rough)
  if (
    /\b(i\s+(want|need|have|buy|get|order))\s+[a-z]+ing\b/i.test(lower) ===
      false &&
    /\b(i\s+(want|need|have|buy|get|order))\s+(flat\s+white|latte|coffee|tea|job|interview)\b/i.test(
      lower
    )
  ) {
    const m = trimmed.match(
      /\b(i\s+(?:want|need|have|buy|get|order))\s+(flat\s+white|latte|coffee|tea|job|interview)\b/i
    );
    if (m) {
      tips.push({
        original: `${m[1]} ${m[3]}`,
        suggestion: `${m[1]} a ${m[3]}`,
        reasonZh: "可數名詞單數前通常要加 a／an（例如 a latte、a job）。",
        level: "minor",
      });
    }
  }

  // can you explain me → explain to me
  if (/\bexplain\s+me\b/i.test(trimmed)) {
    tips.push({
      original: trimmed.match(/\bexplain\s+me\b/i)?.[0] ?? "explain me",
      suggestion: "explain to me / explain it to me",
      reasonZh: "英語要說 explain something to someone，不能直接 explain me。",
      level: "important",
    });
  }

  // very like → really like / like … a lot
  if (/\bvery\s+like\b/i.test(trimmed)) {
    tips.push({
      original: trimmed.match(/\bvery\s+like\b/i)?.[0] ?? "very like",
      suggestion: "really like / like … a lot",
      reasonZh: "「very」一般不直接修飾動詞 like；可說 really like 或 like it a lot。",
      level: "minor",
    });
  }

  // I am agree → I agree
  if (/\bi\s+am\s+agree\b/i.test(trimmed) || /\bi'?m\s+agree\b/i.test(trimmed)) {
    tips.push({
      original: trimmed.match(/\bi(?:\s+am|'m)\s+agree\b/i)?.[0] ?? "I am agree",
      suggestion: "I agree",
      reasonZh: "agree 是動詞，直接說 I agree，不用 am。",
      level: "important",
    });
  }

  // discuss about → discuss
  if (/\bdiscuss\s+about\b/i.test(trimmed)) {
    tips.push({
      original: trimmed.match(/\bdiscuss\s+about\b/i)?.[0] ?? "discuss about",
      suggestion: "discuss",
      reasonZh: "discuss 後面直接加主題，不需要 about（talk about 才要）。",
      level: "minor",
    });
  }

  if (tips.length === 0) {
    // Short natural-looking utterance → praise
    const wordCount = trimmed.split(/\s+/).length;
    if (wordCount >= 3 && !/[，。？！、]/.test(trimmed)) {
      return [
        {
          original: trimmed,
          suggestion: trimmed,
          reasonZh: "講得自然！句子清楚，繼續保持這個感覺。",
          level: "good",
        },
      ];
    }
    return [
      {
        original: trimmed,
        suggestion: trimmed,
        reasonZh: "講得不錯。試多用完整句子，對話會更流暢。",
        level: "good",
      },
    ];
  }

  return tips.slice(0, 3);
}
