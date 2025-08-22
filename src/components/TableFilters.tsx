import React from 'react';
import type { SupportedChainName } from '../../test-task-types';

export interface TableFilters {
  chain: SupportedChainName | null;
  minVolume: number | null;
  maxAge: number | null;
  minMarketCap: number | null;
  excludeHoneypots: boolean;
}

interface TableFiltersProps {
  tableId: string;
  filters: TableFilters;
  onFilterChange: (
    key: keyof TableFilters,
    value: SupportedChainName | number | boolean | null
  ) => void;
  onClearFilters: () => void;
}

export const TableFilters: React.FC<TableFiltersProps> = ({
  tableId,
  filters,
  onFilterChange,
  onClearFilters,
}) => {
  const handleFilterChange = (
    key: keyof TableFilters,
    value: string | number | boolean | null
  ) => {
    if (key === 'chain') {
      onFilterChange(key, value as SupportedChainName);
    } else if (
      key === 'minVolume' ||
      key === 'maxAge' ||
      key === 'minMarketCap'
    ) {
      if (value === '' || value === null) {
        onFilterChange(key, null);
      } else {
        onFilterChange(key, Number(value));
      }
    } else if (key === 'excludeHoneypots') {
      onFilterChange(key, Boolean(value));
    }
  };

  return (
    <div className="bg-gradient-to-br from-gray-900/50 to-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-5 mb-6 shadow-2xl">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center space-x-3">
          <div className="w-2 h-6 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full"></div>
          <h3 className="text-lg font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Filters
          </h3>
        </div>
        <div className="text-sm text-gray-400">
          {Object.values(filters).filter(Boolean).length} active
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-5">
        {/* Chain Selection */}
        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-gray-300 uppercase tracking-wide">
            Chain
          </label>
          <div className="relative">
            <select
              id={`${tableId}-chain`}
              value={filters.chain || ''}
              onChange={e =>
                handleFilterChange('chain', e.target.value || null)
              }
              className="w-full px-3 py-2 bg-gray-800/80 border border-gray-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-white placeholder-gray-400 transition-all duration-200 hover:border-gray-500/70 hover:bg-gray-800/90 appearance-none pr-10"
            >
              <option value="">All Chains</option>
              <option value="ETH">Ethereum</option>
              <option value="SOL">Solana</option>
              <option value="BASE">Base</option>
              <option value="BSC">BSC</option>
            </select>
            <div className="absolute inset-y-0 right-2.5 flex items-center pointer-events-none">
              <svg
                className="w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Minimum Volume Filter */}
        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-gray-300 uppercase tracking-wide">
            Min Volume (24h)
          </label>
          <input
            id={`${tableId}-minVolume`}
            type="number"
            placeholder="1000"
            value={filters.minVolume || ''}
            onChange={e => handleFilterChange('minVolume', e.target.value)}
            className="w-full px-3 py-2 bg-gray-800/80 border border-gray-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-white placeholder-gray-400 transition-all duration-200 hover:border-gray-500/70 hover:bg-gray-800/90"
          />
        </div>

        {/* Maximum Age Filter */}
        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-gray-300 uppercase tracking-wide">
            Max Age (hours)
          </label>
          <input
            id={`${tableId}-maxAge`}
            type="number"
            placeholder="24"
            value={filters.maxAge || ''}
            onChange={e => handleFilterChange('maxAge', e.target.value)}
            className="w-full px-3 py-2 bg-gray-800/80 border border-gray-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-white placeholder-gray-400 transition-all duration-200 hover:border-gray-500/70 hover:bg-gray-800/90"
          />
        </div>

        {/* Minimum Market Cap Filter */}
        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-gray-300 uppercase tracking-wide">
            Min Market Cap
          </label>
          <input
            id={`${tableId}-minMarketCap`}
            type="number"
            placeholder="10000"
            value={filters.minMarketCap || ''}
            onChange={e => handleFilterChange('minMarketCap', e.target.value)}
            className="w-full px-3 py-2 bg-gray-800/80 border border-gray-600/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-white placeholder-gray-400 transition-all duration-200 hover:border-gray-500/70 hover:bg-gray-800/90"
          />
        </div>

        {/* Honeypot Filter */}
        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-gray-300 uppercase tracking-wide">
            Honeypot Filter
          </label>
          <div className="flex items-center space-x-2 pt-2">
            <div className="relative">
              <input
                type="checkbox"
                id={`${tableId}-excludeHoneypots`}
                checked={filters.excludeHoneypots}
                onChange={e =>
                  handleFilterChange('excludeHoneypots', e.target.checked)
                }
                className="sr-only"
              />
              <label
                htmlFor={`${tableId}-excludeHoneypots`}
                className="flex items-center cursor-pointer"
              >
                <div
                  className={`w-5 h-5 rounded-md border-2 transition-all duration-200 ${
                    filters.excludeHoneypots
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 border-transparent'
                      : 'bg-gray-800/80 border-gray-600/50'
                  }`}
                >
                  {filters.excludeHoneypots && (
                    <svg
                      className="w-3 h-3 text-white m-auto"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
                <span className="ml-2 text-sm font-medium text-gray-300">
                  Exclude Honeypots
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Clear Filters Button */}
        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-gray-300 uppercase tracking-wide">
            Actions
          </label>
          <button
            onClick={onClearFilters}
            className="w-full px-5 py-2.5 text-sm font-semibold bg-gradient-to-r from-red-500/20 to-red-600/20 border border-red-500/30 rounded-lg hover:from-red-500/30 hover:to-red-600/30 hover:border-red-500/50 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-transparent transition-all duration-200 text-red-300 hover:text-red-200"
          >
            Clear Filters
          </button>
        </div>
      </div>
    </div>
  );
};
