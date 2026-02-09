/**
 * Signup-Formular (E-Mail/Passwort) für Supabase Auth.
 * Ort: src/components/AuthSignupForm.tsx
 */

import { useState } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useAuth } from "../contexts/useAuth";
import styles from "./AuthForms.module.css";

interface AuthSignupFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

export function AuthSignupForm({ onSuccess, onSwitchToLogin }: AuthSignupFormProps) {
  const { signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);
    const { error: err } = await signUp(email, password);
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    setMessage("Konto erstellt. Bitte E-Mail bestätigen (falls aktiviert) oder direkt anmelden.");
    onSuccess?.();
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.field}>
        <Label htmlFor="auth-signup-email">E-Mail</Label>
        <Input
          id="auth-signup-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          disabled={loading}
        />
      </div>
      <div className={styles.field}>
        <Label htmlFor="auth-signup-password">Passwort</Label>
        <Input
          id="auth-signup-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="new-password"
          minLength={6}
          disabled={loading}
        />
      </div>
      {error && <p className={styles.error}>{error}</p>}
      {message && <p className={styles.message}>{message}</p>}
      <div className={styles.actions}>
        <Button type="submit" disabled={loading}>
          {loading ? "Wird erstellt…" : "Konto erstellen"}
        </Button>
        {onSwitchToLogin && (
          <Button type="button" variant="ghost" onClick={onSwitchToLogin}>
            Bereits Konto? Anmelden
          </Button>
        )}
      </div>
    </form>
  );
}
