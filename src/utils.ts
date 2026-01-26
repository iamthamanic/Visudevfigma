// Utility functions for VisuDEV

import { NodeKind, Layer } from './types';

export function getLayerColor(layer: Layer): string {
  switch (layer) {
    case 'frontend':
      return '#03ffa3'; // primary green
    case 'compute':
      return '#666666'; // dark gray
    case 'data':
      return '#000000'; // black
    case 'external':
      return '#999999'; // medium gray
    case 'policies':
      return '#CCCCCC'; // light gray
    default:
      return '#E5E5E5';
  }
}

export function getLayerBgColor(layer: Layer): string {
  switch (layer) {
    case 'frontend':
      return 'rgba(3, 255, 163, 0.1)';
    case 'compute':
      return 'rgba(102, 102, 102, 0.1)';
    case 'data':
      return 'rgba(0, 0, 0, 0.05)';
    case 'external':
      return 'rgba(153, 153, 153, 0.1)';
    case 'policies':
      return 'rgba(204, 204, 204, 0.1)';
    default:
      return 'rgba(229, 229, 229, 0.1)';
  }
}

export function getKindIcon(kind: NodeKind): string {
  switch (kind) {
    case 'ui':
      return '🖱️';
    case 'api':
      return '🔌';
    case 'edge':
      return '⚡';
    case 'auth':
      return '🔐';
    case 'sql':
      return '🗄️';
    case 'policy':
      return '🛡️';
    case 'storage':
      return '📦';
    case 'erp':
      return '🏢';
    default:
      return '⚙️';
  }
}

export function formatDuration(ms?: number): string {
  if (ms === undefined) return '-';
  if (ms < 1) return '<1ms';
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

export function formatErrorRate(rate?: number): string {
  if (rate === undefined) return '-';
  return `${(rate * 100).toFixed(1)}%`;
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'gerade eben';
  if (diffMins < 60) return `vor ${diffMins}min`;
  if (diffHours < 24) return `vor ${diffHours}h`;
  if (diffDays < 7) return `vor ${diffDays}d`;
  
  return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function getMetricColor(value: number, threshold: { good: number; warning: number }): string {
  if (value <= threshold.good) return '#03ffa3'; // primary green
  if (value <= threshold.warning) return '#FFA500'; // orange
  return '#EF4444'; // red
}

export function getShortSHA(sha?: string): string {
  if (!sha) return '-';
  return sha.substring(0, 7);
}

export function buildGitHubPermalink(owner: string, repo: string, sha: string, path: string, startLine?: number, endLine?: number): string {
  let url = `https://github.com/${owner}/${repo}/blob/${sha}/${path}`;
  if (startLine) {
    url += `#L${startLine}`;
    if (endLine && endLine !== startLine) {
      url += `-L${endLine}`;
    }
  }
  return url;
}
