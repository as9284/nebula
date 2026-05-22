"use client";

import { useSolarisStore } from "@/stores/use-solaris-store";
import { weatherApi } from "@/lib/weather";
import type {
  ConstellationHandler,
  ParsedCommand,
  ActionResult,
} from "../constellation-registry";
import { WeatherCard } from "@/components/cards/weather-card";

export const solarisHandler: ConstellationHandler = {
  tag: "solaris-commands",
  name: "Solaris",
  multiCommand: false,

  promptInstructions: `### Solaris — Weather
\`\`\`solaris-commands
GET_WEATHER {"location":"city name"}
\`\`\`
Use when the user asks for weather or forecast.`,

  buildContext(): string {
    const { selectedLocation } = useSolarisStore.getState();
    if (!selectedLocation) return "";
    const loc =
      selectedLocation.name +
      (selectedLocation.country ? `, ${selectedLocation.country}` : "");
    return `## Solaris — last location: ${loc}`;
  },

  async execute(commands: ParsedCommand[]): Promise<ActionResult[]> {
    const cmd = commands[0];
    if (!cmd?.args.location) return [];

    const locationQuery = String(cmd.args.location);
    try {
      const locations = await weatherApi.searchLocations(locationQuery);
      if (!locations.length) throw new Error("Location not found");
      const loc = locations[0];
      const data = await weatherApi.getForecast(loc.latitude, loc.longitude);
      useSolarisStore.getState().setSelectedLocation(loc);
      useSolarisStore.getState().addRecentLocation(loc);
      return [
        {
          type: "weather",
          handler: "solaris-commands",
          location: locationQuery,
          locationObj: loc,
          data,
        },
      ];
    } catch (e) {
      return [
        {
          type: "weather_error",
          handler: "solaris-commands",
          location: locationQuery,
          error: String(e),
        },
      ];
    }
  },

  ResultCard: WeatherCard,
};
