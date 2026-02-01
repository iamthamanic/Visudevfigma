import { useState, useEffect, useCallback } from "react";
import { Loader2, Image as ImageIcon, AlertCircle } from "lucide-react";
import { captureScreenshots } from "../lib/services/screenshots";
import styles from "./ScreenshotPreview.module.css";

interface ScreenshotPreviewProps {
  projectData: {
    id: string;
    deployed_url?: string;
  };
  screen: {
    id: string;
    name: string;
    path: string;
  };
}

export function ScreenshotPreview({ projectData, screen }: ScreenshotPreviewProps) {
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const captureScreenshot = useCallback(async () => {
    if (!projectData.deployed_url) {
      setError("Keine deployed URL konfiguriert");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await captureScreenshots({
        deployedUrl: projectData.deployed_url,
        repo: `project-${projectData.id}`,
        screens: [
          {
            id: screen.id,
            path: screen.path,
          },
        ],
      });

      if (result.screenshots && result.screenshots.length > 0) {
        const screenshot = result.screenshots[0];
        if (screenshot.status === "ok" && screenshot.screenshotUrl) {
          setScreenshotUrl(screenshot.screenshotUrl);
        } else {
          setError(screenshot.error || "Screenshot capture failed");
        }
      } else {
        setError("No screenshot returned");
      }
    } catch (err) {
      console.error("[ScreenshotPreview] Error capturing screenshot:", err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  }, [projectData.deployed_url, projectData.id, screen.id, screen.path]);

  useEffect(() => {
    if (projectData.deployed_url) {
      void captureScreenshot();
    }
  }, [projectData.deployed_url, captureScreenshot]);

  // No deployed URL - show placeholder
  if (!projectData.deployed_url) {
    return (
      <div className={styles.card}>
        <ImageIcon className={styles.iconMuted} />
        <p className={styles.titleMuted}>Keine deployed URL konfiguriert</p>
        <p className={styles.subtitleMuted}>
          Fügen Sie eine deployed URL im Projekt-Dialog hinzu, um echte Screenshots zu sehen
        </p>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className={styles.card}>
        <Loader2 className={styles.spinner} />
        <p className={styles.titleMuted}>Screenshot wird generiert...</p>
        <p className={styles.subtitleMuted}>
          {screen.name} • {screen.path}
        </p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`${styles.card} ${styles.errorCard}`}>
        <AlertCircle className={`${styles.iconMuted} ${styles.iconError}`} />
        <p className={`${styles.titleMuted} ${styles.titleError}`}>Screenshot-Fehler</p>
        <p className={`${styles.subtitleMuted} ${styles.subtitleError}`}>{error}</p>
        <button onClick={captureScreenshot} type="button" className={styles.retryButton}>
          Erneut versuchen
        </button>
      </div>
    );
  }

  // Success - show screenshot
  if (screenshotUrl) {
    return (
      <div className={styles.previewCard}>
        <div className={styles.previewFrame}>
          <img
            src={screenshotUrl}
            alt={`Screenshot of ${screen.name}`}
            className={styles.previewImage}
          />
        </div>
        <div className={styles.previewMeta}>
          <p className={styles.previewTitle}>
            {screen.name} • {screen.path}
          </p>
          <p className={styles.previewUrl}>{projectData.deployed_url}</p>
        </div>
      </div>
    );
  }

  return null;
}
