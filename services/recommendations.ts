import type {
  BriefContextPayload,
  CalendarEventSummary,
} from "@/types/briefContext";
import type { RuleRecommendation } from "@/types/recommendation";

const RAIN_CHANCE_THRESHOLD = 50;
const DEEP_WORK_GAP_MINUTES = 90;
const ASSUMED_MEETING_MINUTES = 60;

function isGymEvent(title: string): boolean {
  return /\b(gym|workout|fitness|yoga|run|crossfit|training)\b/i.test(title);
}

function parseEventStart(event: CalendarEventSummary): Date | null {
  if (!event.start || /^\d{4}-\d{2}-\d{2}$/.test(event.start)) {
    return null;
  }
  const date = new Date(event.start);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatTimeRange(start: Date, end: Date): string {
  const fmt = (d: Date) =>
    d.toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  return `${fmt(start)}–${fmt(end)}`;
}

function findScheduleGaps(
  events: CalendarEventSummary[]
): Array<{ label: string; minutes: number }> {
  const timed = events
    .map((event) => ({ event, start: parseEventStart(event) }))
    .filter(
      (entry): entry is { event: CalendarEventSummary; start: Date } =>
        entry.start !== null
    )
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  const gaps: Array<{ label: string; minutes: number }> = [];
  const now = new Date();

  if (timed.length === 0) {
    return gaps;
  }

  const first = timed[0];
  const minutesUntilFirst = (first.start.getTime() - now.getTime()) / 60_000;
  if (minutesUntilFirst >= DEEP_WORK_GAP_MINUTES) {
    gaps.push({
      label: `Now until ${first.event.displayTime}`,
      minutes: Math.round(minutesUntilFirst),
    });
  }

  for (let i = 0; i < timed.length - 1; i++) {
    const currentEnd = new Date(
      timed[i].start.getTime() + ASSUMED_MEETING_MINUTES * 60_000
    );
    const nextStart = timed[i + 1].start;
    const freeMinutes = (nextStart.getTime() - currentEnd.getTime()) / 60_000;

    if (freeMinutes >= DEEP_WORK_GAP_MINUTES) {
      gaps.push({
        label: formatTimeRange(currentEnd, nextStart),
        minutes: Math.round(freeMinutes),
      });
    }
  }

  return gaps;
}

function weatherRules(context: BriefContextPayload): RuleRecommendation[] {
  const snapshot = context.weather.snapshot;
  if (context.weather.status !== "ok" || !snapshot) {
    return [];
  }

  const rules: RuleRecommendation[] = [];
  const rainy =
    (snapshot.rainProbabilityPercent ?? 0) >= RAIN_CHANCE_THRESHOLD ||
    /rain|drizzle|thunder|storm/i.test(
      `${snapshot.condition} ${snapshot.description}`
    );

  if (rainy) {
    const rainDetail =
      snapshot.rainProbabilityPercent !== null
        ? `${snapshot.rainProbabilityPercent}% rain chance`
        : "wet conditions";

    rules.push({
      id: "weather-rain-commute",
      message: `Pack an umbrella and leave 10–15 minutes earlier — ${rainDetail} in ${snapshot.location}.`,
    });
  }

  if (snapshot.temperatureC >= 35) {
    rules.push({
      id: "weather-heat-hydration",
      message: `Drink water regularly — it's around ${snapshot.temperatureC}°C in ${snapshot.location} today.`,
    });
  }

  if (snapshot.temperatureC <= 10) {
    rules.push({
      id: "weather-cold-layer",
      message: `Dress in layers — cool weather (${snapshot.temperatureC}°C) expected in ${snapshot.location}.`,
    });
  }

  return rules;
}

function scheduleRules(context: BriefContextPayload): RuleRecommendation[] {
  if (context.schedule.status === "unavailable") {
    return [];
  }

  const rules: RuleRecommendation[] = [];
  const { events } = context.schedule;

  if (context.schedule.status === "empty") {
    rules.push({
      id: "schedule-open-deep-work",
      message:
        "Block 90 minutes this morning for deep work on your highest-priority task.",
    });
    return rules;
  }

  const gaps = findScheduleGaps(events);
  if (gaps.length > 0) {
    const best = gaps.sort((a, b) => b.minutes - a.minutes)[0];
    rules.push({
      id: "schedule-gap-deep-work",
      message: `Use ${best.label} (${best.minutes} min free) for focused deep work.`,
    });
  }

  for (const event of events) {
    if (isGymEvent(event.title)) {
      rules.push({
        id: `schedule-gym-recovery-${event.start}`,
        message: `After ${event.title} (${event.displayTime}), hydrate and take a 10-minute cool-down before your next task.`,
      });
    }
  }

  return rules;
}

/** Deterministic recommendations from calendar + weather context */
export function generateRuleRecommendations(
  context: BriefContextPayload
): RuleRecommendation[] {
  const seen = new Set<string>();
  const results: RuleRecommendation[] = [];

  for (const rule of [...weatherRules(context), ...scheduleRules(context)]) {
    if (seen.has(rule.id)) continue;
    seen.add(rule.id);
    results.push(rule);
  }

  return results.slice(0, 5);
}

export function ruleRecommendationsToMessages(
  rules: RuleRecommendation[]
): string[] {
  return rules.map((rule) => rule.message);
}
