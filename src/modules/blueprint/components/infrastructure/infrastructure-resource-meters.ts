/**
 * Static placeholder meters shown until graph telemetry is available.
 */

import type { ResourceMeterValues } from "./InfrastructureResourceMeters.js";

export const STATIC_PLACEHOLDER_METERS: ResourceMeterValues = {
  cpu: 0,
  ram: 0,
  network: 0,
};
