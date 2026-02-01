import { useEffect, useState, useCallback } from "react";
import { CheckCircle2, ExternalLink, Github, Loader2 } from "lucide-react";
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
import type { GitHubRepo, GitHubUser } from "../services/githubAuth";
import {
  exchangeGitHubSession,
  fetchGitHubRepos,
  getGitHubAuthorizeUrl,
} from "../services/githubAuth";
import styles from "../styles/GitHubRepoSelector.module.css";

interface GitHubRepoSelectorProps {
  onSelect: (repoFullName: string, branch: string, accessToken: string) => void;
  initialRepo?: string;
  initialBranch?: string;
}

export function GitHubRepoSelector({
  onSelect,
  initialRepo = "",
  initialBranch = "main",
}: GitHubRepoSelectorProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [selectedRepo, setSelectedRepo] = useState(initialRepo);
  const [selectedBranch, setSelectedBranch] = useState(initialBranch);
  const [accessToken, setAccessToken] = useState("");
  const [githubUser, setGithubUser] = useState<GitHubUser | null>(null);

  const loadRepositories = useCallback(async (token: string) => {
    setIsLoading(true);
    try {
      const repoList = await fetchGitHubRepos(token);
      setRepos(repoList);
    } catch {
      alert("Fehler beim Laden der Repositories");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleOAuthCallback = useCallback(
    async (state: string) => {
      try {
        const session = await exchangeGitHubSession(state);

        if (session.user) {
          setGithubUser(session.user);
        }

        setAccessToken(session.token);
        setIsConnected(true);
        await loadRepositories(session.token);
      } catch {
        alert("Fehler beim Verbinden mit GitHub");
      }
    },
    [loadRepositories],
  );

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const authState = urlParams.get("github_auth_state");

    if (authState && !isConnected) {
      const newUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, "", newUrl);
      handleOAuthCallback(authState);
    }

    const checkLocalStorageAuth = async () => {
      const state = localStorage.getItem("visudev_github_state");
      const userJson = localStorage.getItem("visudev_github_user");

      if (state && userJson) {
        localStorage.removeItem("visudev_github_state");
        localStorage.removeItem("visudev_github_user");

        try {
          const user = JSON.parse(userJson) as GitHubUser;
          setGithubUser(user);

          const session = await exchangeGitHubSession(state);
          if (session.user) {
            setGithubUser(session.user);
          }

          setAccessToken(session.token);
          setIsConnected(true);
          await loadRepositories(session.token);
        } catch {
          alert("Fehler beim Abrufen der GitHub-Daten");
        }
      }
    };

    if (!authState) {
      checkLocalStorageAuth();
    }

    const handleMessage = async (event: MessageEvent) => {
      if (event.data.type === "github_oauth_success") {
        const state = event.data.state as string;
        setGithubUser(event.data.user as GitHubUser);

        try {
          const session = await exchangeGitHubSession(state);
          if (session.user) {
            setGithubUser(session.user);
          }

          setAccessToken(session.token);
          setIsConnected(true);
          await loadRepositories(session.token);
        } catch {
          alert("Fehler beim Abrufen der GitHub-Daten");
        }
      }
    };

    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [handleOAuthCallback, isConnected, loadRepositories]);

  const connectToGitHub = async () => {
    setIsLoading(true);
    try {
      const publicSiteUrl = "https://stony-fifth-31373932.figma.site";
      const returnUrl = publicSiteUrl;

      const authUrl = await getGitHubAuthorizeUrl(returnUrl);
      const authWindow = window.open(authUrl, "_blank");

      if (!authWindow) {
        alert(
          "Popup wurde blockiert. Bitte erlauben Sie Popups oder öffnen Sie den Link manuell:\n\n" +
            authUrl,
        );
      }
    } catch {
      alert("Fehler beim Verbinden mit GitHub");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRepoSelect = (repoFullName: string) => {
    setSelectedRepo(repoFullName);
    const repo = repos.find((item) => item.full_name === repoFullName);
    if (repo) {
      setSelectedBranch(repo.default_branch);
      onSelect(repoFullName, repo.default_branch, accessToken);
    }
  };

  const handleBranchChange = (branch: string) => {
    setSelectedBranch(branch);
    onSelect(selectedRepo, branch, accessToken);
  };

  const handleManualInput = (repo: string) => {
    setSelectedRepo(repo);
    onSelect(repo, selectedBranch, "");
  };

  const handleManualBranchInput = (branch: string) => {
    setSelectedBranch(branch);
    onSelect(selectedRepo, branch, "");
  };

  return (
    <div className={styles.root}>
      <div className={styles.connectionCard}>
        <Github className={styles.connectionIcon} aria-hidden="true" />
        <div className={styles.connectionContent}>
          {isConnected && githubUser ? (
            <div className={styles.connectionRow}>
              <CheckCircle2 className={styles.connectionSuccess} aria-hidden="true" />
              <p className={styles.connectionText}>
                Verbunden als <span className={styles.connectionHighlight}>{githubUser.login}</span>
              </p>
            </div>
          ) : (
            <p className={styles.connectionText}>GitHub Repository verbinden</p>
          )}
        </div>
        {!isConnected && (
          <Button onClick={connectToGitHub} className={styles.connectButton}>
            <Github aria-hidden="true" />
            Verbinden
          </Button>
        )}
      </div>

      {isConnected ? (
        <>
          {isLoading ? (
            <div className={styles.loadingRow}>
              <Loader2 className={styles.spinner} aria-hidden="true" />
            </div>
          ) : repos.length > 0 ? (
            <>
              <div className={styles.fieldGroup}>
                <Label htmlFor="repo-select">Repository auswählen</Label>
                <Select value={selectedRepo} onValueChange={handleRepoSelect}>
                  <SelectTrigger className={styles.selectTriggerSpacing}>
                    <SelectValue placeholder="Repository wählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {repos.map((repo) => (
                      <SelectItem key={repo.id} value={repo.full_name}>
                        <div className={styles.connectionRow}>
                          <span>{repo.full_name}</span>
                          {repo.private && <span className={styles.privateBadge}>Private</span>}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className={styles.fieldGroup}>
                <Label htmlFor="branch-select">Branch</Label>
                <Input
                  id="branch-select"
                  value={selectedBranch}
                  onChange={(event) => handleBranchChange(event.target.value)}
                  className={styles.inputSpacing}
                />
              </div>
            </>
          ) : (
            <p className={styles.emptyText}>Keine Repositories gefunden</p>
          )}
        </>
      ) : (
        <>
          <div className={styles.fieldGroup}>
            <Label htmlFor="github-repo">Oder Repository manuell eingeben (owner/repo)</Label>
            <Input
              id="github-repo"
              placeholder="username/repository"
              value={selectedRepo}
              onChange={(event) => handleManualInput(event.target.value)}
              className={styles.inputSpacing}
            />
            <p className={styles.helperText}>Beispiel: facebook/react oder octocat/Hello-World</p>
          </div>

          <div className={styles.fieldGroup}>
            <Label htmlFor="github-branch">Branch</Label>
            <Input
              id="github-branch"
              placeholder="main"
              value={selectedBranch}
              onChange={(event) => handleManualBranchInput(event.target.value)}
              className={styles.inputSpacing}
            />
          </div>
        </>
      )}

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
