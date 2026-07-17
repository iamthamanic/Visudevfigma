/**
 * Gate for Diagnostics Access Control v2 columns during Wave 2 overlap.
 * Off by default so legacy RLS matrix stays stable until CI/local opt-in.
 */

export function isAccessControlV2Enabled(): boolean {
  return import.meta.env.VITE_ACCESS_CONTROL_V2 === "true";
}
