/**
 * useAuth – Hook to read Auth context. Must be used within AuthProvider.
 * Location: src/contexts/useAuth.ts
 */

import { useContext } from "react";
import { AuthContext } from "./authContextRef";
import type { AuthContextValue } from "./authContextRef";

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (ctx == null) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
