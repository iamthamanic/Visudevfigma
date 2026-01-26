import { useState } from 'react';
import { Database, Loader2, CheckCircle2, ExternalLink, Key } from 'lucide-react';
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

interface SupabaseProject {
  id: string;
  name: string;
  organization_id: string;
  region: string;
  created_at: string;
}

interface SupabaseProjectSelectorProps {
  onSelect: (projectId: string, anonKey: string, managementToken: string) => void;
  initialProjectId?: string;
  initialAnonKey?: string;
}

export function SupabaseProjectSelector({ 
  onSelect, 
  initialProjectId = '', 
  initialAnonKey = '' 
}: SupabaseProjectSelectorProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [projects, setProjects] = useState<SupabaseProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState(initialProjectId);
  const [selectedAnonKey, setSelectedAnonKey] = useState(initialAnonKey);
  const [managementToken, setManagementToken] = useState('');
  const [showTokenInput, setShowTokenInput] = useState(false);

  const handleValidateToken = async () => {
    if (!managementToken.trim()) {
      alert('Bitte geben Sie ein Management Token ein');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/visudev-auth/supabase/projects`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`
          },
          body: JSON.stringify({ management_token: managementToken })
        }
      );

      if (!response.ok) {
        throw new Error('Invalid management token');
      }

      const result = await response.json();
      setProjects(result.data || []);
      setIsConnected(true);
      setShowTokenInput(false);
    } catch (error) {
      console.error('Error validating token:', error);
      alert('Ungültiges Management Token. Bitte überprüfen Sie Ihre Eingabe.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProjectSelect = (projId: string) => {
    setSelectedProjectId(projId);
    // User needs to provide anon key manually or we fetch it
    // For now, keep the manual input
    onSelect(projId, selectedAnonKey, managementToken);
  };

  const handleAnonKeyChange = (key: string) => {
    setSelectedAnonKey(key);
    onSelect(selectedProjectId, key, managementToken);
  };

  const handleManualProjectId = (projId: string) => {
    setSelectedProjectId(projId);
    onSelect(projId, selectedAnonKey, '');
  };

  const handleManualAnonKey = (key: string) => {
    setSelectedAnonKey(key);
    onSelect(selectedProjectId, key, '');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <Database className="w-6 h-6" />
        <div className="flex-1">
          {isConnected ? (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <p className="text-sm">Mit Supabase verbunden - {projects.length} Projekt(e) gefunden</p>
            </div>
          ) : (
            <p className="text-sm">Supabase Projekt verbinden</p>
          )}
        </div>
        {!isConnected && !showTokenInput && (
          <Button
            onClick={() => setShowTokenInput(true)}
            className="gap-2 bg-[rgb(3,255,163)] text-black hover:bg-[rgb(3,255,163)]/90"
          >
            <Key className="w-4 h-4" />
            Verbinden
          </Button>
        )}
      </div>

      {showTokenInput && !isConnected && (
        <div className="space-y-3 p-4 border border-gray-200 rounded-lg bg-white">
          <div className="flex items-start gap-2 text-sm text-gray-600">
            <ExternalLink className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div>
              <p className="mb-1">
                Erstellen Sie ein <strong>Management API Token</strong> in Ihrem Supabase Dashboard:
              </p>
              <ol className="list-decimal ml-4 space-y-1 text-xs">
                <li>Öffnen Sie <a href="https://supabase.com/dashboard/account/tokens" target="_blank" rel="noopener noreferrer" className="text-[rgb(3,255,163)] hover:underline">supabase.com/dashboard/account/tokens</a></li>
                <li>Klicken Sie auf "Generate New Token"</li>
                <li>Geben Sie dem Token einen Namen (z.B. "VisuDEV")</li>
                <li>Kopieren Sie das Token und fügen Sie es unten ein</li>
              </ol>
            </div>
          </div>

          <div>
            <Label htmlFor="management-token">Management API Token</Label>
            <Input
              id="management-token"
              type="password"
              placeholder="sbp_..."
              value={managementToken}
              onChange={(e) => setManagementToken(e.target.value)}
              className="mt-2"
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowTokenInput(false)}
              className="flex-1"
            >
              Abbrechen
            </Button>
            <Button
              onClick={handleValidateToken}
              disabled={isLoading || !managementToken.trim()}
              className="flex-1 bg-[rgb(3,255,163)] text-black hover:bg-[rgb(3,255,163)]/90"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Validiere...
                </>
              ) : (
                'Verbinden'
              )}
            </Button>
          </div>
        </div>
      )}

      {isConnected ? (
        <>
          {projects.length > 0 ? (
            <>
              <div>
                <Label htmlFor="project-select">Supabase Projekt auswählen</Label>
                <Select value={selectedProjectId} onValueChange={handleProjectSelect}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Projekt wählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((proj) => (
                      <SelectItem key={proj.id} value={proj.id}>
                        <div className="flex items-center gap-2">
                          <span>{proj.name}</span>
                          <span className="text-xs text-gray-500">({proj.region})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="anon-key">Anon Key (öffentlicher API-Schlüssel)</Label>
                <Input
                  id="anon-key"
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={selectedAnonKey}
                  onChange={(e) => handleAnonKeyChange(e.target.value)}
                  className="mt-2"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Zu finden in: Projekt Settings → API → anon public
                </p>
              </div>
            </>
          ) : null}
        </>
      ) : (
        <>
          <div>
            <Label htmlFor="manual-project-id">Oder manuell: Supabase Project ID</Label>
            <Input
              id="manual-project-id"
              placeholder="abcdefghijklmnopqrst"
              value={selectedProjectId}
              onChange={(e) => handleManualProjectId(e.target.value)}
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="manual-anon-key">Supabase Anon Key</Label>
            <Input
              id="manual-anon-key"
              type="password"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              value={selectedAnonKey}
              onChange={(e) => handleManualAnonKey(e.target.value)}
              className="mt-2"
            />
            <p className="text-xs text-gray-500 mt-1">
              Zu finden in: Supabase Dashboard → Settings → API
            </p>
          </div>
        </>
      )}

      {selectedProjectId && (
        <div className="flex items-center gap-2 text-xs text-gray-500 p-3 bg-gray-50 rounded">
          <ExternalLink className="w-3 h-3" />
          <a
            href={`https://supabase.com/dashboard/project/${selectedProjectId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[rgb(3,255,163)]"
          >
            Projekt im Supabase Dashboard öffnen
          </a>
        </div>
      )}
    </div>
  );
}