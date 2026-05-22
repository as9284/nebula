"use client";

import { CloudSun } from "lucide-react";
import type { ActionResult } from "@/lib/constellation-registry";
import { WMO_CODES } from "@/lib/weather-types";
import type { WeatherForecastResponse, GeocodingResult } from "@/lib/weather-types";

export function WeatherCard({ result }: { result: ActionResult }) {
  if (result.type === "weather_error") {
    return (
      <div className="tool-card tool-card-error">
        <CloudSun size={14} />
        <span>
          Weather unavailable for &quot;{String(result.location)}&quot;:{" "}
          {String(result.error)}
        </span>
      </div>
    );
  }

  const data = result.data as WeatherForecastResponse;
  const loc = result.locationObj as GeocodingResult;
  const current = data?.current;
  if (!current) return null;

  const code = current.weather_code ?? 0;
  const name =
    loc.name + (loc.country ? `, ${loc.country}` : "");

  return (
    <div className="tool-card tool-card-weather">
      <CloudSun size={14} className="shrink-0 text-text-secondary" />
      <div className="flex flex-col gap-1 min-w-0">
        <span className="font-medium text-text-primary">{name}</span>
        <span className="text-text-secondary text-sm">
          {Math.round(current.temperature_2m)}° — {WMO_CODES[code] ?? "Unknown"} ·
          Feels {Math.round(current.apparent_temperature)}° · Wind{" "}
          {Math.round(current.wind_speed_10m)} km/h
        </span>
      </div>
    </div>
  );
}
