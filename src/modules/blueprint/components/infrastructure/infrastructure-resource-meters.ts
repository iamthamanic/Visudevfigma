/**
 * Static placeholder meters shown until graph telemetry is available.
 */

import type { ResourceMeterValues } from "./InfrastructureResourceMeters.js";

export const STATIC_PLACEHOLDER_METERS: ResourceMeterValues = {
  cpu: 42,
  ram: 68,
  networkIn: 31,
  networkOut: 24,
};
