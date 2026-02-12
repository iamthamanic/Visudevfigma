/**
 * Auth context and value type. Provider lives in AuthContext.tsx.
 * Location: src/contexts/authContextRef.ts
 */

import { createContext } from "react";
import type { Session, User } from "@jsr/supabase__supabase-js";

export interface AuthErrorLike {
  message: string;
}

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

export interface AuthActions {
  signInWithPassword: (email: string, password: string) => Promise<{ error: AuthErrorLike | null }>;
  signUp: (email: string, password: string) => Promise<{ error: AuthErrorLike | null }>;
  signOut: () => Promise<void>;
}

export type AuthContextValue = AuthState & AuthActions;

export const AuthContext = createContext<AuthContextValue | null>(null);
