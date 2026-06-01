import { getWeatherSnapshot, OpenWeatherError } from "@/services/openWeather";

export async function GET() {
  try {
    const weather = await getWeatherSnapshot();
    return Response.json({ weather });
  } catch (error) {
    const status =
      error instanceof OpenWeatherError
        ? error.status >= 400 && error.status < 600
          ? error.status
          : 502
        : 502;

    const message =
      error instanceof Error ? error.message : "Failed to load weather";

    console.error("[api/weather]", message);

    return Response.json({ error: message, weather: null }, { status });
  }
}
