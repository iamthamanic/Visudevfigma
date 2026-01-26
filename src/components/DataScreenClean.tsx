import { useState, useEffect } from 'react';
import { Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { useVisudev } from '../lib/visudev/store';

interface DataScreenNewProps {
  projectId: string;
}

export function DataScreenNew({ projectId }: DataScreenNewProps) {
  const { activeProject, scanStatuses, startScan } = useVisudev();
  const [isRescan, setIsRescan] = useState(false);

  // Auto-start scan if needed
  useEffect(() => {
    if (activeProject && scanStatuses.data.status === 'idle') {
      handleRescan();
    }
  }, [activeProject, projectId]);

  const handleRescan = async () => {
    console.log('🔄 [Data] Starting scan...');
    setIsRescan(true);
    try {
      await startScan('data');
      console.log('✅ [Data] Scan complete');
    } catch (error) {
      console.error('❌ [Data] Error:', error);
    } finally {
      setIsRescan(false);
    }
  };

  const isScanning = scanStatuses.data.status === 'running' || isRescan;
  const hasError = scanStatuses.data.status === 'failed';

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl text-gray-900">Data</h1>
            <p className="text-sm text-gray-500 mt-1">
              Datenbank-Schema • {activeProject?.name}
            </p>
          </div>
          <button
            onClick={handleRescan}
            disabled={isScanning}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50"
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
      </div>

      <div className="flex-1 overflow-auto p-6">
        {isScanning ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Schema wird analysiert...</p>
            </div>
          </div>
        ) : hasError ? (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-gray-600">Fehler bei der Schema-Analyse</p>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">Data Schema Feature wird in einer späteren Version verfügbar sein</p>
          </div>
        )}
      </div>
    </div>
  );
}
