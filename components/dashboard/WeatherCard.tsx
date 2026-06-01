"use client";

import { useEffect, useState } from "react";
import type { WeatherSnapshot } from "@/types/weather";

type WeatherResponse = {
  weather?: WeatherSnapshot | null;
  error?: string;
};

async function parseJsonResponse(response: Response): Promise<WeatherResponse> {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text) as WeatherResponse;
  } catch {
    return {};
  }
}

function WeatherSkeleton() {
  return (
    <div className="space-y-3 animate-pulse" aria-hidden>
      <div className="h-8 w-20 rounded bg-zinc-800" />
      <div className="h-4 w-40 rounded bg-zinc-800/80" />
      <div className="h-3 w-28 rounded bg-zinc-800/60" />
    </div>
  );
}

export default function WeatherCard() {
  const [weather, setWeather] = useState<WeatherSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadWeather() {
      setWeather(null);
      setError(null);

      try {
        const response = await fetch("/api/weather");
        const data = await parseJsonResponse(response);

        if (cancelled) return;

        if (!response.ok || !data.weather) {
          setError(data.error ?? "Could not load weather");
          return;
        }

        setWeather(data.weather);
      } catch {
        if (!cancelled) {
          setError("Could not load weather");
        }
      }
    }

    loadWeather();

    return () => {
      cancelled = true;
    };
  }, [retryCount]);

  if (weather === null && !error) {
    return <WeatherSkeleton />;
  }

  if (error) {
    return (
      <div className="space-y-3">
        <p className="text-sm leading-relaxed text-gray-400">{error}</p>
        <button
          type="button"
          onClick={() => setRetryCount((n) => n + 1)}
          className="text-sm text-zinc-400 underline underline-offset-2 hover:text-white"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!weather) {
    return null;
  }

  return (
    <div className="space-y-3">
      <p className="text-3xl font-semibold tabular-nums text-white">
        {weather.temperatureC}°C
      </p>
      <p className="text-sm text-gray-300">
        {weather.description}
        <span className="text-zinc-500"> · {weather.location}</span>
      </p>
      {weather.rainProbabilityPercent !== null ? (
        <p className="text-sm text-gray-400">
          Rain chance (24h):{" "}
          <span className="text-gray-300">{weather.rainProbabilityPercent}%</span>
        </p>
      ) : null}
    </div>
  );
}
