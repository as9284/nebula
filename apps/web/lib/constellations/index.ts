import type { ConstellationHandler } from "../constellation-registry";
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
