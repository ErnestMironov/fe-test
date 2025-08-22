import React, { useState, useEffect, useMemo, memo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type SortingState,
  createColumnHelper,
} from '@tanstack/react-table';
import { useInfiniteScannerData } from '../lib/hooks/useInfiniteScannerData';
import { useWebSocket } from '../lib/hooks/useWebSocket';
import type {
  ScannerResult,
  SerdeRankBy,
  TickEventPayload,
  PairStatsMsgData,
  ScannerPairsEventPayload,
} from '../../test-task-types';
import { chainIdToName } from '../../test-task-types';
import { formatPrice } from '../lib/utils/priceFormatter';
import EthIcon from '../assets/icons/eth.png';
import SolIcon from '../assets/icons/sol.png';
import BaseIcon from '../assets/icons/base.png';
import BscIcon from '../assets/icons/bsc.png';

const columnHelper = createColumnHelper<ScannerResult>();

const NetworkLogo: React.FC<{ chainId: number }> = ({ chainId }) => {
  const chainName = chainIdToName(chainId);

  const getNetworkIcon = (chain: string) => {
    switch (chain) {
      case 'ETH':
        return EthIcon;
      case 'SOL':
        return SolIcon;
      case 'BASE':
        return BaseIcon;
      case 'BSC':
        return BscIcon;
      default:
        return EthIcon;
    }
  };

  const IconComponent = getNetworkIcon(chainName);

  return (
    <img src={IconComponent} alt={chainName} className="w-4 h-4 rounded-full" />
  );
};

const columns = [
  columnHelper.accessor('token1Symbol', {
    header: 'Token',
    cell: info => (
      <div className="relative flex items-center gap-3">
        <div className="absolute inset-0 flex">
          {(() => {
            const txns = info.row.original.txns;
            const buys = info.row.original.buys;
            const sells = info.row.original.sells;

            if (txns && buys && sells && txns > 0) {
              const buyRatio = (buys / txns) * 100;
              const sellRatio = (sells / txns) * 100;

              return (
                <>
                  <div
                    className="h-full"
                    style={{
                      width: `${buyRatio}%`,
                      background:
                        'linear-gradient(to bottom, rgba(34, 197, 94, 0.8), rgba(34, 197, 94, 0.2))',
                    }}
                  />
                  <div
                    className="h-full"
                    style={{
                      width: `${sellRatio}%`,
                      background:
                        'linear-gradient(to bottom, rgba(239, 68, 68, 0.8), rgba(239, 68, 68, 0.2))',
                    }}
                  />
                </>
              );
            }
            return null;
          })()}
        </div>
        <div className="relative z-10 flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
            {info.getValue().charAt(0)}
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-500 row-counter">#</span>
              <span className="font-medium text-sm">
                {info.row.original.token1Symbol}
              </span>
              <span className="text-gray-400">/</span>
              <span className="font-medium text-sm">
                {info.row.original.token0Symbol}
              </span>
            </div>
            <div className="flex items-center gap-1 mt-1">
              <NetworkLogo chainId={info.row.original.chainId} />
              <div className="w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center">
                <span className="text-white text-xs">🔒</span>
              </div>
              <div className="w-4 h-4 rounded-full bg-pink-500 flex items-center justify-center">
                <span className="text-white text-xs">🔥</span>
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
            <div className="text-xs text-gray-500 mt-1">
              {(() => {
                const txns = info.row.original.txns;
                const buys = info.row.original.buys;
                const sells = info.row.original.sells;

                if (txns && buys && sells && txns > 0) {
                  const buyRatio = ((buys / txns) * 100).toFixed(0);
                  const sellRatio = ((sells / txns) * 100).toFixed(0);
                  return `${buyRatio}% / ${sellRatio}%`;
                }
                return 'N/A';
              })()}
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
    cell: info => {
      const value = info.getValue();
      if (!value || value === '0') return 'N/A';

      const numValue = parseFloat(value);
      if (numValue >= 1e9) {
        return `$${(numValue / 1e9).toFixed(2)}B`;
      } else if (numValue >= 1e6) {
        return `$${(numValue / 1e6).toFixed(2)}M`;
      } else if (numValue >= 1e3) {
        return `$${(numValue / 1e3).toFixed(2)}K`;
      } else {
        return `$${numValue.toFixed(2)}`;
      }
    },
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
  const [tableData, setTableData] = useState<ScannerResult[]>([]);
  const [visibleTokens, setVisibleTokens] = useState<Set<string>>(new Set());
  const [subscribedTokens, setSubscribedTokens] = useState<Set<string>>(
    new Set()
  );
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

  const {
    subscribeToMultiplePairs,
    unsubscribeFromMultiplePairs,
    subscribeToScannerFilter,
    addMessageListener,
  } = useWebSocket();

  const memoizedColumns = useMemo(() => columns, []);
  const memoizedData = useMemo(() => {
    if (!infiniteData?.pages) return [];
    return infiniteData.pages.flatMap(page => page.pairs || []);
  }, [infiniteData]);

  const calculateMarketCap = (token: ScannerResult): string => {
    if (parseFloat(token.currentMcap || '0') > 0) {
      return token.currentMcap;
    }
    if (parseFloat(token.initialMcap || '0') > 0) {
      return token.initialMcap;
    }
    if (parseFloat(token.pairMcapUsd || '0') > 0) {
      return token.pairMcapUsd;
    }
    if (parseFloat(token.pairMcapUsdInitial || '0') > 0) {
      return token.pairMcapUsdInitial;
    }
    return '0';
  };

  useEffect(() => {
    const processedData = memoizedData.map(token => ({
      ...token,
      currentMcap: calculateMarketCap(token),
    }));
    setTableData(processedData);
  }, [memoizedData]);

  useEffect(() => {
    if (tableData.length === 0) return;

    const scannerFilterMessage = {
      event: 'scanner-filter',
      data: {
        rankBy: 'volume', // default ranking
        chain: chainIdToName(tableData[0].chainId),
        isNotHP: true,
      },
    };

    console.log('Subscribing to scanner-filter:', scannerFilterMessage);

    subscribeToScannerFilter(scannerFilterMessage.data);
  }, [tableData, subscribeToScannerFilter]);

  useEffect(() => {
    if (tableData.length === 0) return;

    const tokensToSubscribe = Array.from(visibleTokens)
      .filter(tokenId => !subscribedTokens.has(tokenId))
      .map(tokenId => {
        const token = tableData.find(t => t.pairAddress === tokenId);
        return token
          ? {
              pair: token.pairAddress,
              token: token.token1Address,
              chain: chainIdToName(token.chainId),
            }
          : null;
      })
      .filter(Boolean) as Array<{ pair: string; token: string; chain: string }>;

    const tokensToUnsubscribe = Array.from(subscribedTokens)
      .filter(tokenId => !visibleTokens.has(tokenId))
      .map(tokenId => {
        const token = tableData.find(t => t.pairAddress === tokenId);
        return token
          ? {
              pair: token.pairAddress,
              token: token.token1Address,
              chain: chainIdToName(token.chainId),
            }
          : null;
      })
      .filter(Boolean) as Array<{ pair: string; token: string; chain: string }>;

    if (tokensToSubscribe.length > 0) {
      console.log('Subscribing to visible tokens:', tokensToSubscribe.length);
      subscribeToMultiplePairs(tokensToSubscribe);
      setSubscribedTokens(prev => {
        const newSet = new Set(prev);
        tokensToSubscribe.forEach(token => newSet.add(token.pair));
        return newSet;
      });
    }

    if (tokensToUnsubscribe.length > 0) {
      console.log(
        'Unsubscribing from hidden tokens:',
        tokensToUnsubscribe.length
      );
      unsubscribeFromMultiplePairs(tokensToUnsubscribe);
      setSubscribedTokens(prev => {
        const newSet = new Set(prev);
        tokensToUnsubscribe.forEach(token => newSet.delete(token.pair));
        return newSet;
      });
    }
  }, [
    visibleTokens,
    subscribedTokens,
    tableData,
    subscribeToMultiplePairs,
    unsubscribeFromMultiplePairs,
  ]);

  useEffect(() => {
    const unsubscribe = addMessageListener(message => {
      console.log('WebSocket message in DataTable:', message);

      if (message.event === 'tick') {
        const tickData = message.data as TickEventPayload;

        setTableData(prevData => {
          return prevData.map(token => {
            if (token.pairAddress === tickData.pair.pair) {
              const latestSwap = tickData.swaps
                ?.filter(swap => !swap.isOutlier)
                ?.pop();

              if (latestSwap) {
                console.log('Updating token price:', latestSwap.priceToken1Usd);

                const totalSupply = parseFloat(
                  token.token1TotalSupplyFormatted || '0'
                );
                const newPrice = parseFloat(latestSwap.priceToken1Usd);
                const newMarketCap = totalSupply * newPrice;

                return {
                  ...token,
                  price: latestSwap.priceToken1Usd,
                  currentMcap: newMarketCap.toString(),
                };
              }
            }
            return token;
          });
        });
      }

      if (message.event === 'pair-stats') {
        const statsData = message.data as PairStatsMsgData;

        setTableData(prevData => {
          return prevData.map(token => {
            if (token.pairAddress === statsData.pair.pairAddress) {
              console.log('Updating token audit info');

              return {
                ...token,
                contractVerified: statsData.pair.isVerified,
                contractRenounced: statsData.pair.mintAuthorityRenounced,
                honeyPot: statsData.pair.token1IsHoneypot,
                mintable: statsData.pair.mintAuthorityRenounced,
                freezable: statsData.pair.freezeAuthorityRenounced,
              };
            }
            return token;
          });
        });
      }

      if (message.event === 'scanner-pairs') {
        const scannerData = message.data as ScannerPairsEventPayload;
        console.log('Received scanner-pairs update:', scannerData);

        setTableData(prevData => {
          const updatedData = scannerData.results.pairs.map(newToken => {
            const existingToken = prevData.find(
              t => t.pairAddress === newToken.pairAddress
            );

            if (existingToken) {
              return {
                ...newToken,
                price: existingToken.price || newToken.price,
                currentMcap: existingToken.currentMcap || newToken.currentMcap,
              };
            }

            return newToken;
          });

          const newPairAddresses = new Set(
            scannerData.results.pairs.map(t => t.pairAddress)
          );
          const filteredData = updatedData.filter(token =>
            newPairAddresses.has(token.pairAddress)
          );

          console.log(
            `Updated table data: ${filteredData.length} tokens (removed ${
              updatedData.length - filteredData.length
            })`
          );
          return filteredData;
        });
      }
    });

    return unsubscribe;
  }, [addMessageListener]);

  const table = useReactTable({
    data: tableData,
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
