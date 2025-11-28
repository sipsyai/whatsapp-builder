import React from 'react';
import type { DataSource, DataSourceType, AuthType } from '../api';

interface DataSourceCardProps {
  dataSource: DataSource;
  isSelected: boolean;
  onSelect: () => void;
  onEdit: (dataSource: DataSource) => void;
  onDelete: (id: string) => void;
  onTestConnection: (id: string) => void;
  isTestingConnection?: boolean;
}

const getTypeBadgeColor = (type: DataSourceType): string => {
  switch (type) {
    case 'REST_API':
      return 'bg-blue-900/30 text-blue-400';
    case 'STRAPI':
      return 'bg-purple-900/30 text-purple-400';
    case 'GRAPHQL':
      return 'bg-pink-900/30 text-pink-400';
    default:
      return 'bg-gray-900/30 text-gray-400';
  }
};

const getAuthTypeBadgeColor = (authType: AuthType): string => {
  switch (authType) {
    case 'NONE':
      return 'bg-gray-900/30 text-gray-400';
    case 'BEARER':
      return 'bg-green-900/30 text-green-400';
    case 'API_KEY':
      return 'bg-yellow-900/30 text-yellow-400';
    case 'BASIC':
      return 'bg-orange-900/30 text-orange-400';
    default:
      return 'bg-gray-900/30 text-gray-400';
  }
};

const truncateUrl = (url: string, maxLength: number = 35): string => {
  if (url.length <= maxLength) return url;
  return url.substring(0, maxLength) + '...';
};

export const DataSourceCard: React.FC<DataSourceCardProps> = ({
  dataSource,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onTestConnection,
  isTestingConnection,
}) => {
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(dataSource);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(dataSource.id);
  };

  const handleTestConnection = (e: React.MouseEvent) => {
    e.stopPropagation();
    onTestConnection(dataSource.id);
  };

  return (
    <div
      onClick={onSelect}
      className={`
        p-4 rounded-lg border cursor-pointer transition-all
        ${
          isSelected
            ? 'border-primary bg-primary/10 ring-1 ring-primary'
            : 'border-zinc-800 bg-surface-dark hover:border-zinc-700 hover:bg-zinc-900/50'
        }
      `}
    >
      {/* Header: Name and Status */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-white truncate">
              {dataSource.name}
            </h3>
            <span
              className={`px-1.5 py-0.5 text-[10px] font-medium rounded ${
                dataSource.isActive
                  ? 'bg-green-900/30 text-green-400'
                  : 'bg-red-900/30 text-red-400'
              }`}
            >
              {dataSource.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          {dataSource.description && (
            <p className="text-xs text-zinc-500 mt-0.5 truncate">
              {dataSource.description}
            </p>
          )}
        </div>
      </div>

      {/* Badges: Type and Auth */}
      <div className="flex items-center gap-2 mb-2">
        <span
          className={`px-2 py-0.5 text-[10px] font-medium rounded ${getTypeBadgeColor(dataSource.type)}`}
        >
          {dataSource.type}
        </span>
        <span
          className={`px-2 py-0.5 text-[10px] font-medium rounded ${getAuthTypeBadgeColor(dataSource.authType)}`}
        >
          {dataSource.authType}
        </span>
      </div>

      {/* Base URL */}
      <div className="text-xs text-zinc-400 font-mono mb-3 truncate" title={dataSource.baseUrl}>
        {truncateUrl(dataSource.baseUrl)}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-1 border-t border-zinc-800 pt-2 -mx-4 px-4 -mb-4 pb-3">
        <button
          onClick={handleTestConnection}
          disabled={isTestingConnection}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-blue-400 hover:bg-blue-900/20 transition-colors disabled:opacity-50"
          title="Test Connection"
        >
          {isTestingConnection ? (
            <span className="material-symbols-outlined text-sm animate-spin">sync</span>
          ) : (
            <span className="material-symbols-outlined text-sm">cable</span>
          )}
        </button>
        <button
          onClick={handleEdit}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-primary hover:bg-primary/10 transition-colors"
          title="Edit Data Source"
        >
          <span className="material-symbols-outlined text-sm">edit</span>
        </button>
        <button
          onClick={handleDelete}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-900/20 transition-colors"
          title="Delete Data Source"
        >
          <span className="material-symbols-outlined text-sm">delete</span>
        </button>
      </div>
    </div>
  );
};
