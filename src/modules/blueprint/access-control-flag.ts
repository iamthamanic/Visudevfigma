/**
 * Feature flag helper for Access Control Diagnostics v2 matrix columns.
 */

export function isAccessControlV2Enabled(): boolean {
  return import.meta.env.VITE_ACCESS_CONTROL_V2 === "true";
}
