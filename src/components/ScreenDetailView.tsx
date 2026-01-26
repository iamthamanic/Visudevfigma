/**
 * ScreenDetailView Component
 * 
 * Displays detailed information about a screen including:
 * - Screen metadata
 * - Associated flows
 * - LIVE PREVIEW of the screen using iframe
 */

import React, { useState } from 'react';
import { X, Code, FileText, GitBranch, ExternalLink, Eye, Code2 } from 'lucide-react';
import { CodePreview } from './CodePreview';

interface Screen {
  id: string;
  name: string;
  path: string;
  filePath?: string;
  type?: 'page' | 'screen' | 'view';
  flows?: string[];
  navigatesTo?: string[];
  framework?: string;
  componentCode?: string;
  screenshotUrl?: string;           // NEW: Screenshot from deployed URL
  screenshotStatus?: 'none' | 'pending' | 'ok' | 'failed';
  lastScreenshotCommit?: string;
  depth?: number;
}

interface CodeFlow {
  id: string;
  type: 'ui-event' | 'function-call' | 'api-call' | 'db-query' | 'navigation' | 'api';
  name: string;
  file?: string;
  line?: number;
  code?: string;
  calls?: string[];
  color?: string;
  source?: string;
  target?: string;
  trigger?: string;
  description?: string;
}

interface ScreenDetailViewProps {
  screen: Screen;
  flows: CodeFlow[];
  onClose: () => void;
  onNavigateToScreen?: (screenPath: string) => void;
}

export function ScreenDetailView({ screen, flows, onClose, onNavigateToScreen }: ScreenDetailViewProps) {
  console.log('[ScreenDetailView] Rendering screen:', screen.name);
  console.log('[ScreenDetailView] Component code available:', !!screen.componentCode);
  console.log('[ScreenDetailView] Flows count:', flows.length);

  // Get flows for this screen (safe access)
  const screenFlows = flows.filter(flow => screen.flows?.includes(flow.id));
  
  // Group flows by type
  const flowsByType = {
    'ui-event': screenFlows.filter(f => f.type === 'ui-event'),
    'api-call': screenFlows.filter(f => f.type === 'api-call'),
    'db-query': screenFlows.filter(f => f.type === 'db-query'),
    'function-call': screenFlows.filter(f => f.type === 'function-call'),
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#0a0a0a] border border-white/10 rounded-lg w-full max-w-7xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-semibold text-white">{screen.name}</h2>
              <span className="px-2 py-1 rounded text-xs bg-[#03ffa3]/10 text-[#03ffa3] border border-[#03ffa3]/20">
                {screen.type}
              </span>
              <span className="px-2 py-1 rounded text-xs bg-white/5 text-white/60 border border-white/10">
                {screen.framework}
              </span>
            </div>
            <div className="flex items-center gap-4 mt-2 text-sm text-white/60">
              <div className="flex items-center gap-1">
                <FileText className="w-4 h-4" />
                <span>{screen.filePath}</span>
              </div>
              <div className="flex items-center gap-1">
                <Code className="w-4 h-4" />
                <span>{screen.path}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-white/60" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar: Flows */}
          <div className="w-80 border-r border-white/10 overflow-y-auto p-6 space-y-6">
            {/* Navigation Links */}
            {(screen.navigatesTo?.length ?? 0) > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-white/80 mb-3 flex items-center gap-2">
                  <GitBranch className="w-4 h-4" />
                  Navigates To ({screen.navigatesTo?.length ?? 0})
                </h3>
                <div className="space-y-2">
                  {screen.navigatesTo?.map((path, idx) => (
                    <button
                      key={idx}
                      onClick={() => onNavigateToScreen?.(path)}
                      className="w-full text-left px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#03ffa3]/30 transition-all text-sm text-white/80 flex items-center gap-2"
                    >
                      <ExternalLink className="w-3 h-3 text-[#03ffa3]" />
                      {path}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Flows by Type */}
            {Object.entries(flowsByType).map(([type, typeFlows]) => {
              if (typeFlows.length === 0) return null;
              
              const typeConfig = {
                'ui-event': { label: 'UI Events', color: '#03ffa3' },
                'api-call': { label: 'API Calls', color: '#3b82f6' },
                'db-query': { label: 'Database Queries', color: '#ef4444' },
                'function-call': { label: 'Functions', color: '#8b5cf6' },
              }[type];

              return (
                <div key={type}>
                  <h3 className="text-sm font-semibold text-white/80 mb-3">
                    {typeConfig?.label} ({typeFlows.length})
                  </h3>
                  <div className="space-y-2">
                    {typeFlows.map(flow => (
                      <div
                        key={flow.id}
                        className="p-3 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition-colors"
                      >
                        <div className="flex items-start gap-2">
                          <div
                            className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                            style={{ backgroundColor: flow.color }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-white/90 mb-1">
                              {flow.name}
                            </div>
                            <div className="text-xs text-white/60 font-mono mb-2">
                              Line {flow.line}
                            </div>
                            <div className="text-xs text-white/50 font-mono bg-black/30 p-2 rounded overflow-x-auto">
                              {flow.code}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {screenFlows.length === 0 && (
              <div className="text-center py-8 text-white/40 text-sm">
                No flows detected in this screen
              </div>
            )}
          </div>

          {/* Right Side: Live Preview */}
          <div className="flex-1 overflow-hidden">
            {screen.screenshotUrl ? (
              // Show screenshot if available
              <div className="h-full overflow-auto p-6 bg-[#050505]">
                <img 
                    src={screen.screenshotUrl} 
                    alt={screen.name}
                    className="w-full h-auto rounded-lg border border-white/10 shadow-2xl"
                />
                <div className="mt-4 flex items-center gap-2 text-xs text-white/40">
                  <Eye className="w-3 h-3" />
                  <span>Screenshot from deployed URL</span>
                  {screen.lastScreenshotCommit && (
                    <span className="ml-2 font-mono">@ {screen.lastScreenshotCommit.slice(0, 7)}</span>
                  )}
                </div>
              </div>
            ) : screen.componentCode ? (
              <CodePreview code={screen.componentCode} className="h-full" />
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <Code className="w-16 h-16 text-white/20 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white/60 mb-2">
                    No Preview Available
                  </h3>
                  <p className="text-sm text-white/40">
                    Add a deployed_url to capture screenshots
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}