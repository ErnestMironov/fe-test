import { useState, useMemo, memo } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  type SortingState,
} from '@tanstack/react-table';
import type { ScannerResult, SerdeRankBy } from '../../test-task-types';
import { useInfiniteScannerData } from '../lib/hooks/useInfiniteScannerData';
import { formatPrice } from '../lib/utils/priceFormatter';

const columnHelper = createColumnHelper<ScannerResult>();

const columns = [
  columnHelper.accessor('token1Symbol', {
    header: 'Token',
    cell: info => (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
            {info.getValue().charAt(0)}
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-500 row-counter">#</span>
              <span className="font-medium text-sm"> {info.getValue()}</span>
              <span className="text-gray-400">/</span>
              <span className="font-medium text-sm">
                {info.row.original.token1Name}
              </span>
            </div>
            <div className="flex items-center gap-1 mt-1">
              <div className="w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-sm"></div>
              </div>
              <div className="w-4 h-4 rounded-full bg-pink-500 flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-sm"></div>
              </div>
              <div className="w-4 h-4 rounded-full bg-gray-600 flex items-center justify-center">
                <span className="text-white text-xs">𝕏</span>
              </div>
              <div className="w-4 h-4 rounded-full bg-gray-600 flex items-center justify-center">
                <span className="text-white text-xs">✈</span>
              </div>
              <div className="w-4 h-4 rounded-full bg-gray-600 flex items-center justify-center">
                <span className="text-white text-xs">🌐</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
  }),
  columnHelper.accessor('price', {
    header: 'Price',
    cell: info => {
      const price = info.getValue();
      if (typeof price === 'string' && price.startsWith('0x')) {
        return price;
      }
      return formatPrice(price);
    },
  }),
  columnHelper.accessor('age', {
    header: 'Age',
    cell: info => {
      const date = new Date(info.getValue());
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

      if (diffHours < 1) return `${diffMinutes}m`;
      if (diffHours < 24) return `${diffHours}h`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d`;
    },
  }),
  columnHelper.accessor('volume', {
    header: 'Volume',
    cell: info => info.getValue(),
  }),
  columnHelper.accessor('txns', {
    header: 'Transactions',
    cell: info => info.getValue() || 'N/A',
  }),
  columnHelper.accessor('buyFee', {
    header: 'Tax',
    cell: info => {
      const buyFee = info.getValue();
      const sellFee = info.row.original.sellFee;
      if (buyFee && sellFee) {
        return `${buyFee}%/${sellFee}%`;
      }
      return 'N/A';
    },
  }),
  columnHelper.accessor('currentMcap', {
    header: 'Marketcap',
    cell: info => info.getValue(),
  }),
  columnHelper.accessor('liquidity', {
    header: 'Liquidity',
    cell: info => info.getValue(),
  }),
  columnHelper.accessor('diff5M', {
    header: '5M',
    cell: info => {
      const value = info.getValue();
      if (
        (typeof value === 'string' && value.includes('MB')) ||
        value?.includes('KB')
      ) {
        return value;
      }
      return formatPrice(value);
    },
  }),
  columnHelper.accessor('diff1H', {
    header: '1H',
    cell: info => {
      const value = info.getValue();
      if (
        (typeof value === 'string' && value.includes('MB')) ||
        value?.includes('KB')
      ) {
        return value;
      }
      return formatPrice(value);
    },
  }),
  columnHelper.accessor('diff6H', {
    header: '6H',
    cell: info => {
      const value = info.getValue();
      if (
        (typeof value === 'string' && value.includes('MB')) ||
        value?.includes('KB')
      ) {
        return value;
      }
      return formatPrice(value);
    },
  }),
  columnHelper.accessor('diff24H', {
    header: '24H',
    cell: info => {
      const value = info.getValue();
      if (
        (typeof value === 'string' && value.includes('MB')) ||
        value?.includes('KB')
      ) {
        return value;
      }
      return formatPrice(value);
    },
  }),
  columnHelper.accessor('contractVerified', {
    header: 'Audit',
    cell: info => {
      const verified = info.getValue();
      const renounced = info.row.original.contractRenounced;
      const honeyPot = info.row.original.honeyPot;

      if (honeyPot) return '🚨 Honeypot';
      if (verified && renounced) return '✅ Verified';
      if (verified) return '✅ Verified';
      if (renounced) return '⚠️ Renounced';
      return '❌ Unverified';
    },
  }),
];

export const DataTable = memo(function DataTable() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const {
    data: infiniteData,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteScannerData({
    orderBy: sorting[0]?.desc ? 'desc' : 'asc',
    rankBy: getRankByFromColumn(sorting[0]?.id),
  });

  const memoizedColumns = useMemo(() => columns, []);
  const memoizedData = useMemo(() => {
    if (!infiniteData?.pages) return [];
    return infiniteData.pages.flatMap(page => page.pairs || []);
  }, [infiniteData]);

  const table = useReactTable({
    data: memoizedData,
    columns: memoizedColumns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: newSorting => {
      setSorting(newSorting);
      if (newSorting.length > 0) {
        refetch();
      }
    },
    state: {
      sorting,
    },
    manualSorting: true,
  });

  function getRankByFromColumn(columnId?: string): SerdeRankBy {
    switch (columnId) {
      case 'price':
        return 'price24H';
      case 'volume':
        return 'volume';
      case 'txns':
        return 'txns';
      case 'currentMcap':
        return 'mcap';
      case 'liquidity':
        return 'liquidity';
      case 'age':
        return 'age';
      case 'diff5M':
        return 'price5M';
      case 'diff1H':
        return 'price1H';
      case 'diff6H':
        return 'price6H';
      case 'diff24H':
        return 'price24H';
      default:
        return 'volume';
    }
  }

  if (isLoading) {
    return (
      <div className="w-full h-screen flex flex-col p-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          Scanner Results Table
        </h2>
        <div className="bg-white rounded-lg shadow-lg overflow-hidden flex-1 min-h-0">
          <div className="h-full flex items-center justify-center">
            <div className="text-lg text-gray-600">Loading scanner data...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-screen flex flex-col p-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          Scanner Results Table
        </h2>
        <div className="bg-white rounded-lg shadow-lg overflow-hidden flex-1 min-h-0">
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
        <h2 className="text-2xl font-bold text-gray-800">
          Scanner Results Table
        </h2>
        {infiniteData && (
          <div className="text-sm text-gray-600">
            {memoizedData.length.toLocaleString()} /{' '}
            {infiniteData.pages[0]?.totalRows?.toLocaleString() || 0} rows
          </div>
        )}
      </div>
      <div className="bg-white rounded-lg shadow-lg overflow-hidden flex-1 min-h-0">
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
            <thead className="sticky top-0 z-10 bg-gray-50">
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id} className="bg-gray-50">
                  {headerGroup.headers.map(header => (
                    <th
                      key={header.id}
                      className="px-2.5 py-1 text-xs font-medium text-gray-700 text-center border-b border-gray-200 cursor-pointer hover:bg-gray-100 relative"
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
                  className="hover:bg-gray-50 odd:bg-gray-100"
                  style={{ counterIncrement: 'row-number' }}
                >
                  {row.getVisibleCells().map(cell => (
                    <td
                      key={cell.id}
                      className="px-2.5 py-1 whitespace-nowrap text-xs text-gray-900 text-center border-b border-gray-200"
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

          {!hasNextPage && memoizedData.length > 0 && (
            <div className="flex justify-center items-center py-4">
              <div className="text-sm text-gray-500">
                Loaded {memoizedData.length.toLocaleString()} of{' '}
                {infiniteData?.pages[0]?.totalRows?.toLocaleString() || 0} total
                rows
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
