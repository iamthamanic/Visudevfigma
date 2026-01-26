import { DBTable, DBRelation } from '../types';
import { Database, Key, Link } from 'lucide-react';

interface DataERDProps {
  tables: DBTable[];
  relations: DBRelation[];
}

export function DataERD({ tables, relations }: DataERDProps) {
  // Find relations for a table
  const getTableRelations = (tableName: string) => {
    return relations.filter(
      r => r.src_table === tableName || r.dst_table === tableName
    );
  };

  return (
    <div className="p-6 overflow-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tables.map(table => {
          const tableRelations = getTableRelations(table.table_name);
          const outgoing = tableRelations.filter(r => r.src_table === table.table_name);
          const incoming = tableRelations.filter(r => r.dst_table === table.table_name);

          return (
            <div
              key={table.id}
              className="border-2 border-blue-500 rounded-lg bg-white shadow-lg hover:shadow-xl transition-shadow"
            >
              {/* Table Header */}
              <div className="bg-blue-500 text-white px-4 py-3 rounded-t-md">
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  <h3>{table.table_name}</h3>
                </div>
                <p className="text-xs text-blue-100 mt-1">{table.schema_name}</p>
              </div>

              {/* Columns */}
              {table.columns && table.columns.length > 0 && (
                <div className="p-4 border-b">
                  <div className="space-y-1">
                    {table.columns.map((col, idx) => {
                      const isFK = outgoing.some(r => r.src_column === col);
                      const isPK = col === 'id';

                      return (
                        <div
                          key={idx}
                          className="flex items-center gap-2 text-sm py-1 px-2 rounded hover:bg-gray-50"
                        >
                          {isPK && <Key className="w-3 h-3 text-yellow-600" />}
                          {isFK && !isPK && <Link className="w-3 h-3 text-blue-600" />}
                          <code className={isPK ? 'text-yellow-700' : isFK ? 'text-blue-700' : 'text-gray-700'}>
                            {col}
                          </code>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Relations */}
              {tableRelations.length > 0 && (
                <div className="p-4 space-y-2">
                  {outgoing.length > 0 && (
                    <div>
                      <div className="text-xs text-gray-500 mb-1">References →</div>
                      <div className="space-y-1">
                        {outgoing.map(rel => (
                          <div key={rel.id} className="text-xs bg-blue-50 px-2 py-1 rounded">
                            <code className="text-blue-700">{rel.src_column}</code>
                            {' → '}
                            <span className="text-gray-600">{rel.dst_table}.{rel.dst_column}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {incoming.length > 0 && (
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Referenced by ←</div>
                      <div className="space-y-1">
                        {incoming.map(rel => (
                          <div key={rel.id} className="text-xs bg-green-50 px-2 py-1 rounded">
                            <span className="text-gray-600">{rel.src_table}.{rel.src_column}</span>
                            {' → '}
                            <code className="text-green-700">{rel.dst_column}</code>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {tables.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No tables found</p>
        </div>
      )}
    </div>
  );
}
