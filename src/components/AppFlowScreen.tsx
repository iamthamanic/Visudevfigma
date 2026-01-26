import { useState, useEffect } from 'react';
import { UIElement, FlowNode, FlowEdge, Layer } from '../types';
import { FlowGraph } from './FlowGraph';
import { NodeCard } from './NodeCard';
import { LayerFilter } from './LayerFilter';
import { SitemapFlowView } from './SitemapFlowView';
import { ScreenDetailView } from './ScreenDetailView';
import { ScanButton } from './ScanButton';
import { Maximize2, Minimize2, AlertCircle, Code2, Loader2, RefreshCw } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { useProject } from '../contexts/ProjectContext';

interface AppFlowScreenProps {
  projectId: string;
  githubRepo?: string;
  githubBranch?: string;
  githubToken?: string;
  deployedUrl?: string;
}

export function AppFlowScreen({ 
  projectId,
  githubRepo,
  githubBranch,
  githubToken,
  deployedUrl
}: AppFlowScreenProps) {
  console.log('[AppFlowScreen] 🔍 RENDER with props:', {
    projectId,
    githubRepo: githubRepo || 'UNDEFINED!!!',
    githubBranch: githubBranch || 'UNDEFINED!!!',
    hasToken: !!githubToken,
    tokenPreview: githubToken ? githubToken.slice(0, 10) + '...' : 'UNDEFINED!!!'
  });

  const [selectedElement, setSelectedElement] = useState<UIElement | null>(null);
  const [selectedNode, setSelectedNode] = useState<FlowNode | null>(null);
  const [selectedLayers, setSelectedLayers] = useState<Set<Layer>>(
    new Set(['frontend', 'compute', 'data', 'external', 'policies'])
  );
  const [isPreviewExpanded, setIsPreviewExpanded] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [analyzedFlows, setAnalyzedFlows] = useState<any[]>([]);
  const [screenshotStatus, setScreenshotStatus] = useState<'idle' | 'pending' | 'done'>('idle');

  const handleToggleLayer = (layer: Layer) => {
    const newLayers = new Set(selectedLayers);
    if (newLayers.has(layer)) {
      newLayers.delete(layer);
    } else {
      newLayers.add(layer);
    }
    setSelectedLayers(newLayers);
  };

  // Get flow for selected element
  const getFlowForElement = (element: UIElement | null): { nodes: FlowNode[]; edges: FlowEdge[] } => {
    if (!element) return { nodes: [], edges: [] };

    const entryNode = allNodes.find(n => n.id === element.entryStep);
    if (!entryNode) return { nodes: [], edges: [] };

    const flowNodeIds = new Set<string>([entryNode.id]);
    const flowEdges: FlowEdge[] = [];
    
    const queue = [entryNode.id];
    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const outgoingEdges = allEdges.filter(e => e.source === currentId);
      
      for (const edge of outgoingEdges) {
        if (!flowNodeIds.has(edge.target)) {
          flowNodeIds.add(edge.target);
          queue.push(edge.target);
        }
        flowEdges.push(edge);
      }
    }

    const flowNodes = allNodes.filter(n => flowNodeIds.has(n.id));
    
    return { nodes: flowNodes, edges: flowEdges };
  };

  const { nodes: flowNodes, edges: flowEdges } = getFlowForElement(selectedElement);

  // Analyze repository code
  const analyzeCode = async () => {
    if (!githubRepo || !githubBranch || !githubToken) {
      alert('GitHub Repository-Daten fehlen. Bitte konfigurieren Sie das Projekt.');
      return;
    }

    setIsAnalyzing(true);
    console.log('[VisuDEV] Starting code analysis for', githubRepo, '@', githubBranch);
    
    const analyzeUrl = `https://${projectId}.supabase.co/functions/v1/visudev-analyzer/analyze`;
    console.log('[VisuDEV] 🔗 Edge Function URL:', analyzeUrl);
    console.log('[VisuDEV] 📦 Request payload:', { repo: githubRepo, branch: githubBranch, hasToken: !!githubToken });

    try {
      const response = await fetch(
        analyzeUrl,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`
          },
          body: JSON.stringify({
            access_token: githubToken,
            repo: githubRepo,
            branch: githubBranch
          })
        }
      );
      
      console.log('[VisuDEV] 📡 Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[VisuDEV] ❌ Error response:', errorText);
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText };
        }
        
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('[VisuDEV] ✓ Analysis complete!', result.data);
      console.log('[VisuDEV] 📊 Flows array:', result.data.flows);
      console.log('[VisuDEV] 📊 Flows length:', result.data.flows?.length || 0);
      
      setAnalysisResult(result.data);
      setAnalyzedFlows(result.data.flows || []);
      
      console.log('[VisuDEV] 📊 State updated - should re-render now!');
      
      alert(`✓ Code analysiert!\n\n${result.data.flowsCount} Flows in ${result.data.filesAnalyzed} Dateien gefunden.`);
      
      // STEP 2: Trigger screenshot capture if we have screens AND deployed URL
      if (deployedUrl && result.data.screens && result.data.screens.length > 0 && result.data.commitSha) {
        console.log('[VisuDEV] 📸 Starting screenshot capture...');
        console.log('[VisuDEV] 🌐 Deployed URL:', deployedUrl);
        setScreenshotStatus('pending');
        
        const screenshotUrl = `https://${projectId}.supabase.co/functions/v1/visudev-screenshots/capture`;
        
        try {
          const screenshotResponse = await fetch(screenshotUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${publicAnonKey}`
            },
            body: JSON.stringify({
              deployedUrl: deployedUrl,
              repo: githubRepo,
              commitSha: result.data.commitSha,
              routePrefix: undefined, // TODO: Make configurable per project
              screens: result.data.screens.map((s: any) => ({
                id: s.id,
                path: s.path
              }))
            })
          });
          
          if (screenshotResponse.ok) {
            const screenshotResult = await screenshotResponse.json();
            console.log('[VisuDEV] ✓ Screenshots captured!', screenshotResult);
            
            // Log any failures
            screenshotResult.screenshots.forEach((shot: any) => {
              if (shot.status === 'failed') {
                console.error(`[VisuDEV] 📸 Screenshot failed for ${shot.screenId}:`, shot.error);
              }
            });
            
            // Merge screenshot URLs back into screens
            const screenshotsById = new Map(
              screenshotResult.screenshots.map((sr: any) => [sr.screenId, sr])
            );
            
            const updatedScreens = result.data.screens.map((screen: any) => {
              const shot = screenshotsById.get(screen.id);
              if (shot) {
                return {
                  ...screen,
                  screenshotUrl: shot.screenshotUrl,
                  screenshotStatus: shot.status,
                  lastScreenshotCommit: result.data.commitSha
                };
              }
              return screen;
            });
            
            // Update analysis result with screenshots
            setAnalysisResult({ ...result.data, screens: updatedScreens });
            setScreenshotStatus('done');
          } else {
            console.error('[VisuDEV] Screenshot capture failed:', await screenshotResponse.text());
            setScreenshotStatus('idle');
          }
        } catch (screenshotError) {
          console.error('[VisuDEV] Screenshot error:', screenshotError);
          setScreenshotStatus('idle');
        }
      }
    } catch (error) {
      console.error('[VisuDEV] Analysis error:', error);
      alert('Fehler bei der Code-Analyse: ' + error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Show empty state if no data
  if (uiElements.length === 0 || allNodes.length === 0) {
    // Check if we have analyzed flows AND screens to display
    if (analyzedFlows.length > 0 && analysisResult) {
      // If we have screens, show sitemap view
      if (analysisResult.screens && analysisResult.screens.length > 0) {
        return (
          <SitemapFlowView 
            screens={analysisResult.screens}
            flows={analyzedFlows}
            framework={analysisResult.framework}
          />
        );
      }
      
      // Otherwise show the old flows list view
      return (
        <div className="h-full flex flex-col bg-white">
          {/* Header */}
          <div className="border-b border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl mb-2">Code Flows</h2>
                <p className="text-sm text-gray-600">
                  {analyzedFlows.length} Flows in {analysisResult?.filesAnalyzed || 0} Dateien gefunden
                </p>
              </div>
              <div className="text-sm text-gray-600">
                Repository: <code className="bg-gray-100 px-2 py-1 rounded">{githubRepo}</code>
                {githubBranch && <> @ <code className="bg-gray-100 px-2 py-1 rounded">{githubBranch}</code></>}
              </div>
            </div>
          </div>

          {/* Flows List */}
          <div className="flex-1 overflow-auto p-6">
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 gap-4">
                {analyzedFlows.map((flow, index) => (
                  <div 
                    key={index}
                    className="border border-gray-200 rounded-lg p-4 hover:border-primary transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      {/* Flow Type Color Indicator */}
                      <div 
                        className="w-3 h-3 rounded-full mt-1.5 flex-shrink-0"
                        style={{ backgroundColor: flow.color }}
                      />
                      
                      <div className="flex-1 min-w-0">
                        {/* Flow Name */}
                        <h3 className="font-medium mb-1">{flow.name}</h3>
                        
                        {/* Flow Type Badge */}
                        <div className="inline-block px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600 mb-2">
                          {flow.type}
                        </div>
                        
                        {/* File Path */}
                        <p className="text-sm text-gray-600 mb-2">
                          📄 {flow.file}:{flow.line}
                        </p>
                        
                        {/* Code Preview */}
                        <pre className="text-xs bg-gray-50 p-3 rounded border border-gray-200 overflow-x-auto">
                          <code>{flow.code}</code>
                        </pre>
                        
                        {/* Calls Info */}
                        {flow.calls && flow.calls.length > 0 && (
                          <p className="text-xs text-gray-500 mt-2">
                            Calls: {flow.calls.length} functions
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    // Original empty state
    return (
      <div className="h-full flex items-center justify-center bg-white">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            {isAnalyzing ? (
              <Loader2 className="w-10 h-10 text-primary animate-spin" />
            ) : (
              <Code2 className="w-10 h-10 text-gray-400" />
            )}
          </div>
          <h2 className="text-xl mb-2">
            {isAnalyzing ? 'Code wird analysiert...' : 'Keine Flow-Daten'}
          </h2>
          <p className="text-gray-600 mb-6">
            {isAnalyzing ? (
              <>Repository wird gescannt und Code-Flows werden extrahiert...</>
            ) : githubRepo ? (
              <>Analysieren Sie Ihr GitHub-Repository um Execution Flows zu visualisieren</>
            ) : (
              <>Verbinden Sie ein GitHub-Repository um zu starten</>
            )}
          </p>
          
          {analysisResult && (
            <div className="mb-6 p-4 bg-primary/10 rounded-lg">
              <p className="text-sm text-gray-700">
                ✓ Analyse abgeschlossen!
              </p>
              <p className="text-xs text-gray-600 mt-1">
                {analysisResult.flowsCount} Flows in {analysisResult.filesAnalyzed} Dateien gefunden
              </p>
            </div>
          )}
          
          {githubRepo && githubBranch && githubToken ? (
            <button 
              onClick={analyzeCode}
              disabled={isAnalyzing}
              className="px-6 py-3 bg-primary text-black rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analysiere Code...
                </>
              ) : (
                <>
                  <Code2 className="w-4 h-4" />
                  Code analysieren
                </>
              )}
            </button>
          ) : (
            <button className="px-6 py-3 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed">
              Repository verbinden
            </button>
          )}
          
          {githubRepo && (
            <p className="text-xs text-gray-500 mt-4">
              Repository: <code className="bg-gray-100 px-2 py-1 rounded">{githubRepo}</code>
              {githubBranch && <> @ <code className="bg-gray-100 px-2 py-1 rounded">{githubBranch}</code></>}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex bg-white">
      {/* Left: Preview */}
      <div
        className={`border-r border-gray-200 flex flex-col transition-all ${
          isPreviewExpanded ? 'w-full' : 'w-1/2'
        }`}
      >
        {/* Preview Header */}
        <div className="border-b border-gray-200 p-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h3 className="mb-1">Live Preview</h3>
              <p className="text-sm text-gray-600">
                Klicken Sie auf UI-Elemente um deren Flow zu visualisieren
              </p>
            </div>
            <ScanButton scanType="appflow" label="Repo scannen" />
          </div>
          <button
            onClick={() => setIsPreviewExpanded(!isPreviewExpanded)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title={isPreviewExpanded ? 'Flow anzeigen' : 'Preview erweitern'}
          >
            {isPreviewExpanded ? (
              <Minimize2 className="w-5 h-5" />
            ) : (
              <Maximize2 className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* UI Elements Selector */}
        {!isPreviewExpanded && (
          <div className="border-b border-gray-200 p-6">
            <div className="text-sm text-gray-600 mb-3">Aktives UI-Element:</div>
            <div className="flex gap-2 flex-wrap">
              {uiElements.map(element => (
                <button
                  key={element.id}
                  onClick={() => {
                    setSelectedElement(element);
                    setSelectedNode(null);
                  }}
                  className={`px-4 py-2 rounded-lg border transition-all ${
                    selectedElement?.id === element.id
                      ? 'border-primary bg-primary/10 text-black'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  <code className="text-sm">{element.selector}</code>
                  <span className="text-xs text-gray-500 ml-2">{element.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Preview Frame */}
        <div className="flex-1 bg-gray-50 p-6 overflow-auto">
          {previewUrl ? (
            <iframe
              src={previewUrl}
              className="w-full h-full bg-white rounded-lg shadow-sm border border-gray-200"
              title="App Preview"
            />
          ) : (
            <div className="h-full flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg bg-white">
              <div className="text-center text-gray-500">
                <div className="mb-4 text-6xl">📱</div>
                <p className="mb-2">App Preview</p>
                <p className="text-sm">
                  Preview-URL wird hier eingebettet
                </p>
                {selectedElement && (
                  <div className="mt-6 p-4 bg-primary/10 rounded-lg inline-block">
                    <p className="text-sm text-gray-700 mb-2">Simulierter Klick:</p>
                    <code className="text-lg">{selectedElement.selector}</code>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right: Flow Graph + Inspector */}
      {!isPreviewExpanded && (
        <div className="w-1/2 flex flex-col">
          {/* Flow Header */}
          <div className="border-b border-gray-200 p-6">
            <h3 className="mb-4">Execution Flow</h3>
            <LayerFilter
              selectedLayers={selectedLayers}
              onToggleLayer={handleToggleLayer}
            />
          </div>

          <div className="flex-1 flex overflow-hidden">
            {/* Flow Graph */}
            <div className="w-1/2 border-r border-gray-200 overflow-auto p-6">
              {selectedElement ? (
                <FlowGraph
                  nodes={flowNodes}
                  edges={flowEdges}
                  selectedNode={selectedNode}
                  onSelectNode={setSelectedNode}
                  selectedLayers={selectedLayers}
                />
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <p>Wählen Sie ein UI-Element</p>
                </div>
              )}
            </div>

            {/* Inspector */}
            <div className="w-1/2 overflow-auto p-6 bg-gray-50">
              {selectedNode ? (
                <NodeCard node={selectedNode} />
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <p>Wählen Sie einen Node</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}