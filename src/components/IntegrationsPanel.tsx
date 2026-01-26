/**
 * Integrations Panel Component
 * Example usage of VisuDEV Edge Functions API
 */

import { useState } from 'react';
import { useIntegrations } from '../utils/useVisuDev';
import { api } from '../utils/api';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { toast } from 'sonner';
import { Github, Database, Loader2, CheckCircle, XCircle } from 'lucide-react';

interface IntegrationsPanelProps {
  projectId: string | null;
}

export function IntegrationsPanel({ projectId }: IntegrationsPanelProps) {
  const { integrations, loading, refresh, connectGitHub, disconnectGitHub, connectSupabase, disconnectSupabase } = useIntegrations(projectId);
  
  const [githubToken, setGithubToken] = useState('');
  const [githubUsername, setGithubUsername] = useState('');
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState('');
  const [supabaseServiceKey, setSupabaseServiceKey] = useState('');
  const [supabaseProjectRef, setSupabaseProjectRef] = useState('');
  
  const [testingGithub, setTestingGithub] = useState(false);
  const [githubRepos, setGithubRepos] = useState<any[]>([]);

  const handleConnectGitHub = async () => {
    if (!githubToken) {
      toast.error('GitHub Token erforderlich');
      return;
    }
    
    const result = await connectGitHub(githubToken, githubUsername);
    if (result.success) {
      toast.success('GitHub erfolgreich verbunden');
      setGithubToken('');
      setGithubUsername('');
    } else {
      toast.error(result.error || 'GitHub-Verbindung fehlgeschlagen');
    }
  };

  const handleDisconnectGitHub = async () => {
    const result = await disconnectGitHub();
    if (result.success) {
      toast.success('GitHub getrennt');
    } else {
      toast.error(result.error || 'Fehler beim Trennen');
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
      toast.error(result.error || 'GitHub-Test fehlgeschlagen');
    }
    setTestingGithub(false);
  };

  const handleConnectSupabase = async () => {
    if (!supabaseUrl || !supabaseAnonKey) {
      toast.error('URL und Anon Key erforderlich');
      return;
    }
    
    const result = await connectSupabase(supabaseUrl, supabaseAnonKey, supabaseServiceKey, supabaseProjectRef);
    if (result.success) {
      toast.success('Supabase erfolgreich verbunden');
      setSupabaseUrl('');
      setSupabaseAnonKey('');
      setSupabaseServiceKey('');
      setSupabaseProjectRef('');
    } else {
      toast.error(result.error || 'Supabase-Verbindung fehlgeschlagen');
    }
  };

  const handleDisconnectSupabase = async () => {
    const result = await disconnectSupabase();
    if (result.success) {
      toast.success('Supabase getrennt');
    } else {
      toast.error(result.error || 'Fehler beim Trennen');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#03ffa3' }} />
      </div>
    );
  }

  if (!projectId) {
    return (
      <div className="p-8 text-center text-gray-500">
        Bitte wähle zuerst ein Projekt aus
      </div>
    );
  }

  const isGithubConnected = integrations?.github?.token;
  const isSupabaseConnected = integrations?.supabase?.url;

  return (
    <div className="space-y-6 p-6">
      {/* GitHub Integration */}
      <Card className="bg-[#0a0a0a] border-[#1a1a1a]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Github className="w-6 h-6" style={{ color: '#03ffa3' }} />
              <div>
                <CardTitle className="text-white">GitHub</CardTitle>
                <CardDescription>Repository-Integration für Code-Analyse</CardDescription>
              </div>
            </div>
            {isGithubConnected ? (
              <Badge className="bg-[#03ffa3]/10 border-[#03ffa3]" style={{ color: '#03ffa3' }}>
                <CheckCircle className="w-3 h-3 mr-1" />
                Verbunden
              </Badge>
            ) : (
              <Badge variant="outline" className="border-gray-700 text-gray-500">
                <XCircle className="w-3 h-3 mr-1" />
                Nicht verbunden
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isGithubConnected ? (
            <>
              <div className="space-y-2">
                <label className="text-sm text-gray-400">GitHub Personal Access Token</label>
                <Input
                  type="password"
                  placeholder="ghp_..."
                  value={githubToken}
                  onChange={(e) => setGithubToken(e.target.value)}
                  className="bg-black border-[#1a1a1a] text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-400">Username (optional)</label>
                <Input
                  placeholder="username"
                  value={githubUsername}
                  onChange={(e) => setGithubUsername(e.target.value)}
                  className="bg-black border-[#1a1a1a] text-white"
                />
              </div>
              <Button
                onClick={handleConnectGitHub}
                className="w-full"
                style={{ backgroundColor: '#03ffa3', color: '#000' }}
              >
                Verbinden
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <p className="text-sm text-gray-400">
                  Username: <span className="text-white">{integrations.github.username || 'N/A'}</span>
                </p>
                <p className="text-sm text-gray-400">
                  Verbunden am: <span className="text-white">
                    {new Date(integrations.github.connectedAt).toLocaleString('de-DE')}
                  </span>
                </p>
              </div>
              
              <Separator className="bg-[#1a1a1a]" />
              
              <div className="flex gap-2">
                <Button
                  onClick={handleTestGitHub}
                  disabled={testingGithub}
                  className="flex-1"
                  variant="outline"
                  style={{ borderColor: '#03ffa3', color: '#03ffa3' }}
                >
                  {testingGithub ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Teste...
                    </>
                  ) : (
                    'Repositories Laden'
                  )}
                </Button>
                <Button
                  onClick={handleDisconnectGitHub}
                  variant="outline"
                  className="border-red-500/50 text-red-500 hover:bg-red-500/10"
                >
                  Trennen
                </Button>
              </div>

              {githubRepos.length > 0 && (
                <div className="mt-4 max-h-48 overflow-y-auto space-y-2">
                  {githubRepos.slice(0, 10).map((repo: any) => (
                    <div
                      key={repo.id}
                      className="p-2 bg-black border border-[#1a1a1a] rounded text-sm"
                    >
                      <span className="text-white">{repo.full_name}</span>
                      {repo.private && (
                        <Badge className="ml-2 text-xs bg-gray-800">private</Badge>
                      )}
                    </div>
                  ))}
                  {githubRepos.length > 10 && (
                    <p className="text-xs text-gray-500 text-center">
                      +{githubRepos.length - 10} weitere
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Supabase Integration */}
      <Card className="bg-[#0a0a0a] border-[#1a1a1a]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Database className="w-6 h-6" style={{ color: '#03ffa3' }} />
              <div>
                <CardTitle className="text-white">Supabase</CardTitle>
                <CardDescription>Backend-Integration für DB-Analyse</CardDescription>
              </div>
            </div>
            {isSupabaseConnected ? (
              <Badge className="bg-[#03ffa3]/10 border-[#03ffa3]" style={{ color: '#03ffa3' }}>
                <CheckCircle className="w-3 h-3 mr-1" />
                Verbunden
              </Badge>
            ) : (
              <Badge variant="outline" className="border-gray-700 text-gray-500">
                <XCircle className="w-3 h-3 mr-1" />
                Nicht verbunden
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isSupabaseConnected ? (
            <>
              <div className="space-y-2">
                <label className="text-sm text-gray-400">Supabase URL</label>
                <Input
                  placeholder="https://xxx.supabase.co"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  className="bg-black border-[#1a1a1a] text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-400">Anon Key</label>
                <Input
                  type="password"
                  placeholder="eyJhbGciOi..."
                  value={supabaseAnonKey}
                  onChange={(e) => setSupabaseAnonKey(e.target.value)}
                  className="bg-black border-[#1a1a1a] text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-400">Service Role Key (optional)</label>
                <Input
                  type="password"
                  placeholder="eyJhbGciOi..."
                  value={supabaseServiceKey}
                  onChange={(e) => setSupabaseServiceKey(e.target.value)}
                  className="bg-black border-[#1a1a1a] text-white"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-400">Project Ref (optional)</label>
                <Input
                  placeholder="abc123xyz"
                  value={supabaseProjectRef}
                  onChange={(e) => setSupabaseProjectRef(e.target.value)}
                  className="bg-black border-[#1a1a1a] text-white"
                />
              </div>
              <Button
                onClick={handleConnectSupabase}
                className="w-full"
                style={{ backgroundColor: '#03ffa3', color: '#000' }}
              >
                Verbinden
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <p className="text-sm text-gray-400">
                  URL: <span className="text-white">{integrations.supabase.url}</span>
                </p>
                <p className="text-sm text-gray-400">
                  Project Ref: <span className="text-white">{integrations.supabase.projectRef || 'N/A'}</span>
                </p>
                <p className="text-sm text-gray-400">
                  Verbunden am: <span className="text-white">
                    {new Date(integrations.supabase.connectedAt).toLocaleString('de-DE')}
                  </span>
                </p>
              </div>
              
              <Separator className="bg-[#1a1a1a]" />
              
              <Button
                onClick={handleDisconnectSupabase}
                variant="outline"
                className="w-full border-red-500/50 text-red-500 hover:bg-red-500/10"
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
