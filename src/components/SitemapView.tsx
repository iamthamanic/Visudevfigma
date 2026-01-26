import { useState } from 'react';
import { ChevronRight, ChevronDown, FileCode, Zap, Database, Globe } from 'lucide-react';
import { IFrameScreenRenderer } from './IFrameScreenRenderer';
import { ScreenshotPreview } from './ScreenshotPreview';
import { useProject } from '../contexts/ProjectContext';

interface Screen {
  id: string;
  name: string;
  path: string;
  file: string;
  type: 'page' | 'screen' | 'view';
  flows: string[];
  navigatesTo: string[];
  framework: string;
  componentCode?: string; // NEW: Full component source code
}

interface CodeFlow {
  id: string;
  type: 'ui-event' | 'function-call' | 'api-call' | 'db-query';
  name: string;
  file: string;
  line: number;
  code: string;
  calls: string[];
  color: string;
}

interface SitemapViewProps {
  screens: Screen[];
  flows: CodeFlow[];
  framework?: {
    detected: string[];
    primary: string | null;
    confidence: number;
  };
}

export function SitemapView({ screens, flows, framework }: SitemapViewProps) {
  const { activeProject } = useProject();
  const [expandedScreens, setExpandedScreens] = useState<Set<string>>(new Set());
  const [selectedScreen, setSelectedScreen] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview'); // NEW: Toggle between preview and code

  const toggleScreen = (screenId: string) => {
    const newExpanded = new Set(expandedScreens);
    if (newExpanded.has(screenId)) {
      newExpanded.delete(screenId);
    } else {
      newExpanded.add(screenId);
    }
    setExpandedScreens(newExpanded);
  };

  const getFlowsForScreen = (screen: Screen): CodeFlow[] => {
    return flows.filter(flow => screen.flows.includes(flow.id));
  };

  const getFlowTypeIcon = (type: CodeFlow['type']) => {
    switch (type) {
      case 'ui-event':
        return <Zap className="w-4 h-4" style={{ color: '#03ffa3' }} />;
      case 'api-call':
        return <Globe className="w-4 h-4" style={{ color: '#3b82f6' }} />;
      case 'db-query':
        return <Database className="w-4 h-4" style={{ color: '#ef4444' }} />;
      case 'function-call':
        return <FileCode className="w-4 h-4" style={{ color: '#8b5cf6' }} />;
    }
  };

  // Group flows by type
  const getFlowStats = (screen: Screen) => {
    const screenFlows = getFlowsForScreen(screen);
    return {
      uiEvents: screenFlows.filter(f => f.type === 'ui-event').length,
      apiCalls: screenFlows.filter(f => f.type === 'api-call').length,
      dbQueries: screenFlows.filter(f => f.type === 'db-query').length,
      functions: screenFlows.filter(f => f.type === 'function-call').length,
      total: screenFlows.length
    };
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl mb-2">App Sitemap</h2>
            <p className="text-sm text-gray-600">
              {screens.length} Screens • {flows.length} Total Flows
            </p>
          </div>
          {framework?.primary && (
            <div className="flex items-center gap-2">
              <div className="px-3 py-1.5 bg-primary/10 rounded-lg">
                <span className="text-sm font-medium text-gray-700">
                  {framework.primary}
                </span>
              </div>
              <div className="text-xs text-gray-500">
                {Math.round(framework.confidence * 100)}% confidence
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sitemap Tree */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          {screens.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Keine Screens gefunden</p>
              <p className="text-sm text-gray-400 mt-2">
                Das Framework konnte nicht automatisch erkannt werden
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {screens.map(screen => {
                const isExpanded = expandedScreens.has(screen.id);
                const isSelected = selectedScreen === screen.id;
                const stats = getFlowStats(screen);
                const screenFlows = getFlowsForScreen(screen);

                return (
                  <div key={screen.id} className="border border-gray-200 rounded-lg overflow-hidden">
                    {/* Screen Header */}
                    <button
                      onClick={() => {
                        toggleScreen(screen.id);
                        setSelectedScreen(screen.id);
                      }}
                      className={`w-full flex items-center gap-4 p-4 text-left transition-colors ${
                        isSelected ? 'bg-primary/5' : 'hover:bg-gray-50'
                      }`}
                    >
                      {/* Expand/Collapse Icon */}
                      <div className="flex-shrink-0">
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        )}
                      </div>

                      {/* Screen Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-medium">{screen.name}</h3>
                          <code className="text-xs bg-gray-100 px-2 py-0.5 rounded text-primary">
                            {screen.path}
                          </code>
                        </div>
                        <p className="text-xs text-gray-500">{screen.file}</p>
                      </div>

                      {/* Flow Stats */}
                      <div className="flex items-center gap-4 flex-shrink-0">
                        {stats.uiEvents > 0 && (
                          <div className="flex items-center gap-1.5">
                            <Zap className="w-4 h-4" style={{ color: '#03ffa3' }} />
                            <span className="text-sm text-gray-600">{stats.uiEvents}</span>
                          </div>
                        )}
                        {stats.apiCalls > 0 && (
                          <div className="flex items-center gap-1.5">
                            <Globe className="w-4 h-4" style={{ color: '#3b82f6' }} />
                            <span className="text-sm text-gray-600">{stats.apiCalls}</span>
                          </div>
                        )}
                        {stats.dbQueries > 0 && (
                          <div className="flex items-center gap-1.5">
                            <Database className="w-4 h-4" style={{ color: '#ef4444' }} />
                            <span className="text-sm text-gray-600">{stats.dbQueries}</span>
                          </div>
                        )}
                        <div className="text-sm text-gray-400">
                          {stats.total} total
                        </div>
                      </div>
                    </button>

                    {/* Screen Details (Expanded) */}
                    {isExpanded && (
                      <div className="border-t border-gray-200 bg-gray-50">
                        {/* Navigation Links */}
                        {screen.navigatesTo.length > 0 && (
                          <div className="px-4 py-3 border-b border-gray-200 bg-white">
                            <p className="text-xs text-gray-500 mb-2">Navigates To:</p>
                            <div className="flex flex-wrap gap-2">
                              {screen.navigatesTo.map((path, idx) => (
                                <code 
                                  key={idx}
                                  className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded"
                                >
                                  → {path}
                                </code>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Flows in this Screen */}
                        <div className="p-4 space-y-3">
                          {screenFlows.length === 0 ? (
                            <p className="text-sm text-gray-500">Keine Flows in diesem Screen</p>
                          ) : (
                            screenFlows.map(flow => (
                              <div 
                                key={flow.id}
                                className="bg-white border border-gray-200 rounded-lg p-3 hover:border-primary transition-colors"
                              >
                                <div className="flex items-start gap-3">
                                  {/* Flow Icon */}
                                  <div className="flex-shrink-0 mt-0.5">
                                    {getFlowTypeIcon(flow.type)}
                                  </div>

                                  {/* Flow Details */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h4 className="text-sm font-medium">{flow.name}</h4>
                                      <span className="text-xs text-gray-500">
                                        Line {flow.line}
                                      </span>
                                    </div>
                                    
                                    {/* Code Preview */}
                                    <pre className="text-xs bg-gray-50 p-2 rounded border border-gray-200 overflow-x-auto">
                                      <code className="text-gray-700">{flow.code}</code>
                                    </pre>

                                    {/* Calls */}
                                    {flow.calls && flow.calls.length > 0 && (
                                      <div className="mt-2 flex flex-wrap gap-1">
                                        {flow.calls.map((call, idx) => (
                                          <span 
                                            key={idx}
                                            className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded"
                                          >
                                            {call}()
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>

                        {/* Screenshot Preview - NEW */}
                        {activeProject && (
                          <div className="px-4 py-3 border-t border-gray-200 bg-white">
                            <p className="text-xs text-gray-500 mb-3">Live Screenshot</p>
                            <ScreenshotPreview
                              projectData={{
                                id: activeProject.id,
                                deployed_url: activeProject.deployed_url
                              }}
                              screen={{
                                id: screen.id,
                                name: screen.name,
                                path: screen.path
                              }}
                            />
                          </div>
                        )}

                        {/* Component Preview */}
                        {screen.componentCode && (
                          <div className="px-4 py-3 border-t border-gray-200 bg-white">
                            <p className="text-xs text-gray-500 mb-3">Code Preview (IFrame)</p>
                            <IFrameScreenRenderer 
                              code={screen.componentCode} 
                              screenName={screen.name}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}