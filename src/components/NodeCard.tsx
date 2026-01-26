import { FlowNode } from '../types';
import { getLayerColor, getLayerBgColor, getKindIcon, formatDuration, formatErrorRate, getShortSHA, getMetricColor } from '../utils';
import { ExternalLink, GitCommit, Clock, AlertCircle } from 'lucide-react';

interface NodeCardProps {
  node: FlowNode;
}

export function NodeCard({ node }: NodeCardProps) {
  const layerColor = getLayerColor(node.layer);
  const layerBgColor = getLayerBgColor(node.layer);

  return (
    <div
      className="rounded-lg border-2 p-4 space-y-3"
      style={{ borderColor: layerColor, backgroundColor: layerBgColor }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">{getKindIcon(node.kind)}</span>
            <h3 className="text-lg" style={{ color: layerColor }}>
              {node.title}
            </h3>
          </div>
          <p className="text-sm text-gray-600">{node.description}</p>
        </div>
      </div>

      {/* File Info */}
      {node.file_path && (
        <div className="flex items-center gap-2 text-sm">
          <GitCommit className="w-4 h-4 text-gray-400" />
          <code className="text-gray-700 flex-1 truncate">{node.file_path}</code>
          {node.start_line && (
            <span className="text-gray-500">L{node.start_line}{node.end_line && node.end_line !== node.start_line ? `-${node.end_line}` : ''}</span>
          )}
        </div>
      )}

      {/* Commit SHA */}
      {node.commit_sha && (
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span className="px-2 py-0.5 bg-gray-100 rounded font-mono text-xs">
            {getShortSHA(node.commit_sha)}
          </span>
        </div>
      )}

      {/* Code Snippet */}
      {node.code_snippet && (
        <div className="bg-gray-900 text-gray-100 p-3 rounded-md overflow-x-auto">
          <pre className="text-xs">
            <code>{node.code_snippet}</code>
          </pre>
        </div>
      )}

      {/* Metrics */}
      {node.metrics && (
        <div className="grid grid-cols-3 gap-3 pt-2 border-t border-gray-300">
          <div>
            <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Avg
            </div>
            <div className="text-sm" style={{ color: getMetricColor(node.metrics.avg_ms || 0, { good: 50, warning: 200 }) }}>
              {formatDuration(node.metrics.avg_ms)}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              P95
            </div>
            <div className="text-sm" style={{ color: getMetricColor(node.metrics.p95_ms || 0, { good: 100, warning: 500 }) }}>
              {formatDuration(node.metrics.p95_ms)}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              Errors
            </div>
            <div className="text-sm" style={{ color: getMetricColor((node.metrics.err_rate || 0) * 100, { good: 1, warning: 5 }) }}>
              {formatErrorRate(node.metrics.err_rate)}
            </div>
          </div>
        </div>
      )}

      {/* Links */}
      <div className="flex gap-2 pt-2 border-t border-gray-300">
        <a
          href={node.links.github_permalink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 px-3 py-1.5 bg-gray-900 text-white rounded-md text-sm hover:bg-gray-700 transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          GitHub
        </a>
        {node.links.open_in_supabase && (
          <a
            href={node.links.open_in_supabase}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-3 py-1.5 text-sm hover:bg-gray-200 transition-colors rounded-md"
            style={{ backgroundColor: layerBgColor, color: layerColor }}
          >
            <ExternalLink className="w-4 h-4" />
            Supabase
          </a>
        )}
      </div>
    </div>
  );
}
