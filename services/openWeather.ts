import type { WeatherSnapshot } from "@/types/weather";

const BASE = "https://api.openweathermap.org/data/2.5";

export class OpenWeatherError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "OpenWeatherError";
    this.status = status;
  }
}

type CurrentWeatherResponse = {
  name: string;
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
  };
  weather: Array<{
    main: string;
    description: string;
  }>;
};

type ForecastResponse = {
  city: { name: string };
  list: Array<{
    dt: number;
    pop?: number;
  }>;
};

function getApiKey(): string {
  const key = process.env.OPENWEATHER_API_KEY;
  if (!key) {
    throw new OpenWeatherError(
      500,
      "OPENWEATHER_API_KEY is not configured in .env.local"
    );
  }
  return key;
}

function getLocationSearchParams(): URLSearchParams {
  const params = new URLSearchParams({
    appid: getApiKey(),
    units: "metric",
  });

  const lat = process.env.OPENWEATHER_LAT;
  const lon = process.env.OPENWEATHER_LON;

  if (lat && lon) {
    params.set("lat", lat);
    params.set("lon", lon);
    return params;
  }

  const city = process.env.OPENWEATHER_CITY;
  if (!city) {
    throw new OpenWeatherError(
      500,
      "Set OPENWEATHER_CITY or OPENWEATHER_LAT and OPENWEATHER_LON in .env.local"
    );
  }

  params.set("q", city);
  return params;
}

function capitalizeDescription(text: string): string {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function maxRainProbabilityNext24h(forecast: ForecastResponse): number | null {
  const now = Math.floor(Date.now() / 1000);
  const horizon = now + 24 * 60 * 60;

  const pops = forecast.list
    .filter((entry) => entry.dt >= now && entry.dt <= horizon)
    .map((entry) => entry.pop)
    .filter((pop): pop is number => typeof pop === "number");

  if (pops.length === 0) return null;

  return Math.round(Math.max(...pops) * 100);
}

async function fetchOpenWeather<T>(path: string): Promise<T> {
  const params = getLocationSearchParams();
  const url = `${BASE}${path}?${params.toString()}`;

  const response = await fetch(url, { next: { revalidate: 600 } });
  const body = await response.text();

  if (!response.ok) {
    let message = `OpenWeather API error (${response.status})`;
    try {
      const parsed = JSON.parse(body) as { message?: string };
      if (parsed.message) message = parsed.message;
    } catch {
      if (body) message = body.slice(0, 200);
    }

    console.error("[OpenWeather API] request failed", {
      path,
      status: response.status,
      message,
    });

    throw new OpenWeatherError(response.status, message);
  }

  console.info("[OpenWeather API] success", { path, status: response.status });

  try {
    return JSON.parse(body) as T;
  } catch {
    throw new OpenWeatherError(502, "OpenWeather API returned invalid JSON");
  }
}

export async function getWeatherSnapshot(): Promise<WeatherSnapshot> {
  const [current, forecast] = await Promise.all([
    fetchOpenWeather<CurrentWeatherResponse>("/weather"),
    fetchOpenWeather<ForecastResponse>("/forecast"),
  ]);

  const weather = current.weather[0];

  return {
    location: current.name || forecast.city.name,
    temperatureC: Math.round(current.main.temp),
    feelsLikeC: Math.round(current.main.feels_like),
    condition: weather?.main ?? "Unknown",
    description: capitalizeDescription(weather?.description ?? ""),
    humidity: current.main.humidity,
    rainProbabilityPercent: maxRainProbabilityNext24h(forecast),
    fetchedAt: new Date().toISOString(),
  };
}
