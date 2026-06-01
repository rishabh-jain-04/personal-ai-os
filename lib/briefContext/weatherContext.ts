import { getWeatherSnapshot } from "@/services/openWeather";
import type { ContextSectionStatus } from "@/types/briefContext";
import type { WeatherSnapshot } from "@/types/weather";

export async function loadWeatherContext(): Promise<{
  status: ContextSectionStatus;
  snapshot?: WeatherSnapshot;
  error?: string;
}> {
  try {
    const snapshot = await getWeatherSnapshot();

    return {
      status: "ok",
      snapshot,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load weather";

    console.error("[briefContext] weather unavailable", message);

    return {
      status: "unavailable",
      error: message,
    };
  }
}

export function weatherSnapshotForPrompt(
  snapshot: WeatherSnapshot
): Record<string, unknown> {
  return {
    location: snapshot.location,
    temperatureC: snapshot.temperatureC,
    feelsLikeC: snapshot.feelsLikeC,
    condition: snapshot.condition,
    description: snapshot.description,
    humidity: snapshot.humidity,
    rainProbabilityPercent: snapshot.rainProbabilityPercent,
  };
}
