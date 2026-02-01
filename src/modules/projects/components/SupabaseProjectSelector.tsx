import { useState } from "react";
import { CheckCircle2, Database, ExternalLink, Key, Loader2 } from "lucide-react";
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
import type { SupabaseProject } from "../services/supabaseAuth";
import { fetchSupabaseProjects } from "../services/supabaseAuth";
import styles from "../styles/SupabaseProjectSelector.module.css";

interface SupabaseProjectSelectorProps {
  onSelect: (projectId: string, anonKey: string, managementToken: string) => void;
  initialProjectId?: string;
  initialAnonKey?: string;
}

export function SupabaseProjectSelector({
  onSelect,
  initialProjectId = "",
  initialAnonKey = "",
}: SupabaseProjectSelectorProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [projects, setProjects] = useState<SupabaseProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState(initialProjectId);
  const [selectedAnonKey, setSelectedAnonKey] = useState(initialAnonKey);
  const [managementToken, setManagementToken] = useState("");
  const [showTokenInput, setShowTokenInput] = useState(false);

  const handleValidateToken = async () => {
    if (!managementToken.trim()) {
      alert("Bitte geben Sie ein Management Token ein");
      return;
    }

    setIsLoading(true);
    try {
      const projectList = await fetchSupabaseProjects(managementToken);
      setProjects(projectList);
      setIsConnected(true);
      setShowTokenInput(false);
    } catch {
      alert("Ungültiges Management Token. Bitte überprüfen Sie Ihre Eingabe.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleProjectSelect = (projId: string) => {
    setSelectedProjectId(projId);
    onSelect(projId, selectedAnonKey, managementToken);
  };

  const handleAnonKeyChange = (key: string) => {
    setSelectedAnonKey(key);
    onSelect(selectedProjectId, key, managementToken);
  };

  const handleManualProjectId = (projId: string) => {
    setSelectedProjectId(projId);
    onSelect(projId, selectedAnonKey, "");
  };

  const handleManualAnonKey = (key: string) => {
    setSelectedAnonKey(key);
    onSelect(selectedProjectId, key, "");
  };

  return (
    <div className={styles.root}>
      <div className={styles.connectionCard}>
        <Database className={styles.connectionIcon} aria-hidden="true" />
        <div className={styles.connectionContent}>
          {isConnected ? (
            <div className={styles.connectionRow}>
              <CheckCircle2 className={styles.connectionSuccess} aria-hidden="true" />
              <p className={styles.connectionText}>
                Mit Supabase verbunden - {projects.length} Projekt(e) gefunden
              </p>
            </div>
          ) : (
            <p className={styles.connectionText}>Supabase Projekt verbinden</p>
          )}
        </div>
        {!isConnected && !showTokenInput && (
          <Button onClick={() => setShowTokenInput(true)} className={styles.connectButton}>
            <Key aria-hidden="true" />
            Verbinden
          </Button>
        )}
      </div>

      {showTokenInput && !isConnected && (
        <div className={styles.tokenPanel}>
          <div className={styles.tokenHint}>
            <ExternalLink className={styles.connectionIcon} aria-hidden="true" />
            <div>
              <p>
                Erstellen Sie ein <strong>Management API Token</strong> in Ihrem Supabase Dashboard:
              </p>
              <ol className={styles.tokenSteps}>
                <li>
                  Öffnen Sie{" "}
                  <a
                    href="https://supabase.com/dashboard/account/tokens"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.tokenLink}
                  >
                    supabase.com/dashboard/account/tokens
                  </a>
                </li>
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
              onChange={(event) => setManagementToken(event.target.value)}
              className={styles.inputSpacing}
            />
          </div>

          <div className={styles.actionRow}>
            <Button
              variant="outline"
              onClick={() => setShowTokenInput(false)}
              className={styles.actionButton}
            >
              Abbrechen
            </Button>
            <Button
              onClick={handleValidateToken}
              disabled={isLoading || !managementToken.trim()}
              className={styles.actionButton}
            >
              {isLoading ? (
                <>
                  <Loader2 className={styles.spinner} aria-hidden="true" />
                  Validiere...
                </>
              ) : (
                "Verbinden"
              )}
            </Button>
          </div>
        </div>
      )}

      {isConnected ? (
        <>
          {projects.length > 0 ? (
            <>
              <div className={styles.fieldGroup}>
                <Label htmlFor="project-select">Supabase Projekt auswählen</Label>
                <Select value={selectedProjectId} onValueChange={handleProjectSelect}>
                  <SelectTrigger className={styles.selectTriggerSpacing}>
                    <SelectValue placeholder="Projekt wählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((proj) => (
                      <SelectItem key={proj.id} value={proj.id}>
                        <div className={styles.connectionRow}>
                          <span>{proj.name}</span>
                          <span className={styles.helperText}>({proj.region})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className={styles.fieldGroup}>
                <Label htmlFor="anon-key">Anon Key (öffentlicher API-Schlüssel)</Label>
                <Input
                  id="anon-key"
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={selectedAnonKey}
                  onChange={(event) => handleAnonKeyChange(event.target.value)}
                  className={styles.inputSpacing}
                />
                <p className={styles.helperText}>
                  Zu finden in: Projekt Settings → API → anon public
                </p>
              </div>
            </>
          ) : null}
        </>
      ) : (
        <>
          <div className={styles.fieldGroup}>
            <Label htmlFor="manual-project-id">Oder manuell: Supabase Project ID</Label>
            <Input
              id="manual-project-id"
              placeholder="abcdefghijklmnopqrst"
              value={selectedProjectId}
              onChange={(event) => handleManualProjectId(event.target.value)}
              className={styles.inputSpacing}
            />
          </div>

          <div className={styles.fieldGroup}>
            <Label htmlFor="manual-anon-key">Supabase Anon Key</Label>
            <Input
              id="manual-anon-key"
              type="password"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              value={selectedAnonKey}
              onChange={(event) => handleManualAnonKey(event.target.value)}
              className={styles.inputSpacing}
            />
            <p className={styles.helperText}>Zu finden in: Supabase Dashboard → Settings → API</p>
          </div>
        </>
      )}

      {selectedProjectId && (
        <div className={styles.linkRow}>
          <ExternalLink aria-hidden="true" />
          <a
            href={`https://supabase.com/dashboard/project/${selectedProjectId}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Projekt im Supabase Dashboard öffnen
          </a>
        </div>
      )}
    </div>
  );
}
