/**
 * GitHubRepoSelector: Shows repo selection when GitHub is connected (via Settings → Connections).
 * When not connected, shows "Connect GitHub in Settings" and Open Settings button.
 * Location: src/modules/projects/components/GitHubRepoSelector.tsx
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, ExternalLink, Github, Loader2, Search, Settings } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import { useAuth } from "../../../contexts/useAuth";
import { api } from "../../../utils/api";
import type { GitHubRepo } from "../services/githubAuth";
import { fetchGitHubReposWithBearer, getGitHubStatus } from "../services/githubAuth";
import styles from "../styles/GitHubRepoSelector.module.css";

interface GitHubRepoSelectorProps {
  /** When set, selecting a repo calls api.integrations.github.setProjectGitHubRepo(projectId, { repo, branch }, accessToken). */
  projectId?: string | null;
  onSelect: (repoFullName: string, branch: string) => void;
  /** Called when user should open Settings to connect GitHub (e.g. when not connected). */
  onOpenSettings?: () => void;
  initialRepo?: string;
  initialBranch?: string;
}

export function GitHubRepoSelector({
  projectId,
  onSelect,
  onOpenSettings,
  initialRepo = "",
  initialBranch = "main",
}: GitHubRepoSelectorProps) {
  const { session } = useAuth();
  const accessToken = session?.access_token ?? null;

  const [statusLoading, setStatusLoading] = useState(true);
  const [githubConnected, setGithubConnected] = useState<boolean | null>(null);
  const [githubAccount, setGithubAccount] = useState<{
    login: string;
    id: number;
  } | null>(null);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [reposLoading, setReposLoading] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState(initialRepo);
  const [selectedBranch, setSelectedBranch] = useState(initialBranch);
  const [repoSearchQuery, setRepoSearchQuery] = useState("");
  const [apiError, setApiError] = useState<string | null>(null);

  const filteredRepos = useMemo(() => {
    if (!repoSearchQuery.trim()) return repos;
    const q = repoSearchQuery.trim().toLowerCase();
    return repos.filter(
      (r) =>
        r.full_name.toLowerCase().includes(q) ||
        r.name.toLowerCase().includes(q) ||
        (r.description ?? "").toLowerCase().includes(q),
    );
  }, [repos, repoSearchQuery]);

  const loadStatus = useCallback(async (token: string) => {
    setStatusLoading(true);
    setApiError(null);
    try {
      const status = await getGitHubStatus(token);
      setGithubConnected(status.connected);
      setGithubAccount(status.account ?? null);
    } catch (err) {
      setGithubConnected(false);
      setGithubAccount(null);
      setApiError(err instanceof Error ? err.message : "Status konnte nicht geladen werden.");
    } finally {
      setStatusLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!accessToken) {
      setStatusLoading(false);
      setGithubConnected(false);
      setGithubAccount(null);
      return;
    }
    loadStatus(accessToken);
  }, [accessToken, loadStatus]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("github") === "connected" && accessToken) {
      loadStatus(accessToken);
    }
  }, [accessToken, loadStatus]);

  const loadRepos = useCallback(async (token: string) => {
    setReposLoading(true);
    setApiError(null);
    try {
      const list = await fetchGitHubReposWithBearer(token);
      setRepos(list);
    } catch (err) {
      setRepos([]);
      setApiError(
        err instanceof Error ? err.message : "Repositories konnten nicht geladen werden.",
      );
    } finally {
      setReposLoading(false);
    }
  }, []);

  useEffect(() => {
    if (githubConnected && accessToken) {
      loadRepos(accessToken);
    } else {
      setRepos([]);
    }
  }, [githubConnected, accessToken, loadRepos]);

  const handleRepoSelect = (repoFullName: string) => {
    setSelectedRepo(repoFullName);
    const repo = repos.find((r) => r.full_name === repoFullName);
    const branch = repo?.default_branch ?? "main";
    setSelectedBranch(branch);

    if (projectId && accessToken) {
      api.integrations.github
        .setProjectGitHubRepo(projectId, { repo: repoFullName, branch }, accessToken)
        .then((res) => {
          if (!res.success) {
            setApiError(res.error ?? "Repo konnte nicht zugewiesen werden.");
          }
        })
        .catch(() => setApiError("Repo konnte nicht zugewiesen werden."));
    }

    onSelect(repoFullName, branch);
  };

  const handleBranchChange = (branch: string) => {
    setSelectedBranch(branch);
    if (selectedRepo) {
      if (projectId && accessToken) {
        api.integrations.github
          .setProjectGitHubRepo(projectId, { repo: selectedRepo, branch }, accessToken)
          .then((res) => {
            if (!res.success) setApiError(res.error ?? null);
          })
          .catch(() => setApiError("Branch konnte nicht gesetzt werden."));
      }
      onSelect(selectedRepo, branch);
    }
  };

  return (
    <div className={styles.root}>
      {statusLoading ? (
        <div className={styles.connectionCard}>
          <Loader2 className={styles.spinner} aria-hidden="true" />
          <p className={styles.connectionText}>GitHub-Status wird geladen…</p>
        </div>
      ) : !githubConnected ? (
        <div className={styles.connectionCard}>
          <Github className={styles.connectionIcon} aria-hidden="true" />
          <div className={styles.connectionContent}>
            <p className={styles.connectionText}>
              GitHub ist nicht verbunden. Verbinde GitHub in den Einstellungen, um ein Repository
              auszuwählen.
            </p>
            {onOpenSettings && (
              <Button type="button" onClick={onOpenSettings} className={styles.connectButton}>
                <Settings className={styles.connectionIcon} aria-hidden="true" />
                Einstellungen öffnen
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className={styles.connectionCard}>
          <Github className={styles.connectionIcon} aria-hidden="true" />
          <div className={styles.connectionContent}>
            <div className={styles.connectionRow}>
              <CheckCircle2 className={styles.connectionSuccess} aria-hidden="true" />
              <p className={styles.connectionText}>
                GitHub verbunden als{" "}
                <span className={styles.connectionHighlight}>{githubAccount?.login ?? "—"}</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {apiError && (
        <p className={styles.errorText} role="alert">
          {apiError}
        </p>
      )}

      {githubConnected ? (
        <>
          {reposLoading ? (
            <div className={styles.loadingRow} aria-busy="true" role="status">
              <Loader2 className={styles.spinner} aria-hidden="true" />
              <span className={styles.loadingText}>Repositories werden geladen…</span>
            </div>
          ) : repos.length > 0 ? (
            <>
              <div className={styles.fieldGroup}>
                <Label htmlFor="repo-select">Repository auswählen</Label>
                <Select
                  value={selectedRepo}
                  onValueChange={handleRepoSelect}
                  onOpenChange={(open) => {
                    if (!open) setRepoSearchQuery("");
                  }}
                >
                  <SelectTrigger className={styles.selectTriggerSpacing}>
                    <SelectValue placeholder="Repository wählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    <div
                      className={styles.repoSearchWrap}
                      onPointerDown={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                    >
                      <Search className={styles.repoSearchIcon} aria-hidden="true" />
                      <input
                        type="search"
                        placeholder="Repos durchsuchen…"
                        value={repoSearchQuery}
                        onChange={(e) => setRepoSearchQuery(e.target.value)}
                        className={styles.repoSearchInput}
                        aria-label="Repositories durchsuchen"
                      />
                    </div>
                    {filteredRepos.length === 0 ? (
                      <div className={styles.repoSearchEmpty}>
                        {repoSearchQuery.trim() ? "Keine Treffer" : "Keine Repositories"}
                      </div>
                    ) : (
                      filteredRepos.map((r) => (
                        <SelectItem key={r.id} value={r.full_name}>
                          <div className={styles.connectionRow}>
                            <span>{r.full_name}</span>
                            {r.private && <span className={styles.privateBadge}>Private</span>}
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className={styles.fieldGroup}>
                <Label htmlFor="branch-select">Branch</Label>
                <Input
                  id="branch-select"
                  value={selectedBranch}
                  onChange={(e) => handleBranchChange(e.target.value)}
                  className={styles.inputSpacing}
                />
              </div>
            </>
          ) : (
            <p className={styles.emptyText}>Keine Repositories gefunden</p>
          )}
        </>
      ) : null}

      {selectedRepo && (
        <div className={styles.manualLinkRow}>
          <ExternalLink aria-hidden="true" />
          <a
            href={`https://github.com/${selectedRepo}`}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.manualLink}
          >
            Repository auf GitHub öffnen
          </a>
        </div>
      )}
    </div>
  );
}
