import { jsonrepair } from "jsonrepair";

/** Parse JSON, attempting jsonrepair on failure (common with smaller local models). */
export function parseJsonLenient(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return JSON.parse(jsonrepair(text)) as unknown;
  }
}
