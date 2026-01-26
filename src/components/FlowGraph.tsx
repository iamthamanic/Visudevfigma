import { FlowNode, FlowEdge, Layer } from '../types';
import { getLayerColor, getKindIcon, formatDuration } from '../utils';
import { ChevronRight } from 'lucide-react';

interface FlowGraphProps {
  nodes: FlowNode[];
  edges: FlowEdge[];
  selectedNode: FlowNode | null;
  onSelectNode: (node: FlowNode) => void;
  selectedLayers: Set<Layer>;
}

export function FlowGraph({ nodes, edges, selectedNode, onSelectNode, selectedLayers }: FlowGraphProps) {
  // Filter nodes by selected layers
  const visibleNodes = nodes.filter(node => selectedLayers.has(node.layer));
  const visibleNodeIds = new Set(visibleNodes.map(n => n.id));
  
  // Filter edges to only show connections between visible nodes
  const visibleEdges = edges.filter(edge => 
    visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target)
  );

  // Build adjacency for positioning
  const getNodeChildren = (nodeId: string) => {
    return visibleEdges.filter(e => e.source === nodeId).map(e => e.target);
  };

  return (
    <div className="space-y-4">
      {visibleNodes.map((node, index) => {
        const isSelected = selectedNode?.id === node.id;
        const layerColor = getLayerColor(node.layer);
        const children = getNodeChildren(node.id);
        const hasChildren = children.length > 0;

        return (
          <div key={node.id} className="relative">
            {/* Node */}
            <button
              onClick={() => onSelectNode(node)}
              className="w-full text-left p-4 rounded-lg border-2 transition-all hover:shadow-lg"
              style={{
                borderColor: isSelected ? layerColor : 'rgb(229, 231, 235)',
                backgroundColor: isSelected ? `${layerColor}15` : 'white',
                transform: isSelected ? 'scale(1.02)' : 'scale(1)'
              }}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getKindIcon(node.kind)}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="truncate" style={{ color: layerColor }}>
                      {node.title}
                    </h4>
                    {node.metrics?.avg_ms && (
                      <span className="text-xs text-gray-500 px-2 py-0.5 bg-gray-100 rounded">
                        {formatDuration(node.metrics.avg_ms)}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 truncate">{node.description}</p>
                </div>
                <ChevronRight 
                  className="w-5 h-5 flex-shrink-0 transition-transform" 
                  style={{ 
                    color: layerColor,
                    transform: isSelected ? 'rotate(90deg)' : 'rotate(0deg)'
                  }}
                />
              </div>
            </button>

            {/* Connector to next node */}
            {hasChildren && index < visibleNodes.length - 1 && (
              <div className="flex justify-center py-2">
                <div className="w-0.5 h-6 bg-gray-300"></div>
              </div>
            )}
          </div>
        );
      })}

      {visibleNodes.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p>No nodes visible with current layer filters</p>
          <p className="text-sm mt-2">Enable at least one layer to see the flow</p>
        </div>
      )}
    </div>
  );
}
