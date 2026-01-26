import { Migration } from '../types';
import { formatDate, getShortSHA } from '../utils';
import { GitCommit, Clock, FileCode } from 'lucide-react';

interface MigrationListProps {
  migrations: Migration[];
}

export function MigrationList({ migrations }: MigrationListProps) {
  // Sort by applied_at descending
  const sortedMigrations = [...migrations].sort(
    (a, b) => new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime()
  );

  return (
    <div className="p-6">
      <div className="space-y-3">
        {sortedMigrations.map((migration, index) => (
          <div
            key={migration.id}
            className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
          >
            <div className="flex items-start gap-4">
              {/* Timeline indicator */}
              <div className="relative flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-green-100 border-2 border-green-500 flex items-center justify-center">
                  <FileCode className="w-4 h-4 text-green-700" />
                </div>
                {index < sortedMigrations.length - 1 && (
                  <div className="w-0.5 h-12 bg-gray-200 mt-2" />
                )}
              </div>

              {/* Migration details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <h4 className="break-all">{migration.name}</h4>
                  <div className="flex items-center gap-2 text-sm text-gray-500 flex-shrink-0">
                    <Clock className="w-4 h-4" />
                    {formatDate(migration.applied_at)}
                  </div>
                </div>

                {migration.sha && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <GitCommit className="w-4 h-4" />
                    <code className="px-2 py-0.5 bg-gray-100 rounded text-xs">
                      {getShortSHA(migration.sha)}
                    </code>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {migrations.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <FileCode className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No migrations found</p>
        </div>
      )}
    </div>
  );
}
