import { useState } from 'react';
import { FlowNode, FlowEdge } from '../types';
import { getLayerColor, getKindIcon } from '../utils';
import { ExternalLink, Search } from 'lucide-react';
import { ScanButton } from './ScanButton';

interface BlueprintProps {
  nodes: FlowNode[];
  edges: FlowEdge[];
}

export function Blueprint({ nodes, edges }: BlueprintProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNode, setSelectedNode] = useState<FlowNode | null>(null);

  // Filter nodes by search
  const filteredNodes = nodes.filter(node =>
    node.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    node.file_path?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group nodes by kind
  const groupedNodes = filteredNodes.reduce((acc, node) => {
    if (!acc[node.kind]) acc[node.kind] = [];
    acc[node.kind].push(node);
    return acc;
  }, {} as Record<string, FlowNode[]>);

  // Get connections for a node
  const getConnections = (nodeId: string) => {
    const outgoing = edges.filter(e => e.source === nodeId);
    const incoming = edges.filter(e => e.target === nodeId);
    return { outgoing, incoming };
  };

  return (
    <div className="h-full flex flex-col">
      {/* Search */}
      <div className="p-4 border-b flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search components, routes, functions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <ScanButton scanType="blueprint" label="Code scannen" />
      </div>

      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-2 gap-4 p-4">
          {/* Node Groups */}
          <div className="space-y-6">
            <h3 className="text-sm text-gray-500 uppercase tracking-wide">Code Graph</h3>
            
            {Object.entries(groupedNodes).map(([kind, kindNodes]) => (
              <div key={kind} className="space-y-2">
                <h4 className="flex items-center gap-2 text-sm">
                  <span>{getKindIcon(kind as any)}</span>
                  <span className="capitalize">{kind}</span>
                  <span className="text-gray-400">({kindNodes.length})</span>
                </h4>
                
                <div className="space-y-1">
                  {kindNodes.map(node => {
                    const isSelected = selectedNode?.id === node.id;
                    const { outgoing, incoming } = getConnections(node.id);
                    const layerColor = getLayerColor(node.layer);

                    return (
                      <button
                        key={node.id}
                        onClick={() => setSelectedNode(isSelected ? null : node)}
                        className="w-full text-left px-3 py-2 rounded-lg border transition-all hover:shadow-md"
                        style={{
                          borderColor: isSelected ? layerColor : 'rgb(229, 231, 235)',
                          backgroundColor: isSelected ? `${layerColor}10` : 'white'
                        }}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm truncate">{node.title}</span>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            {incoming.length > 0 && <span>↓{incoming.length}</span>}
                            {outgoing.length > 0 && <span>↑{outgoing.length}</span>}
                          </div>
                        </div>
                        {node.file_path && (
                          <code className="text-xs text-gray-500 truncate block mt-1">
                            {node.file_path}
                          </code>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {filteredNodes.length === 0 && (
              <p className="text-gray-500 text-center py-8">No nodes found</p>
            )}
          </div>

          {/* Detail Panel */}
          <div className="sticky top-0">
            {selectedNode ? (
              <div className="border rounded-lg p-4 space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{getKindIcon(selectedNode.kind)}</span>
                    <h3>{selectedNode.title}</h3>
                  </div>
                  <p className="text-sm text-gray-600">{selectedNode.description}</p>
                </div>

                {selectedNode.file_path && (
                  <div>
                    <h4 className="text-sm text-gray-500 mb-1">File</h4>
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded block">
                      {selectedNode.file_path}
                      {selectedNode.start_line && `:${selectedNode.start_line}`}
                    </code>
                  </div>
                )}

                {selectedNode.code_snippet && (
                  <div>
                    <h4 className="text-sm text-gray-500 mb-1">Code</h4>
                    <div className="bg-gray-900 text-gray-100 p-3 rounded-md overflow-x-auto">
                      <pre className="text-xs">
                        <code>{selectedNode.code_snippet}</code>
                      </pre>
                    </div>
                  </div>
                )}

                {(() => {
                  const { outgoing, incoming } = getConnections(selectedNode.id);
                  return (
                    <div>
                      <h4 className="text-sm text-gray-500 mb-2">Connections</h4>
                      
                      {incoming.length > 0 && (
                        <div className="mb-3">
                          <div className="text-xs text-gray-500 mb-1">Incoming ({incoming.length})</div>
                          <div className="space-y-1">
                            {incoming.map(edge => {
                              const sourceNode = nodes.find(n => n.id === edge.source);
                              return sourceNode ? (
                                <div key={edge.id} className="text-xs bg-gray-50 px-2 py-1 rounded">
                                  ← {sourceNode.title} <span className="text-gray-400">({edge.kind})</span>
                                </div>
                              ) : null;
                            })}
                          </div>
                        </div>
                      )}

                      {outgoing.length > 0 && (
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Outgoing ({outgoing.length})</div>
                          <div className="space-y-1">
                            {outgoing.map(edge => {
                              const targetNode = nodes.find(n => n.id === edge.target);
                              return targetNode ? (
                                <div key={edge.id} className="text-xs bg-gray-50 px-2 py-1 rounded">
                                  → {targetNode.title} <span className="text-gray-400">({edge.kind})</span>
                                </div>
                              ) : null;
                            })}
                          </div>
                        </div>
                      )}

                      {incoming.length === 0 && outgoing.length === 0 && (
                        <p className="text-xs text-gray-400">No connections</p>
                      )}
                    </div>
                  );
                })()}

                <a
                  href={selectedNode.links.github_permalink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open in GitHub
                </a>
              </div>
            ) : (
              <div className="border rounded-lg p-8 text-center text-gray-500">
                <p>Select a node to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}