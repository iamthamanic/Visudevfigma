import { useState, useEffect } from 'react';
import { Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { useVisudev } from '../lib/visudev/store';
import { SitemapFlowView } from './SitemapFlowView';

interface AppFlowScreenNewProps {
  projectId: string;
  githubRepo?: string;
  githubBranch?: string;
  githubToken?: string;
  deployedUrl?: string;
}

export function AppFlowScreenNew({ 
  projectId,
  githubRepo,
  githubBranch,
  githubToken,
  deployedUrl
}: AppFlowScreenNewProps) {
  const { activeProject, scanStatuses, startScan } = useVisudev();
  const [isRescan, setIsRescan] = useState(false);

  // ✅ Auto-scan when no screens found
  useEffect(() => {
    if (activeProject && activeProject.screens.length === 0 && scanStatuses.appflow.status === 'idle') {
      console.log('🔄 [AppFlow] No screens found, starting initial scan');
      handleRescan();
    }
  }, [activeProject, projectId]);

  const handleRescan = async () => {
    console.log('🔄 [AppFlow] Starting rescan...');
    setIsRescan(true);
    try {
      await startScan('appflow');
      console.log('✅ [AppFlow] Rescan complete');
    } catch (error) {
      console.error('❌ [AppFlow] Error during rescan:', error);
    } finally {
      setIsRescan(false);
    }
  };

  if (!activeProject) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-gray-500">Kein Projekt ausgewählt</p>
      </div>
    );
  }

  const isScanning = scanStatuses.appflow.status === 'running' || isRescan;
  const hasError = scanStatuses.appflow.status === 'failed';
  const hasData = activeProject.screens.length > 0;

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl text-gray-900">App Flow</h1>
            <p className="text-sm text-gray-500 mt-1">
              {activeProject.name} • {activeProject.screens.length} Screens • {activeProject.flows.length} Flows
            </p>
          </div>
          <button
            onClick={handleRescan}
            disabled={isScanning}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isScanning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analysiere...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Neu analysieren
              </>
            )}
          </button>
        </div>

        {/* Status Bar */}
        {isScanning && (
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
            <div>
              <p className="text-sm text-blue-900">
                Code wird analysiert...
              </p>
              <p className="text-xs text-blue-700 mt-1">
                Repo: {githubRepo || 'unknown'} @ {githubBranch || 'main'}
              </p>
            </div>
          </div>
        )}

        {hasError && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600" />
            <div>
              <p className="text-sm text-red-900">Fehler bei der Analyse</p>
              <p className="text-xs text-red-700 mt-1">
                {scanStatuses.appflow.error || 'Unbekannter Fehler'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {isScanning && !hasData ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Code wird analysiert...</p>
              <p className="text-sm text-gray-500 mt-2">
                Dies kann einige Sekunden dauern
              </p>
            </div>
          </div>
        ) : hasData ? (
          <SitemapFlowView
            screens={activeProject.screens}
            flows={activeProject.flows}
            deployedUrl={deployedUrl}
            onScreenshotGenerated={(screenId, url) => {
              console.log('Screenshot generated:', screenId, url);
            }}
          />
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 mb-2">Keine Daten vorhanden</p>
              <p className="text-sm text-gray-500 mb-4">
                Starte eine Analyse um Screens und Flows zu sehen
              </p>
              <button
                onClick={handleRescan}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 mx-auto"
              >
                <RefreshCw className="w-4 h-4" />
                Jetzt analysieren
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}