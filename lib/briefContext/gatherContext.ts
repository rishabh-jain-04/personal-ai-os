import type {
  BriefContextPayload,
  BriefContextWarnings,
} from "@/types/briefContext";
import { loadCalendarContext } from "./calendarContext";
import { loadWeatherContext } from "./weatherContext";

export async function gatherBriefContext(
  accessToken: string
): Promise<{ context: BriefContextPayload; warnings: BriefContextWarnings }> {
  const [schedule, weather] = await Promise.all([
    loadCalendarContext(accessToken),
    loadWeatherContext(),
  ]);

  const context: BriefContextPayload = {
    meta: {
      generatedAt: new Date().toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    schedule,
    weather,
  };

  const warnings: BriefContextWarnings = {};

  if (schedule.error) {
    warnings.calendarError = schedule.error;
  }

  if (weather.error) {
    warnings.weatherError = weather.error;
  }

  return { context, warnings };
}
