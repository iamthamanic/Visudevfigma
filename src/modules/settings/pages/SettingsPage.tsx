import { useState } from "react";
import {
  CheckCircle,
  Database,
  Github,
  RefreshCw,
  Users,
  Webhook,
  XCircle,
  Zap,
} from "lucide-react";
import { Input } from "../../../components/ui/input";
import type { Project } from "../../../lib/visudev/types";
import { checkScreenshotsHealth } from "../../../lib/services/screenshots";
import styles from "../styles/SettingsPage.module.css";

interface SettingsPageProps {
  project: Project;
}

export function SettingsPage({ project }: SettingsPageProps) {
  const [isConnectingGitHub, setIsConnectingGitHub] = useState(false);
  const [isConnectingSupabase, setIsConnectingSupabase] = useState(false);

  const [githubConnected, setGitHubConnected] = useState(true);
  const [supabaseConnected, setSupabaseConnected] = useState(true);
  const [webhookStatus] = useState<"active" | "inactive" | "error">("active");
  const [pollingInterval, setPollingInterval] = useState(60);

  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "success" | "error">("idle");
  const [testResult, setTestResult] = useState<unknown | null>(null);

  const runScreenshotTest = async () => {
    setTestStatus("testing");
    setTestResult(null);

    try {
      const data = await checkScreenshotsHealth();
      setTestResult(data);
      setTestStatus("success");
    } catch (error) {
      setTestResult({ error: String(error) });
      setTestStatus("error");
    }
  };

  const handleGitHubConnect = async () => {
    setIsConnectingGitHub(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setGitHubConnected(true);
    setIsConnectingGitHub(false);
  };

  const handleSupabaseConnect = async () => {
    setIsConnectingSupabase(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setSupabaseConnected(true);
    setIsConnectingSupabase(false);
  };

  return (
    <div className={styles.root}>
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Project Settings</h2>
        <div className={styles.card}>
          <div className={styles.infoGrid}>
            <div>
              <div className={styles.infoLabel}>Project Name</div>
              <div>{project.name}</div>
            </div>
            <div>
              <div className={styles.infoLabel}>Project ID</div>
              <code className={styles.inlineCode}>{project.id}</code>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>
          <Github className={styles.inlineIcon} aria-hidden="true" />
          GitHub Integration
        </h3>

        <div className={styles.card}>
          <div className={styles.splitRow}>
            <div>
              <div className={styles.statusRow}>
                <span>Status</span>
                {githubConnected ? (
                  <CheckCircle className={styles.statusSuccess} aria-hidden="true" />
                ) : (
                  <XCircle className={styles.statusError} aria-hidden="true" />
                )}
              </div>
              {githubConnected && project.github_repo && (
                <div className={styles.statusText}>
                  Connected to <code className={styles.inlineCode}>{project.github_repo}</code>
                </div>
              )}
            </div>

            {!githubConnected && (
              <button
                type="button"
                onClick={handleGitHubConnect}
                disabled={isConnectingGitHub}
                className={styles.secondaryButton}
              >
                {isConnectingGitHub ? (
                  <>
                    <RefreshCw
                      className={`${styles.inlineIcon} ${styles.spinner}`}
                      aria-hidden="true"
                    />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Github className={styles.inlineIcon} aria-hidden="true" />
                    Connect GitHub
                  </>
                )}
              </button>
            )}
          </div>

          {githubConnected && project.github_repo && (
            <div className={styles.statusRow}>
              <span className={styles.caption}>Repository:</span>
              <code className={styles.inlineCode}>{project.github_repo}</code>
              <span className={styles.caption}>Branch:</span>
              <code className={styles.inlineCode}>{project.github_branch || "main"}</code>
            </div>
          )}
        </div>
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>
          <Database className={styles.inlineIcon} aria-hidden="true" />
          Supabase Integration
        </h3>

        <div className={styles.card}>
          <div className={styles.splitRow}>
            <div>
              <div className={styles.statusRow}>
                <span>Status</span>
                {supabaseConnected ? (
                  <CheckCircle className={styles.statusSuccess} aria-hidden="true" />
                ) : (
                  <XCircle className={styles.statusError} aria-hidden="true" />
                )}
              </div>
              {supabaseConnected && (
                <div className={styles.statusText}>Connected and syncing database metadata</div>
              )}
            </div>

            {!supabaseConnected && (
              <button
                type="button"
                onClick={handleSupabaseConnect}
                disabled={isConnectingSupabase}
                className={styles.secondaryButton}
              >
                {isConnectingSupabase ? (
                  <>
                    <RefreshCw
                      className={`${styles.inlineIcon} ${styles.spinner}`}
                      aria-hidden="true"
                    />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Database className={styles.inlineIcon} aria-hidden="true" />
                    Connect Supabase
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>
          <Webhook className={styles.inlineIcon} aria-hidden="true" />
          Webhooks & Sync
        </h3>

        <div className={styles.card}>
          <div className={styles.splitRow}>
            <div>
              <div className={styles.statusRow}>
                <span>Webhook Status</span>
                {webhookStatus === "active" && (
                  <CheckCircle className={styles.statusSuccess} aria-hidden="true" />
                )}
                {webhookStatus === "inactive" && (
                  <XCircle className={styles.statusText} aria-hidden="true" />
                )}
                {webhookStatus === "error" && (
                  <XCircle className={styles.statusError} aria-hidden="true" />
                )}
              </div>
              <div className={styles.statusText}>
                {webhookStatus === "active" && "Receiving real-time updates from GitHub"}
                {webhookStatus === "inactive" && "Webhooks not configured"}
                {webhookStatus === "error" && "Webhook delivery failed"}
              </div>
            </div>
          </div>

          <div className={styles.splitRow}>
            <label>
              <span className={styles.caption}>Polling Fallback Interval (seconds)</span>
            </label>
            <div className={styles.splitRow}>
              <Input
                type="number"
                min={30}
                max={3600}
                value={pollingInterval}
                onChange={(event) => {
                  const value = Number.parseInt(event.target.value, 10);
                  setPollingInterval(Number.isNaN(value) ? 30 : value);
                }}
                className={styles.shortInput}
              />
              <span className={styles.caption}>
                Fallback to polling every {pollingInterval}s when webhooks are unavailable
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>
          <Users className={styles.inlineIcon} aria-hidden="true" />
          Team & Access
        </h3>

        <div className={styles.card}>
          <p className={styles.caption}>
            Manage project members and their roles (owner, maintainer, viewer)
          </p>

          <div className={styles.memberRow}>
            <div>
              <div>current-user@example.com</div>
              <div className={styles.caption}>You</div>
            </div>
            <span className={styles.memberBadge}>Owner</span>
          </div>

          <button type="button" className={styles.secondaryButton}>
            Invite Team Member
          </button>
        </div>
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>
          <Zap className={styles.inlineIcon} aria-hidden="true" />
          Screenshot API Test
        </h3>

        <div className={styles.card}>
          <p className={styles.caption}>Test the visudev-screenshots Edge Function</p>

          <button
            type="button"
            onClick={runScreenshotTest}
            disabled={testStatus === "testing"}
            className={styles.primaryButton}
          >
            {testStatus === "testing" ? (
              <>
                <RefreshCw
                  className={`${styles.inlineIcon} ${styles.spinner}`}
                  aria-hidden="true"
                />
                Testing...
              </>
            ) : (
              <>
                <Zap className={styles.inlineIcon} aria-hidden="true" />
                Run Health Check
              </>
            )}
          </button>

          {testResult !== null && (
            <div
              className={`${styles.testResult} ${
                testStatus === "success" ? styles.testSuccess : styles.testError
              }`}
            >
              <div className={styles.resultHeader}>
                {testStatus === "success" ? (
                  <CheckCircle className={styles.statusSuccess} aria-hidden="true" />
                ) : (
                  <XCircle className={styles.statusError} aria-hidden="true" />
                )}
                <span className={styles.resultLabel}>
                  {testStatus === "success" ? "Success" : "Error"}
                </span>
              </div>
              <pre className={styles.resultBody}>{JSON.stringify(testResult, null, 2)}</pre>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
