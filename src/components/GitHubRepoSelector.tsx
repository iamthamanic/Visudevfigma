import { useState, useEffect } from 'react';
import { Github, Loader2, ExternalLink, CheckCircle2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  private: boolean;
  default_branch: string;
}

interface GitHubRepoSelectorProps {
  onSelect: (repo: string, branch: string, accessToken: string) => void;
  initialRepo?: string;
  initialBranch?: string;
}

export function GitHubRepoSelector({ 
  onSelect, 
  initialRepo = '', 
  initialBranch = 'main' 
}: GitHubRepoSelectorProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [selectedRepo, setSelectedRepo] = useState(initialRepo);
  const [selectedBranch, setSelectedBranch] = useState(initialBranch);
  const [accessToken, setAccessToken] = useState('');
  const [githubUser, setGithubUser] = useState<any>(null);
  const [oauthState, setOauthState] = useState('');
  const [showPopupBlockedWarning, setShowPopupBlockedWarning] = useState(false);
  const [authUrl, setAuthUrl] = useState('');

  useEffect(() => {
    // Check for GitHub auth state in URL (after redirect from OAuth)
    const urlParams = new URLSearchParams(window.location.search);
    const authState = urlParams.get('github_auth_state');
    
    if (authState && !isConnected) {
      console.log('[VisuDEV] ✓ Found GitHub auth state in URL:', authState);
      
      // Clear the URL parameter
      const newUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, '', newUrl);
      
      // Fetch the session
      handleOAuthCallback(authState);
    }
    
    // Polling function to check localStorage for GitHub auth (legacy fallback)
    let pollInterval: NodeJS.Timeout | null = null;
    
    const checkLocalStorageAuth = async () => {
      const state = localStorage.getItem('visudev_github_state');
      const userJson = localStorage.getItem('visudev_github_user');
      
      if (state && userJson) {
        console.log('[VisuDEV] ✓ Found GitHub auth in localStorage!');
        
        // Clear localStorage
        localStorage.removeItem('visudev_github_state');
        localStorage.removeItem('visudev_github_user');
        
        // Stop polling
        if (pollInterval) {
          clearInterval(pollInterval);
          pollInterval = null;
        }
        
        try {
          const user = JSON.parse(userJson);
          setGithubUser(user);
          
          console.log('[VisuDEV] GitHub OAuth success, fetching session for state:', state);
          
          // Fetch session data from backend
          const response = await fetch(
            `https://${projectId}.supabase.co/functions/v1/visudev-auth/github/session`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${publicAnonKey}`
              },
              body: JSON.stringify({ state })
            }
          );

          if (!response.ok) {
            const errorData = await response.json();
            console.error('[VisuDEV] Failed to fetch session:', errorData);
            throw new Error('Failed to fetch session');
          }

          const result = await response.json();
          const token = result.data.access_token;
          
          console.log('[VisuDEV] ✓ Access token received, loading repositories...');
          
          // Store access token
          setAccessToken(token);
          setIsConnected(true);
          
          // Load repositories
          await loadRepositories(token);
          
          console.log('[VisuDEV] ✓ GitHub connection complete!');
        } catch (error) {
          console.error('[VisuDEV] Error processing GitHub auth from localStorage:', error);
          alert('Fehler beim Abrufen der GitHub-Daten');
        }
      }
    };
    
    // Check immediately on mount
    if (!authState) {
      console.log('[VisuDEV] Component mounted, checking for GitHub auth...');
      checkLocalStorageAuth();
    }

    // Listen for OAuth callback (for popup fallback)
    const handleMessage = async (event: MessageEvent) => {
      if (event.data.type === 'github_oauth_success') {
        console.log('[VisuDEV] Received postMessage from OAuth popup');
        const state = event.data.state;
        setGithubUser(event.data.user);
        
        // Fetch session data from backend
        try {
          const response = await fetch(
            `https://${projectId}.supabase.co/functions/v1/visudev-auth/github/session`,
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${publicAnonKey}`
              },
              body: JSON.stringify({ state })
            }
          );

          if (!response.ok) {
            throw new Error('Failed to fetch session');
          }

          const result = await response.json();
          const token = result.data.access_token;
          
          // Store access token
          setAccessToken(token);
          setIsConnected(true);
          
          // Load repositories
          await loadRepositories(token);
        } catch (error) {
          console.error('[VisuDEV] Error fetching session:', error);
          alert('Fehler beim Abrufen der GitHub-Daten');
        }
      }
    };

    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
      if (pollInterval) {
        console.log('[VisuDEV] Stopping localStorage polling');
        clearInterval(pollInterval);
      }
    };
  }, [isConnected]);

  const handleOAuthCallback = async (state: string) => {
    try {
      console.log('[VisuDEV] Processing OAuth callback with state:', state);
      
      // Fetch session data from backend
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/visudev-auth/github/session`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`
          },
          body: JSON.stringify({ state })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[VisuDEV] Failed to fetch session:', errorData);
        throw new Error('Failed to fetch session');
      }

      const result = await response.json();
      const token = result.data.access_token;
      const user = result.data.user;
      
      console.log('[VisuDEV] ✓ Access token received, user:', user.login);
      
      // Store user and token
      setGithubUser(user);
      setAccessToken(token);
      setIsConnected(true);
      
      // Load repositories
      console.log('[VisuDEV] Loading repositories...');
      await loadRepositories(token);
      
      console.log('[VisuDEV] ✓ GitHub connection complete!');
    } catch (error) {
      console.error('[VisuDEV] Error processing OAuth callback:', error);
      alert('Fehler beim Verbinden mit GitHub');
    }
  };

  const loadRepositories = async (token: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/visudev-auth/github/repos`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`
          },
          body: JSON.stringify({ access_token: token })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to load repositories');
      }

      const result = await response.json();
      setRepos(result.data || []);
    } catch (error) {
      console.error('Error loading repositories:', error);
      alert('Fehler beim Laden der Repositories');
    } finally {
      setIsLoading(false);
    }
  };

  const connectToGitHub = async () => {
    setIsLoading(true);
    try {
      console.log('[VisuDEV] Initiating GitHub OAuth...');
      
      // IMPORTANT: Use the public Figma Sites URL, not the iframe preview URL
      // Figma Make runs inside an iframe with a temporary preview URL,
      // but we need to redirect back to the published site URL
      const publicSiteUrl = 'https://stony-fifth-31373932.figma.site';
      const returnUrl = publicSiteUrl;
      
      console.log('[VisuDEV] Return URL:', returnUrl);
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/visudev-auth/github/authorize?return_url=${encodeURIComponent(returnUrl)}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to initiate GitHub OAuth');
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to get authorization URL');
      }

      console.log('[VisuDEV] Opening GitHub authorization in new tab...');
      
      // Open GitHub OAuth in a new tab
      const authWindow = window.open(data.authUrl, '_blank');
      
      if (!authWindow) {
        // Popup was blocked
        console.log('[VisuDEV] Popup blocked, showing manual link');
        alert('Popup wurde blockiert. Bitte erlauben Sie Popups oder öffnen Sie den Link manuell:\n\n' + data.authUrl);
      } else {
        console.log('[VisuDEV] ✓ GitHub OAuth window opened successfully');
        console.log('[VisuDEV] After GitHub authorization, you will be redirected back to:', returnUrl);
      }
    } catch (error) {
      console.error('[VisuDEV] Error initiating GitHub OAuth:', error);
      alert('Fehler beim Verbinden mit GitHub: ' + error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRepoSelect = (repoFullName: string) => {
    setSelectedRepo(repoFullName);
    const repo = repos.find(r => r.full_name === repoFullName);
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
    onSelect(repo, selectedBranch, '');
  };

  const handleManualBranchInput = (branch: string) => {
    setSelectedBranch(branch);
    onSelect(selectedRepo, branch, '');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <Github className="w-6 h-6" />
        <div className="flex-1">
          {isConnected && githubUser ? (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <p className="text-sm">Verbunden als <span className="font-medium">{githubUser.login}</span></p>
            </div>
          ) : (
            <p className="text-sm">GitHub Repository verbinden</p>
          )}
        </div>
        {!isConnected && (
          <Button
            onClick={connectToGitHub}
            className="gap-2 bg-[rgb(3,255,163)] text-black hover:bg-[rgb(3,255,163)]/90"
          >
            <Github className="w-4 h-4" />
            Verbinden
          </Button>
        )}
      </div>

      {isConnected ? (
        <>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : repos.length > 0 ? (
            <>
              <div>
                <Label htmlFor="repo-select">Repository auswählen</Label>
                <Select value={selectedRepo} onValueChange={handleRepoSelect}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Repository wählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {repos.map((repo) => (
                      <SelectItem key={repo.id} value={repo.full_name}>
                        <div className="flex items-center gap-2">
                          <span>{repo.full_name}</span>
                          {repo.private && (
                            <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                              Private
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="branch-select">Branch</Label>
                <Input
                  id="branch-select"
                  value={selectedBranch}
                  onChange={(e) => handleBranchChange(e.target.value)}
                  className="mt-2"
                />
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">Keine Repositories gefunden</p>
          )}
        </>
      ) : (
        <>
          <div>
            <Label htmlFor="github-repo">Oder Repository manuell eingeben (owner/repo)</Label>
            <Input
              id="github-repo"
              placeholder="username/repository"
              value={selectedRepo}
              onChange={(e) => handleManualInput(e.target.value)}
              className="mt-2"
            />
            <p className="text-xs text-gray-500 mt-1">
              Beispiel: facebook/react oder octocat/Hello-World
            </p>
          </div>

          <div>
            <Label htmlFor="github-branch">Branch</Label>
            <Input
              id="github-branch"
              placeholder="main"
              value={selectedBranch}
              onChange={(e) => handleManualBranchInput(e.target.value)}
              className="mt-2"
            />
          </div>
        </>
      )}

      {selectedRepo && (
        <div className="flex items-center gap-2 text-xs text-gray-500 p-3 bg-gray-50 rounded">
          <ExternalLink className="w-3 h-3" />
          <a
            href={`https://github.com/${selectedRepo}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[rgb(3,255,163)]"
          >
            Repository auf GitHub öffnen
          </a>
        </div>
      )}

      {showPopupBlockedWarning && (
        <div className="p-4 bg-red-50 text-red-800 rounded-lg mt-4">
          <p className="text-sm">
            Popup wurde blockiert! Bitte erlaube Popups für diese Seite und versuche es erneut.
          </p>
          <a
            href={authUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-500 hover:underline"
          >
            Manuell öffnen
          </a>
        </div>
      )}
    </div>
  );
}