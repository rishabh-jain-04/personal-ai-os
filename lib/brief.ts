export type DailyBrief = {
  greeting: string;
  overview: string;
  scheduleHighlights: string[];
  recommendations: string[];
};

export function stripMarkdownArtifacts(text: string): string {
  return text
    .replace(/\*\*/g, "")
    .replace(/__/g, "")
    .replace(/^#{1,6}\s+/gm, "")
    .trim();
}

export function parseDailyBrief(raw: string): DailyBrief {
  const cleaned = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    const parsed = JSON.parse(cleaned) as Partial<DailyBrief>;
    return normalizeBrief(parsed);
  } catch {
    return {
      greeting: "Good morning!",
      overview: stripMarkdownArtifacts(cleaned),
      scheduleHighlights: [],
      recommendations: [],
    };
  }
}

function normalizeBrief(parsed: Partial<DailyBrief>): DailyBrief {
  const toLines = (value: unknown): string[] => {
    if (!Array.isArray(value)) return [];
    return value
      .map((item) => stripMarkdownArtifacts(String(item)))
      .filter(Boolean)
      .slice(0, 5);
  };

  return {
    greeting: stripMarkdownArtifacts(
      String(parsed.greeting ?? "Here's your day at a glance.")
    ),
    overview: stripMarkdownArtifacts(
      String(parsed.overview ?? "Take it one step at a time today.")
    ),
    scheduleHighlights: toLines(parsed.scheduleHighlights),
    recommendations: toLines(parsed.recommendations).slice(0, 3),
  };
}
