import type { ConstellationHandler } from "../constellation-registry";
import { memoryHandler } from "./memory";
import { orbitHandler } from "./orbit";
import { solarisHandler } from "./solaris";
import { hyperlaneHandler } from "./hyperlane";
import { sandboxHandler } from "./sandbox";
import { exportHandler } from "./export";

export const constellationHandlers: readonly ConstellationHandler[] = [
  memoryHandler,
  orbitHandler,
  solarisHandler,
  hyperlaneHandler,
  sandboxHandler,
  exportHandler,
];
