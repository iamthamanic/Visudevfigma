import { useVisudev } from '../lib/visudev/store';
import { AlertCircle } from 'lucide-react';

interface LogsPanelNewProps {
  projectId: string;
}

export function LogsPanelNew({ projectId }: LogsPanelNewProps) {
  const { activeProject, scans } = useVisudev();

  // Get scans for current project
  const projectScans = scans.filter(s => s.projectId === projectId);

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div>
          <h1 className="text-2xl text-gray-900">Logs</h1>
          <p className="text-sm text-gray-500 mt-1">
            Scan History • {activeProject?.name}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {projectScans.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Keine Scans vorhanden</p>
            <p className="text-sm text-gray-400 mt-2">
              Führe eine Analyse durch um Scan-Logs zu sehen
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {projectScans.map((scan) => (
              <div key={scan.id} className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">
                      {scan.scanType.toUpperCase()}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      scan.status === 'completed' ? 'bg-green-100 text-green-700' :
                      scan.status === 'running' ? 'bg-blue-100 text-blue-700' :
                      scan.status === 'failed' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {scan.status}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(scan.startedAt).toLocaleString('de-DE')}
                  </div>
                </div>
                
                {scan.status === 'running' && (
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all" 
                        style={{ width: `${scan.progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{scan.progress}%</p>
                  </div>
                )}

                {scan.status === 'completed' && scan.result && (
                  <div className="mt-2 text-sm text-gray-600">
                    <p>✅ {scan.result.stats.totalScreens} Screens • {scan.result.stats.totalFlows} Flows</p>
                  </div>
                )}

                {scan.status === 'failed' && scan.errorMessage && (
                  <div className="mt-2 text-sm text-red-600">
                    <p>❌ {scan.errorMessage}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
