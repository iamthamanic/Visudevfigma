import { DBTable, DBPolicy } from '../types';
import { Shield, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface PolicyMatrixProps {
  tables: DBTable[];
  policies: DBPolicy[];
}

export function PolicyMatrix({ tables, policies }: PolicyMatrixProps) {
  // Get all unique roles
  const allRoles = Array.from(new Set(policies.flatMap(p => p.roles)));
  const roles = ['authenticated', 'anon', ...allRoles.filter(r => !['authenticated', 'anon'].includes(r))];

  // Get policies for a table
  const getTablePolicies = (tableName: string) => {
    return policies.filter(p => p.table_name === tableName);
  };

  // Check if table has policies
  const hasPolicies = (tableName: string) => {
    return getTablePolicies(tableName).length > 0;
  };

  // Get policy for specific table and role
  const getTableRolePolicies = (tableName: string, role: string) => {
    return policies.filter(p => p.table_name === tableName && p.roles.includes(role));
  };

  return (
    <div className="p-6 space-y-6">
      {/* Warning for tables without RLS */}
      {tables.some(t => !hasPolicies(t.table_name)) && (
        <div className="bg-red-50 border-2 border-red-500 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-red-900 mb-1">Tables without RLS Policies</h4>
            <p className="text-sm text-red-700 mb-2">
              The following tables have no Row-Level Security policies defined:
            </p>
            <div className="flex flex-wrap gap-2">
              {tables
                .filter(t => !hasPolicies(t.table_name))
                .map(t => (
                  <code key={t.id} className="text-xs bg-red-100 text-red-900 px-2 py-1 rounded">
                    {t.table_name}
                  </code>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Policy Matrix Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-4 py-3 text-left">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Table
                </div>
              </th>
              {roles.map(role => (
                <th key={role} className="border border-gray-300 px-4 py-3 text-center">
                  <code className="text-sm">{role}</code>
                </th>
              ))}
              <th className="border border-gray-300 px-4 py-3 text-center">Policies</th>
            </tr>
          </thead>
          <tbody>
            {tables.map(table => {
              const tablePolicies = getTablePolicies(table.table_name);
              const hasAnyPolicy = tablePolicies.length > 0;

              return (
                <tr
                  key={table.id}
                  className={!hasAnyPolicy ? 'bg-red-50' : 'hover:bg-gray-50'}
                >
                  <td className="border border-gray-300 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <code>{table.table_name}</code>
                      {!hasAnyPolicy && (
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                      )}
                    </div>
                  </td>
                  {roles.map(role => {
                    const rolePolicies = getTableRolePolicies(table.table_name, role);
                    const hasPolicy = rolePolicies.length > 0;

                    return (
                      <td
                        key={role}
                        className="border border-gray-300 px-4 py-3 text-center"
                      >
                        {hasPolicy ? (
                          <div className="flex items-center justify-center gap-1">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="text-xs text-gray-600">({rolePolicies.length})</span>
                          </div>
                        ) : (
                          <XCircle className="w-4 h-4 text-gray-300 mx-auto" />
                        )}
                      </td>
                    );
                  })}
                  <td className="border border-gray-300 px-4 py-3 text-center">
                    <span className={hasAnyPolicy ? 'text-green-700' : 'text-red-700'}>
                      {tablePolicies.length}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Policy Details */}
      <div className="space-y-4">
        <h3 className="text-lg flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Policy Details
        </h3>
        
        {tables.map(table => {
          const tablePolicies = getTablePolicies(table.table_name);
          if (tablePolicies.length === 0) return null;

          return (
            <div key={table.id} className="border rounded-lg overflow-hidden">
              <div className="bg-gray-100 px-4 py-2">
                <code>{table.table_name}</code>
              </div>
              <div className="divide-y">
                {tablePolicies.map(policy => (
                  <div key={policy.id} className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <h4 className="text-sm mb-1">{policy.policy_name}</h4>
                        <div className="flex gap-1">
                          {policy.roles.map(role => (
                            <span
                              key={role}
                              className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded"
                            >
                              {role}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    {policy.using_sql && (
                      <div>
                        <div className="text-xs text-gray-500 mb-1">USING</div>
                        <code className="block text-xs bg-gray-900 text-gray-100 p-2 rounded overflow-x-auto">
                          {policy.using_sql}
                        </code>
                      </div>
                    )}
                    
                    {policy.check_sql && (
                      <div>
                        <div className="text-xs text-gray-500 mb-1">WITH CHECK</div>
                        <code className="block text-xs bg-gray-900 text-gray-100 p-2 rounded overflow-x-auto">
                          {policy.check_sql}
                        </code>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
