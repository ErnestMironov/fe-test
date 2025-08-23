import { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type SortingState,
} from '@tanstack/react-table';
import type { SupportedChainName } from '../../test-task-types';
import { chainIdToName } from '../../test-task-types';
import {
  useInfiniteTrendingTokens,
  useInfiniteNewTokens,
} from '@/lib/hooks/useInfiniteScannerData';
import { useDataTableState } from '@/lib/hooks/useDataTableState';
import { useDataTableWebSocket } from '@/lib/hooks/useDataTableWebSocket';
import { createDataTableColumns } from '@/components/DataTableColumns';
import {
  TableFilters,
  type TableFilters as TableFiltersType,
} from '@/components/TableFilters';

interface DataTableProps {
  type: 'trending' | 'new';
}

export const DataTable = function DataTable({ type }: DataTableProps) {
  const [sorting, setSorting] = useState<SortingState>(
    type === 'trending' ? [{ id: 'volume', desc: true }] : []
  );
  const [filters, setFilters] = useState<TableFiltersType>({
    chain: null,
    minVolume: null,
    maxAge: null,
    minMarketCap: null,
    excludeHoneypots: false,
  });

  const handleFilterChange = (
    key: keyof TableFiltersType,
    value: SupportedChainName | number | boolean | null
  ) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      chain: null,
      minVolume: null,
      maxAge: null,
      minMarketCap: null,
      excludeHoneypots: false,
    });
  };
  const trendingData = useInfiniteTrendingTokens();
  const newTokensData = useInfiniteNewTokens();

  const {
    data: infiniteData,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = type === 'trending' ? trendingData : newTokensData;

  const memoizedColumns = useMemo(() => createDataTableColumns(), []);
  const memoizedData = useMemo(() => {
    if (!infiniteData?.pages) return [];
    return infiniteData.pages.flatMap(page => page.pairs || []);
  }, [infiniteData]);

  const filteredData = useMemo(() => {
    const filtered = memoizedData.filter(token => {
      if (filters.chain && chainIdToName(token.chainId) !== filters.chain) {
        return false;
      }

      if (
        filters.minVolume &&
        parseFloat(token.volume || '0') < filters.minVolume
      ) {
        return false;
      }

      if (filters.maxAge) {
        const tokenAge = new Date(token.age);
        const now = new Date();
        const ageInHours =
          (now.getTime() - tokenAge.getTime()) / (1000 * 60 * 60);
        if (ageInHours > filters.maxAge) {
          return false;
        }
      }

      if (filters.minMarketCap) {
        let marketCapValue = '0';
        if (token.currentMcap && token.currentMcap !== '0') {
          marketCapValue = token.currentMcap;
        } else if (token.price && token.token1TotalSupplyFormatted) {
          const price = parseFloat(token.price);
          const supply = parseFloat(token.token1TotalSupplyFormatted);
          if (!isNaN(price) && !isNaN(supply)) {
            marketCapValue = (price * supply).toString();
          }
        } else if (token.pairMcapUsdInitial) {
          marketCapValue = token.pairMcapUsdInitial;
        }

        const marketCap = parseFloat(marketCapValue);
        if (marketCap < filters.minMarketCap) {
          return false;
        }
      }

      if (filters.excludeHoneypots && token.honeyPot) {
        return false;
      }

      return true;
    });

    return filtered;
  }, [memoizedData, filters, type]);

  const {
    tableData,
    setTableData,
    visibleTokens,
    setVisibleTokens,
    subscribedTokens,
    setSubscribedTokens,
  } = useDataTableState({ filteredData });

  useDataTableWebSocket({
    tableData,
    visibleTokens,
    subscribedTokens,
    setTableData,
    setSubscribedTokens,
  });

  const table = useReactTable({
    data: tableData,
    columns: memoizedColumns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
    manualSorting: false,
  });

  if (isLoading) {
    return (
      <div className="w-full h-screen flex flex-col p-4">
        <h2 className="text-2xl font-bold mb-6">Scanner Results Table</h2>
        <div className="rounded-lg shadow-lg overflow-hidden flex-1 min-h-0">
          <div className="h-full flex items-center justify-center">
            <div className="text-lg">Loading scanner data...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-screen flex flex-col p-4">
        <h2 className="text-2xl font-bold mb-6">Scanner Results Table</h2>
        <div className="rounded-lg shadow-lg overflow-hidden flex-1 min-h-0">
          <div className="h-full flex items-center justify-center">
            <div className="text-lg text-red-600">
              Error loading data: {error.message}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen flex flex-col p-4">
      <style>{`
        .row-counter::after {
          content: counter(row-number);
        }
      `}</style>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">
          {type === 'trending' ? 'Trending Tokens' : 'New Tokens'}
        </h2>
        {infiniteData && (
          <div className="text-sm">
            {filteredData.length.toLocaleString()} /{' '}
            {infiniteData.pages[0]?.totalRows?.toLocaleString() || 0} rows
          </div>
        )}
      </div>
      <TableFilters
        tableId={`table-${type}`}
        filters={filters}
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
      />
      <div className="rounded-lg shadow-lg overflow-hidden flex-1 min-h-0">
        <div
          className="h-full overflow-auto"
          onScroll={e => {
            const target = e.target as HTMLDivElement;
            const { scrollTop, scrollHeight, clientHeight } = target;

            if (
              scrollTop + clientHeight >= scrollHeight - 100 &&
              hasNextPage &&
              !isFetchingNextPage
            ) {
              fetchNextPage();
            }
          }}
        >
          <table className="w-full border-collapse min-w-max">
            <thead className="sticky top-0 z-[20] bg-[#22262b]">
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header, index) => (
                    <th
                      key={header.id}
                      className={`px-2.5 py-1 text-md font-medium text-center border-b border-[#343a41] cursor-pointer relative ${
                        index === 0 ? 'border-l border-[#343a41]' : ''
                      } border-r border-[#343a41]`}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className="flex items-center justify-center gap-1">
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {{
                          asc: ' 🔼',
                          desc: ' 🔽',
                        }[header.column.getIsSorted() as string] ?? null}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody
              className="bg-white divide-y divide-gray-200"
              style={{ counterReset: 'row-number' }}
            >
              {table.getRowModel().rows.map(row => (
                <tr
                  key={row.id}
                  className=" even:bg-[#121417] odd:bg-black hover:bg-[#0b1c22]"
                  style={{ counterIncrement: 'row-number' }}
                  ref={el => {
                    if (!el) return;

                    const observer = new IntersectionObserver(
                      entries => {
                        entries.forEach(entry => {
                          const tokenId = row.original.pairAddress;
                          if (entry.isIntersecting) {
                            setVisibleTokens(prev =>
                              new Set(prev).add(tokenId)
                            );
                          } else {
                            setVisibleTokens(prev => {
                              const newSet = new Set(prev);
                              newSet.delete(tokenId);
                              return newSet;
                            });
                          }
                        });
                      },
                      {
                        root: null,
                        rootMargin: '100px',
                        threshold: 0.1,
                      }
                    );

                    observer.observe(el);

                    return () => observer.disconnect();
                  }}
                >
                  {row.getVisibleCells().map((cell, index) => (
                    <td
                      key={cell.id}
                      className={`whitespace-nowrap text-xs text-center border-b border-[#343a41] ${
                        index === 0 ? 'border-l border-[#343a41]' : ''
                      } border-r border-[#343a41]`}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>

          {isFetchingNextPage && (
            <div className="flex justify-center items-center py-4">
              <div className="text-sm text-gray-500">Loading more data...</div>
            </div>
          )}

          {!hasNextPage && filteredData.length > 0 && (
            <div className="flex justify-center items-center py-4">
              <div className="text-sm text-gray-500">
                Loaded {filteredData.length.toLocaleString()} of{' '}
                {infiniteData?.pages[0]?.totalRows?.toLocaleString() || 0} total
                rows
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
