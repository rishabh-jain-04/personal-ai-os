/** Normalized weather snapshot for UI and AI brief prompts */
export type WeatherSnapshot = {
  location: string;
  temperatureC: number;
  feelsLikeC: number;
  condition: string;
  description: string;
  humidity: number;
  /** Max precipitation probability (0–100) for the next 24h, or null if unavailable */
  rainProbabilityPercent: number | null;
  fetchedAt: string;
};
