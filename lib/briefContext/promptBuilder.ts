import type { BriefContextPayload } from "@/types/briefContext";
import { weatherSnapshotForPrompt } from "./weatherContext";

function buildContextDocument(context: BriefContextPayload): object {
  const scheduleEvents = context.schedule.events.map((event) => ({
    title: event.title,
    start: event.start,
    displayTime: event.displayTime,
  }));

  const weatherBlock =
    context.weather.status === "ok" && context.weather.snapshot
      ? weatherSnapshotForPrompt(context.weather.snapshot)
      : null;

  return {
    meta: context.meta,
    schedule: {
      status: context.schedule.status,
      eventCount: scheduleEvents.length,
      events: scheduleEvents,
    },
    weather: {
      status: context.weather.status,
      current: weatherBlock,
    },
  };
}

export function buildDailyBriefPrompt(context: BriefContextPayload): string {
  const contextJson = JSON.stringify(buildContextDocument(context), null, 2);

  return `You are a warm, helpful personal productivity assistant writing a morning daily brief.

=== USER CONTEXT (structured data — use all sections that are available) ===
${contextJson}

=== INTERPRETATION NOTES ===
- schedule.status "ok": use events for scheduleHighlights and timing-aware advice
- schedule.status "empty": no calendar events today — note a lighter day in overview
- schedule.status "unavailable": calendar not loaded — do not invent meetings
- weather.status "ok": factor temperature, conditions, and rainProbabilityPercent into overview and recommendations
- weather.status "unavailable": do not invent weather details

=== TASK ===
Using only the context above, write a concise, friendly daily brief.
- Mention weather naturally when weather.status is "ok" (dressing, umbrella, heat, etc.)
- Tie recommendations to real events when possible
- Keep recommendations actionable and start each with a verb
- Do not repeat commute, umbrella, hydration, or deep-work timing tips (those are shown separately as smart tips)

=== OUTPUT FORMAT ===
Return ONLY valid JSON (no markdown, no code fences) with this exact shape:
{
  "greeting": "One friendly opening line (include time-of-day if natural)",
  "overview": "2 short sentences summarizing the day tone and focus",
  "scheduleHighlights": ["bullet strings for notable meetings or timing — empty array if no events"],
  "recommendations": ["2-3 specific actionable tips starting with a verb"]
}

=== RULES ===
- Plain text only inside JSON strings (no **, no *, no # headings)
- Keep total content under 150 words
- Be encouraging but practical`;
}
