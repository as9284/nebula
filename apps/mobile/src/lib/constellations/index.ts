import type { ConstellationHandler } from "@nebula/core/constellation-registry";
import { orbitHandler } from "./orbit";
import { solarisHandler } from "./solaris";
import { hyperlaneHandler } from "./hyperlane";
import { sandboxHandler } from "./sandbox";

export const constellationHandlers: readonly ConstellationHandler[] = [
  orbitHandler,
  solarisHandler,
  hyperlaneHandler,
  sandboxHandler,
];
