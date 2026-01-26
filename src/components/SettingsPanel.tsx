import { useState } from 'react';
import { Project } from '../lib/visudev/types';
import { Github, Database, Webhook, CheckCircle, XCircle, RefreshCw, Users, Zap } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface SettingsPanelProps {
  project: Project;
}

export function SettingsPanel({ project }: SettingsPanelProps) {
  const [isConnectingGitHub, setIsConnectingGitHub] = useState(false);
  const [isConnectingSupabase, setIsConnectingSupabase] = useState(false);

  // Mock connection status
  const [githubConnected, setGitHubConnected] = useState(true);
  const [supabaseConnected, setSupabaseConnected] = useState(true);
  const [webhookStatus, setWebhookStatus] = useState<'active' | 'inactive' | 'error'>('active');
  const [pollingInterval, setPollingInterval] = useState(60);

  // Screenshot API Testing
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testResult, setTestResult] = useState<any>(null);

  const runScreenshotTest = async () => {
    setTestStatus('testing');
    setTestResult(null);

    try {
      console.log('[Test] Testing visudev-screenshots function...');
      
      const url = `https://${projectId}.supabase.co/functions/v1/visudev-screenshots/health`;
      console.log('[Test] URL:', url);
      
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });

      const data = await res.json();
      console.log('[Test] Response:', data);

      setTestResult(data);
      setTestStatus('success');
    } catch (err) {
      console.error('[Test] Error:', err);
      setTestResult({ error: String(err) });
      setTestStatus('error');
    }
  };

  const handleGitHubConnect = async () => {
    setIsConnectingGitHub(true);
    // Simulate connection
    await new Promise(resolve => setTimeout(resolve, 1500));
    setGitHubConnected(true);
    setIsConnectingGitHub(false);
  };

  const handleSupabaseConnect = async () => {
    setIsConnectingSupabase(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setSupabaseConnected(true);
    setIsConnectingSupabase(false);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      {/* Project Info */}
      <div className="space-y-4">
        <h2 className="text-2xl">Project Settings</h2>
        <div className="border rounded-lg p-4 bg-white">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-500 mb-1">Project Name</div>
              <div>{project.name}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-1">Project ID</div>
              <code className="text-sm bg-gray-100 px-2 py-1 rounded">{project.id}</code>
            </div>
          </div>
        </div>
      </div>

      {/* GitHub Connection */}
      <div className="space-y-4">
        <h3 className="text-xl flex items-center gap-2">
          <Github className="w-6 h-6" />
          GitHub Integration
        </h3>
        
        <div className="border rounded-lg p-6 bg-white space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span>Status</span>
                {githubConnected ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
              </div>
              {githubConnected && project.github_repo && (
                <div className="text-sm text-gray-600">
                  Connected to <code className="bg-gray-100 px-2 py-0.5 rounded">{project.github_repo}</code>
                </div>
              )}
            </div>
            
            {!githubConnected && (
              <button
                onClick={handleGitHubConnect}
                disabled={isConnectingGitHub}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isConnectingGitHub ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Github className="w-4 h-4" />
                    Connect GitHub
                  </>
                )}
              </button>
            )}
          </div>

          {githubConnected && project.github_repo && (
            <div className="border-t pt-4 space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Repository:</span>{' '}
                  <code className="bg-gray-100 px-2 py-0.5 rounded">{project.github_repo}</code>
                </div>
                <div>
                  <span className="text-gray-500">Branch:</span>{' '}
                  <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">{project.github_branch || 'main'}</code>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Supabase Connection */}
      <div className="space-y-4">
        <h3 className="text-xl flex items-center gap-2">
          <Database className="w-6 h-6" />
          Supabase Integration
        </h3>
        
        <div className="border rounded-lg p-6 bg-white space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span>Status</span>
                {supabaseConnected ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
              </div>
              {supabaseConnected && (
                <div className="text-sm text-gray-600">
                  Connected and syncing database metadata
                </div>
              )}
            </div>
            
            {!supabaseConnected && (
              <button
                onClick={handleSupabaseConnect}
                disabled={isConnectingSupabase}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isConnectingSupabase ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4" />
                    Connect Supabase
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Webhooks & Polling */}
      <div className="space-y-4">
        <h3 className="text-xl flex items-center gap-2">
          <Webhook className="w-6 h-6" />
          Webhooks & Sync
        </h3>
        
        <div className="border rounded-lg p-6 bg-white space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span>Webhook Status</span>
                {webhookStatus === 'active' && <CheckCircle className="w-5 h-5 text-green-600" />}
                {webhookStatus === 'inactive' && <XCircle className="w-5 h-5 text-gray-400" />}
                {webhookStatus === 'error' && <XCircle className="w-5 h-5 text-red-600" />}
              </div>
              <div className="text-sm text-gray-600">
                {webhookStatus === 'active' && 'Receiving real-time updates from GitHub'}
                {webhookStatus === 'inactive' && 'Webhooks not configured'}
                {webhookStatus === 'error' && 'Webhook delivery failed'}
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <label className="block mb-2">
              <span className="text-sm text-gray-600">Polling Fallback Interval (seconds)</span>
            </label>
            <div className="flex items-center gap-4">
              <input
                type="number"
                min="30"
                max="3600"
                value={pollingInterval}
                onChange={(e) => setPollingInterval(parseInt(e.target.value))}
                className="border rounded px-3 py-2 w-32"
              />
              <span className="text-sm text-gray-500">
                Fallback to polling every {pollingInterval}s when webhooks are unavailable
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* RBAC */}
      <div className="space-y-4">
        <h3 className="text-xl flex items-center gap-2">
          <Users className="w-6 h-6" />
          Team & Access
        </h3>
        
        <div className="border rounded-lg p-6 bg-white">
          <p className="text-sm text-gray-600 mb-4">
            Manage project members and their roles (owner, maintainer, viewer)
          </p>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between py-2 border-b">
              <div>
                <div className="text-sm">current-user@example.com</div>
                <div className="text-xs text-gray-500">You</div>
              </div>
              <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                Owner
              </span>
            </div>
          </div>

          <button className="mt-4 px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors text-sm">
            Invite Team Member
          </button>
        </div>
      </div>

      {/* Screenshot API Testing */}
      <div className="space-y-4">
        <h3 className="text-xl flex items-center gap-2">
          <Zap className="w-6 h-6" />
          Screenshot API Test
        </h3>
        
        <div className="border rounded-lg p-6 bg-white space-y-4">
          <p className="text-sm text-gray-600">
            Test the visudev-screenshots Edge Function
          </p>

          <button
            onClick={runScreenshotTest}
            disabled={testStatus === 'testing'}
            className="px-4 py-2 bg-primary text-black rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {testStatus === 'testing' ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Run Health Check
              </>
            )}
          </button>

          {testResult && (
            <div className={`p-4 rounded-lg border ${
              testStatus === 'success' 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {testStatus === 'success' ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
                <span className="font-medium">
                  {testStatus === 'success' ? 'Success' : 'Error'}
                </span>
              </div>
              <pre className="text-xs bg-white/50 p-3 rounded border overflow-auto max-h-64">
                {JSON.stringify(testResult, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}