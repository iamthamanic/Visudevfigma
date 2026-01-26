import { useState, useEffect } from 'react';
import { Loader2, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

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

  useEffect(() => {
    if (projectData.deployed_url) {
      captureScreenshot();
    }
  }, [projectData.deployed_url, screen.id]);

  const captureScreenshot = async () => {
    if (!projectData.deployed_url) {
      setError('Keine deployed URL konfiguriert');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log(`[ScreenshotPreview] Capturing screenshot for ${screen.name} at ${screen.path}`);

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/visudev-screenshots/capture`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`
          },
          body: JSON.stringify({
            deployedUrl: projectData.deployed_url,
            repo: `project-${projectData.id}`,
            screens: [{
              id: screen.id,
              path: screen.path
            }]
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Screenshot API error: ${response.status} - ${errorData}`);
      }

      const result = await response.json();
      console.log('[ScreenshotPreview] Capture result:', result);

      if (result.screenshots && result.screenshots.length > 0) {
        const screenshot = result.screenshots[0];
        if (screenshot.status === 'ok' && screenshot.screenshotUrl) {
          setScreenshotUrl(screenshot.screenshotUrl);
          console.log('[ScreenshotPreview] ✓ Screenshot captured:', screenshot.screenshotUrl);
        } else {
          setError(screenshot.error || 'Screenshot capture failed');
        }
      } else {
        setError('No screenshot returned');
      }
    } catch (err) {
      console.error('[ScreenshotPreview] Error capturing screenshot:', err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  };

  // No deployed URL - show placeholder
  if (!projectData.deployed_url) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-3" />
        <p className="text-sm text-gray-600 mb-1">
          Keine deployed URL konfiguriert
        </p>
        <p className="text-xs text-gray-500">
          Fügen Sie eine deployed URL im Projekt-Dialog hinzu, um echte Screenshots zu sehen
        </p>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto mb-3" />
        <p className="text-sm text-gray-600">
          Screenshot wird generiert...
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {screen.name} • {screen.path}
        </p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-3" />
        <p className="text-sm text-red-700 mb-1">
          Screenshot-Fehler
        </p>
        <p className="text-xs text-red-600">
          {error}
        </p>
        <button
          onClick={captureScreenshot}
          className="mt-3 text-xs text-red-700 hover:text-red-800 underline"
        >
          Erneut versuchen
        </button>
      </div>
    );
  }

  // Success - show screenshot
  if (screenshotUrl) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="aspect-video relative">
          <img 
            src={screenshotUrl} 
            alt={`Screenshot of ${screen.name}`}
            className="w-full h-full object-cover object-top"
          />
        </div>
        <div className="p-3 bg-gray-50 border-t border-gray-200">
          <p className="text-xs text-gray-600">
            {screen.name} • {screen.path}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {projectData.deployed_url}
          </p>
        </div>
      </div>
    );
  }

  return null;
}
