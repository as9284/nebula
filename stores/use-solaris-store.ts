"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { GeocodingResult } from "@/lib/weather-types";
import { triggerCloudSync } from "@/lib/sync-trigger";

interface SolarisState {
  selectedLocation: GeocodingResult | null;
  recentLocations: GeocodingResult[];
  setSelectedLocation: (loc: GeocodingResult | null) => void;
  addRecentLocation: (loc: GeocodingResult) => void;
  hydrate: (data: {
    selectedLocation: GeocodingResult | null;
    recentLocations: GeocodingResult[];
  }) => void;
}

export const useSolarisStore = create<SolarisState>()(
  persist(
    (set) => ({
      selectedLocation: null,
      recentLocations: [],
      setSelectedLocation: (selectedLocation) => {
        set({ selectedLocation });
        triggerCloudSync();
      },
      addRecentLocation: (loc) => {
        set((s) => ({
          recentLocations: [
            loc,
            ...s.recentLocations.filter((r) => r.name !== loc.name),
          ].slice(0, 8),
        }));
        triggerCloudSync();
      },
      hydrate: (data) => {
        set({
          selectedLocation: data.selectedLocation,
          recentLocations: data.recentLocations,
        });
        triggerCloudSync();
      },
    }),
    { name: "nebula-solaris", storage: createJSONStorage(() => localStorage) },
  ),
);
