/**
 * Integrations Panel Component
 * Example usage of VisuDEV Edge Functions API
 */

import { useState } from "react";
import clsx from "clsx";
import type { GitHubRepo } from "../lib/visudev/integrations";
import { useIntegrations } from "../utils/useVisuDev";
import { api } from "../utils/api";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";
import { toast } from "sonner";
import { Github, Database, Loader2, CheckCircle, XCircle } from "lucide-react";
import styles from "./IntegrationsPanel.module.css";

interface IntegrationsPanelProps {
  projectId: string | null;
}

export function IntegrationsPanel({ projectId }: IntegrationsPanelProps) {
  const {
    integrations,
    loading,
    connectGitHub,
    disconnectGitHub,
    connectSupabase,
    disconnectSupabase,
  } = useIntegrations(projectId);

  const [githubToken, setGithubToken] = useState("");
  const [githubUsername, setGithubUsername] = useState("");
  const [supabaseUrl, setSupabaseUrl] = useState("");
  const [supabaseAnonKey, setSupabaseAnonKey] = useState("");
  const [supabaseServiceKey, setSupabaseServiceKey] = useState("");
  const [supabaseProjectRef, setSupabaseProjectRef] = useState("");

  const [testingGithub, setTestingGithub] = useState(false);
  const [githubRepos, setGithubRepos] = useState<GitHubRepo[]>([]);

  const handleConnectGitHub = async () => {
    if (!githubToken) {
      toast.error("GitHub Token erforderlich");
      return;
    }

    const result = await connectGitHub(githubToken, githubUsername);
    if (result.success) {
      toast.success("GitHub erfolgreich verbunden");
      setGithubToken("");
      setGithubUsername("");
    } else {
      toast.error(result.error || "GitHub-Verbindung fehlgeschlagen");
    }
  };

  const handleDisconnectGitHub = async () => {
    const result = await disconnectGitHub();
    if (result.success) {
      toast.success("GitHub getrennt");
    } else {
      toast.error(result.error || "Fehler beim Trennen");
    }
  };

  const handleTestGitHub = async () => {
    if (!projectId) return;

    setTestingGithub(true);
    const result = await api.integrations.github.getRepos(projectId);
    if (result.success) {
      setGithubRepos(result.data || []);
      toast.success(`${result.data?.length || 0} Repositories gefunden`);
    } else {
      toast.error(result.error || "GitHub-Test fehlgeschlagen");
    }
    setTestingGithub(false);
  };

  const handleConnectSupabase = async () => {
    if (!supabaseUrl || !supabaseAnonKey) {
      toast.error("URL und Anon Key erforderlich");
      return;
    }

    const result = await connectSupabase(
      supabaseUrl,
      supabaseAnonKey,
      supabaseServiceKey,
      supabaseProjectRef,
    );
    if (result.success) {
      toast.success("Supabase erfolgreich verbunden");
      setSupabaseUrl("");
      setSupabaseAnonKey("");
      setSupabaseServiceKey("");
      setSupabaseProjectRef("");
    } else {
      toast.error(result.error || "Supabase-Verbindung fehlgeschlagen");
    }
  };

  const handleDisconnectSupabase = async () => {
    const result = await disconnectSupabase();
    if (result.success) {
      toast.success("Supabase getrennt");
    } else {
      toast.error(result.error || "Fehler beim Trennen");
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <Loader2 className={styles.loadingIcon} />
      </div>
    );
  }

  if (!projectId) {
    return <div className={styles.emptyState}>Bitte wähle zuerst ein Projekt aus</div>;
  }

  const githubData = integrations?.github;
  const supabaseData = integrations?.supabase;
  const isGithubConnected = githubData?.token;
  const isSupabaseConnected = supabaseData?.url;

  return (
    <div className={styles.root}>
      {/* GitHub Integration */}
      <Card className={styles.card}>
        <CardHeader>
          <div className={styles.headerRow}>
            <div className={styles.headerLeft}>
              <Github className={styles.headerIcon} />
              <div>
                <CardTitle className={styles.cardTitle}>GitHub</CardTitle>
                <CardDescription className={styles.cardDescription}>
                  Repository-Integration für Code-Analyse
                </CardDescription>
              </div>
            </div>
            {isGithubConnected ? (
              <Badge className={clsx(styles.badge, styles.badgeConnected)}>
                <CheckCircle className={styles.badgeIcon} />
                Verbunden
              </Badge>
            ) : (
              <Badge variant="outline" className={clsx(styles.badge, styles.badgeDisconnected)}>
                <XCircle className={styles.badgeIcon} />
                Nicht verbunden
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className={styles.cardContent}>
          {!isGithubConnected ? (
            <>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>GitHub Personal Access Token</label>
                <Input
                  type="password"
                  placeholder="ghp_..."
                  value={githubToken}
                  onChange={(e) => setGithubToken(e.target.value)}
                  className={styles.input}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Username (optional)</label>
                <Input
                  placeholder="username"
                  value={githubUsername}
                  onChange={(e) => setGithubUsername(e.target.value)}
                  className={styles.input}
                />
              </div>
              <Button onClick={handleConnectGitHub} className={styles.primaryButton}>
                Verbinden
              </Button>
            </>
          ) : (
            <>
              <div className={styles.metaList}>
                <p className={styles.metaItem}>
                  Username:{" "}
                  <span className={styles.metaValue}>{githubData?.username || "N/A"}</span>
                </p>
                <p className={styles.metaItem}>
                  Verbunden am:{" "}
                  <span className={styles.metaValue}>
                    {githubData?.connectedAt
                      ? new Date(githubData.connectedAt).toLocaleString("de-DE")
                      : "N/A"}
                  </span>
                </p>
              </div>

              <Separator className={styles.separator} />

              <div className={styles.actionRow}>
                <Button
                  onClick={handleTestGitHub}
                  disabled={testingGithub}
                  variant="outline"
                  className={styles.outlineButton}
                >
                  {testingGithub ? (
                    <>
                      <Loader2 className={styles.buttonSpinner} />
                      Teste...
                    </>
                  ) : (
                    "Repositories Laden"
                  )}
                </Button>
                <Button
                  onClick={handleDisconnectGitHub}
                  variant="outline"
                  className={styles.dangerButton}
                >
                  Trennen
                </Button>
              </div>

              {githubRepos.length > 0 && (
                <div className={styles.repoList}>
                  {githubRepos.slice(0, 10).map((repo) => (
                    <div key={repo.id} className={styles.repoItem}>
                      <span className={styles.repoName}>{repo.full_name}</span>
                      {repo.private && <Badge className={styles.repoBadge}>private</Badge>}
                    </div>
                  ))}
                  {githubRepos.length > 10 && (
                    <p className={styles.repoMore}>+{githubRepos.length - 10} weitere</p>
                  )}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Supabase Integration */}
      <Card className={styles.card}>
        <CardHeader>
          <div className={styles.headerRow}>
            <div className={styles.headerLeft}>
              <Database className={styles.headerIcon} />
              <div>
                <CardTitle className={styles.cardTitle}>Supabase</CardTitle>
                <CardDescription className={styles.cardDescription}>
                  Backend-Integration für DB-Analyse
                </CardDescription>
              </div>
            </div>
            {isSupabaseConnected ? (
              <Badge className={clsx(styles.badge, styles.badgeConnected)}>
                <CheckCircle className={styles.badgeIcon} />
                Verbunden
              </Badge>
            ) : (
              <Badge variant="outline" className={clsx(styles.badge, styles.badgeDisconnected)}>
                <XCircle className={styles.badgeIcon} />
                Nicht verbunden
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className={styles.cardContent}>
          {!isSupabaseConnected ? (
            <>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Supabase URL</label>
                <Input
                  placeholder="https://xxx.supabase.co"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  className={styles.input}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Anon Key</label>
                <Input
                  type="password"
                  placeholder="eyJhbGciOi..."
                  value={supabaseAnonKey}
                  onChange={(e) => setSupabaseAnonKey(e.target.value)}
                  className={styles.input}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Service Role Key (optional)</label>
                <Input
                  type="password"
                  placeholder="eyJhbGciOi..."
                  value={supabaseServiceKey}
                  onChange={(e) => setSupabaseServiceKey(e.target.value)}
                  className={styles.input}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.fieldLabel}>Project Ref (optional)</label>
                <Input
                  placeholder="abc123xyz"
                  value={supabaseProjectRef}
                  onChange={(e) => setSupabaseProjectRef(e.target.value)}
                  className={styles.input}
                />
              </div>
              <Button onClick={handleConnectSupabase} className={styles.primaryButton}>
                Verbinden
              </Button>
            </>
          ) : (
            <>
              <div className={styles.metaList}>
                <p className={styles.metaItem}>
                  URL: <span className={styles.metaValue}>{supabaseData?.url ?? "N/A"}</span>
                </p>
                <p className={styles.metaItem}>
                  Project Ref:{" "}
                  <span className={styles.metaValue}>{supabaseData?.projectRef || "N/A"}</span>
                </p>
                <p className={styles.metaItem}>
                  Verbunden am:{" "}
                  <span className={styles.metaValue}>
                    {supabaseData?.connectedAt
                      ? new Date(supabaseData.connectedAt).toLocaleString("de-DE")
                      : "N/A"}
                  </span>
                </p>
              </div>

              <Separator className={styles.separator} />

              <Button
                onClick={handleDisconnectSupabase}
                variant="outline"
                className={styles.dangerButtonFull}
              >
                Trennen
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
