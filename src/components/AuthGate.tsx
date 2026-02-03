/**
 * AuthGate: Zeigt die App nur nach Login. Sonst Login-/Signup-Ansicht.
 * Ort: src/components/AuthGate.tsx
 */

import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { AuthLoginForm } from "./AuthLoginForm";
import { AuthSignupForm } from "./AuthSignupForm";
import styles from "./AuthGate.module.css";

type Tab = "login" | "signup";

interface AuthGateProps {
  children: React.ReactNode;
}

export function AuthGate({ children }: AuthGateProps) {
  const { user, loading } = useAuth();
  const [tab, setTab] = useState<Tab>("login");

  if (loading) {
    return (
      <div className={styles.screen} aria-busy="true">
        <div className={styles.loading}>
          <span className={styles.loadingText}>Wird geladen…</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={styles.screen}>
        <div className={styles.card}>
          <div className={styles.header}>
            <h1 className={styles.title}>VisuDEV</h1>
            <p className={styles.subtitle}>Melde dich an, um fortzufahren.</p>
          </div>
          {tab === "login" ? (
            <AuthLoginForm onSwitchToSignup={() => setTab("signup")} />
          ) : (
            <AuthSignupForm onSwitchToLogin={() => setTab("login")} />
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
