import { getTodayCalendarEvents } from "@/services/googleCalendar";
import type { CalendarEventSummary, ContextSectionStatus } from "@/types/briefContext";

function formatEventTime(start?: string): string {
  if (!start) return "All day";
  if (/^\d{4}-\d{2}-\d{2}$/.test(start)) return "All day";

  return new Date(start).toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function summarizeEvents(
  items: Array<{
    summary?: string;
    start?: { dateTime?: string; date?: string };
  }>
): CalendarEventSummary[] {
  return items
    .filter((event) => event.summary)
    .map((event) => {
      const start = event.start?.dateTime ?? event.start?.date ?? "";
      return {
        title: event.summary ?? "Untitled",
        start,
        displayTime: formatEventTime(start),
      };
    });
}

export async function loadCalendarContext(accessToken: string): Promise<{
  status: ContextSectionStatus;
  events: CalendarEventSummary[];
  error?: string;
}> {
  try {
    const data = await getTodayCalendarEvents(accessToken);
    const events = summarizeEvents(data.items ?? []);

    return {
      status: events.length > 0 ? "ok" : "empty",
      events,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load calendar";

    console.error("[briefContext] calendar unavailable", message);

    return {
      status: "unavailable",
      events: [],
      error: message,
    };
  }
}
