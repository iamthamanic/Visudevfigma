import { useState } from 'react';
import { DBTable, DBRelation, DBPolicy, Migration } from '../types';
import { DataERD } from './DataERD';
import { PolicyMatrix } from './PolicyMatrix';
import { MigrationList } from './MigrationList';
import { ScanButton } from './ScanButton';

interface DataScreenProps {
  tables: DBTable[];
  relations: DBRelation[];
  policies: DBPolicy[];
  migrations: Migration[];
}

type TabType = 'erd' | 'policies' | 'migrations';

export function DataScreen({ tables, relations, policies, migrations }: DataScreenProps) {
  const [activeTab, setActiveTab] = useState<TabType>('erd');

  const tabs: { key: TabType; label: string; count?: number }[] = [
    { key: 'erd', label: 'ERD', count: tables.length },
    { key: 'policies', label: 'RLS Policies', count: policies.length },
    { key: 'migrations', label: 'Migrations', count: migrations.length }
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Tabs */}
      <div className="border-b bg-white">
        <div className="flex justify-between items-center pr-6">
          <div className="flex">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-6 py-4 border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-700'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                      {tab.count}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
          <ScanButton scanType="data" label="DB scannen" />
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto bg-gray-50">
        {activeTab === 'erd' && <DataERD tables={tables} relations={relations} />}
        {activeTab === 'policies' && <PolicyMatrix tables={tables} policies={policies} />}
        {activeTab === 'migrations' && <MigrationList migrations={migrations} />}
      </div>
    </div>
  );
}