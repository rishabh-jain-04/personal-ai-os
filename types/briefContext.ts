import type { WeatherSnapshot } from "@/types/weather";

export type CalendarEventSummary = {
  title: string;
  start: string;
  displayTime: string;
};

export type ContextSectionStatus = "ok" | "empty" | "unavailable";

export type BriefContextPayload = {
  meta: {
    generatedAt: string;
    timezone: string;
  };
  schedule: {
    status: ContextSectionStatus;
    events: CalendarEventSummary[];
    error?: string;
  };
  weather: {
    status: ContextSectionStatus;
    snapshot?: WeatherSnapshot;
    error?: string;
  };
};

export type BriefContextWarnings = {
  calendarError?: string;
  weatherError?: string;
};
