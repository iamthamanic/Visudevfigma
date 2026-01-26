import { WebhookEvent } from '../types';
import { formatDate } from '../utils';
import { Webhook, GitCommit, GitPullRequest, Package, FileCode } from 'lucide-react';

interface LogsPanelProps {
  events: WebhookEvent[];
}

export function LogsPanel({ events }: LogsPanelProps) {
  const getEventIcon = (event: string) => {
    if (event === 'push') return <GitCommit className="w-5 h-5" />;
    if (event === 'pull_request') return <GitPullRequest className="w-5 h-5" />;
    return <Webhook className="w-5 h-5" />;
  };

  const getEventColor = (event: string) => {
    if (event === 'push') return 'text-blue-600 bg-blue-50';
    if (event === 'pull_request') return 'text-purple-600 bg-purple-50';
    return 'text-gray-600 bg-gray-50';
  };

  // Sort events by time descending
  const sortedEvents = [...events].sort(
    (a, b) => new Date(b.received_at).getTime() - new Date(a.received_at).getTime()
  );

  return (
    <div className="h-full flex">
      {/* Events List */}
      <div className="flex-1 overflow-auto">
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl">Webhook Events</h2>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Live
            </div>
          </div>

          <div className="space-y-3">
            {sortedEvents.map((event) => {
              const colorClass = getEventColor(event.event);
              
              return (
                <div
                  key={event.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg ${colorClass}`}>
                      {getEventIcon(event.event)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="capitalize">{event.event}</span>
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                              {event.provider}
                            </span>
                          </div>
                          
                          {/* Event-specific details */}
                          {event.payload && (
                            <div className="text-sm text-gray-600">
                              {event.event === 'push' && event.payload.ref && (
                                <span>
                                  Branch: <code className="bg-gray-100 px-1 rounded">{event.payload.ref.replace('refs/heads/', '')}</code>
                                  {event.payload.commits && ` • ${event.payload.commits} commit${event.payload.commits > 1 ? 's' : ''}`}
                                </span>
                              )}
                              {event.event === 'pull_request' && event.payload.number && (
                                <span>
                                  PR #{event.payload.number}
                                  {event.payload.action && ` • ${event.payload.action}`}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="text-sm text-gray-500 flex-shrink-0">
                          {formatDate(event.received_at)}
                        </div>
                      </div>

                      {event.delivery_id && (
                        <div className="text-xs text-gray-400">
                          Delivery: <code>{event.delivery_id}</code>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {events.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Webhook className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No webhook events yet</p>
              <p className="text-sm mt-2">Events will appear here when GitHub sends webhooks</p>
            </div>
          )}
        </div>
      </div>

      {/* Tech Stack Panel */}
      <div className="w-96 border-l overflow-auto">
        <div className="p-6 space-y-6">
          <h3 className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Tech Stack
          </h3>

          {/* Frontend */}
          <div className="space-y-2">
            <h4 className="text-sm text-gray-500 uppercase tracking-wide">Frontend</h4>
            <div className="space-y-1">
              {[
                { name: 'React', version: '18.2.0' },
                { name: 'TypeScript', version: '5.1.6' },
                { name: 'Tailwind CSS', version: '3.3.0' },
                { name: 'Vite', version: '4.4.0' }
              ].map(pkg => (
                <div key={pkg.name} className="flex items-center justify-between text-sm bg-gray-50 px-3 py-2 rounded">
                  <span>{pkg.name}</span>
                  <code className="text-xs text-gray-600">{pkg.version}</code>
                </div>
              ))}
            </div>
          </div>

          {/* Backend */}
          <div className="space-y-2">
            <h4 className="text-sm text-gray-500 uppercase tracking-wide">Backend</h4>
            <div className="space-y-1">
              {[
                { name: 'Supabase', version: 'latest' },
                { name: 'PostgreSQL', version: '15' },
                { name: 'PostgREST', version: '11' },
                { name: 'Edge Functions', version: 'Deno' }
              ].map(pkg => (
                <div key={pkg.name} className="flex items-center justify-between text-sm bg-gray-50 px-3 py-2 rounded">
                  <span>{pkg.name}</span>
                  <code className="text-xs text-gray-600">{pkg.version}</code>
                </div>
              ))}
            </div>
          </div>

          {/* Files */}
          <div className="space-y-2">
            <h4 className="text-sm text-gray-500 uppercase tracking-wide flex items-center gap-2">
              <FileCode className="w-4 h-4" />
              Key Files
            </h4>
            <div className="space-y-1">
              {[
                'visudev.manifest.json',
                'package.json',
                'tsconfig.json',
                'supabase/config.toml'
              ].map(file => (
                <div key={file} className="text-sm bg-gray-50 px-3 py-2 rounded">
                  <code className="text-xs">{file}</code>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
