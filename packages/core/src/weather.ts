import type { GeocodingResult, WeatherForecastResponse } from "./weather-types";

const BASE_URL = "https://api.open-meteo.com/v1";

export const weatherApi = {
  async getForecast(
    latitude: number,
    longitude: number,
    timezone = "auto",
  ): Promise<WeatherForecastResponse> {
    const params = new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      timezone,
      current: [
        "temperature_2m",
        "relative_humidity_2m",
        "apparent_temperature",
        "weather_code",
        "wind_speed_10m",
        "precipitation",
      ].join(","),
      daily: [
        "weather_code",
        "temperature_2m_max",
        "temperature_2m_min",
        "precipitation_sum",
      ].join(","),
      forecast_days: "7",
    });

    const response = await fetch(`${BASE_URL}/forecast?${params}`);
    if (!response.ok) throw new Error(`Weather API error: ${response.status}`);
    return response.json() as Promise<WeatherForecastResponse>;
  },

  async searchLocations(query: string): Promise<GeocodingResult[]> {
    if (!query || query.length < 2) return [];
    const params = new URLSearchParams({
      name: query,
      count: "10",
      language: "en",
      format: "json",
    });
    const response = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?${params}`,
    );
    if (!response.ok) return [];
    const data = (await response.json()) as { results?: GeocodingResult[] };
    return data.results ?? [];
  },
};
