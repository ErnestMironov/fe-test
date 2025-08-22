import React, { useState, useEffect, useMemo, memo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type SortingState,
  createColumnHelper,
} from '@tanstack/react-table';
import {
  useInfiniteTrendingTokens,
  useInfiniteNewTokens,
} from '../lib/hooks/useInfiniteScannerData';
import { useWebSocket } from '../lib/hooks/useWebSocket';
import type {
  ScannerResult,
  TickEventPayload,
  PairStatsMsgData,
  ScannerPairsEventPayload,
  SupportedChainName,
} from '../../test-task-types';
import { chainIdToName } from '../../test-task-types';
import {
  formatPrice,
  formatLargeNumberWithSuffix,
} from '../lib/utils/priceFormatter';
import {
  TableFilters,
  type TableFilters as TableFiltersType,
} from './TableFilters';
import EthIcon from '../assets/icons/eth.png';
import SolIcon from '../assets/icons/sol.png';
import BaseIcon from '../assets/icons/base.png';
import BscIcon from '../assets/icons/bsc.png';
import TelegramIcon from '../assets/icons/telegram.svg';
import DiscordIcon from '../assets/icons/discord.svg';

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
      <div className="relative flex items-center gap-3 pl-3 py-2">
        <div className="absolute inset-0 flex opacity-50">
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
                        'linear-gradient(to bottom, rgba(34, 197, 94, 0.8), rgba(34, 197, 94, 0))',
                    }}
                  />
                  <div
                    className="h-full"
                    style={{
                      width: `${sellRatio}%`,
                      background:
                        'linear-gradient(to bottom, rgba(239, 68, 68, 0.8), rgba(239, 68, 68, 0))',
                    }}
                  />
                </>
              );
            }
            return null;
          })()}
        </div>
        <div className="relative z-10 flex items-center gap-2">
          {info.row.original.token1ImageUri ? (
            <img
              src={info.row.original.token1ImageUri}
              alt={info.row.original.token1Symbol}
              className="size-8 rounded-full object-cover object-center"
            />
          ) : (
            <div className="size-8 rounded-full bg-[#121417] flex items-center justify-center">
              <span className="text-xs">
                {info.row.original.token1Symbol.charAt(0)}
              </span>
            </div>
          )}
          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              <span className="text-xs row-counter">#</span>
              <span className="font-medium text-sm">
                {info.row.original.token1Symbol}
              </span>
              <span>/</span>
              <span className="font-medium text-sm">
                {info.row.original.token0Symbol}
              </span>
            </div>
            <div className="flex items-center gap-1 mt-1">
              <NetworkLogo chainId={info.row.original.chainId} />
              {/* Discord Link */}
              {info.row.original.discordLink && (
                <a
                  href={info.row.original.discordLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-4 h-4 rounded-full bg-white flex items-center justify-center hover:bg-purple-600 transition-colors cursor-pointer"
                  title="Discord"
                >
                  <img src={DiscordIcon} alt="Discord" className="w-4 h-4" />
                </a>
              )}

              {/* Telegram Link */}
              {info.row.original.telegramLink && (
                <a
                  href={info.row.original.telegramLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-4 h-4 rounded-full bg-pink-500 flex items-center justify-center hover:bg-pink-600 transition-colors cursor-pointer"
                  title="Telegram"
                >
                  <img src={TelegramIcon} alt="Telegram" className="w-4 h-4" />
                </a>
              )}

              {/* Twitter/X Link */}
              {info.row.original.twitterLink && (
                <a
                  href={info.row.original.twitterLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-4 h-4 rounded-full bg-gray-600 flex items-center justify-center hover:bg-gray-700 transition-colors cursor-pointer"
                  title="Twitter/X"
                >
                  <span className="text-white text-xs">𝕏</span>
                </a>
              )}

              {/* Website Link */}
              {info.row.original.webLink && (
                <a
                  href={info.row.original.webLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-4 h-4 rounded-full bg-gray-600 flex items-center justify-center hover:bg-gray-700 transition-colors cursor-pointer"
                  title="Website"
                >
                  <span className="text-white text-xs">🌐</span>
                </a>
              )}
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
    cell: info => formatLargeNumberWithSuffix(info.getValue(), '$'),
  }),
  columnHelper.accessor('txns', {
    header: 'Transactions',
    cell: info => {
      const value = info.getValue();
      const buys = info.row.original.buys;
      const sells = info.row.original.sells;

      return (
        <div className="flex flex-col items-center gap-1">
          <span>{formatLargeNumberWithSuffix(value)}</span>

          <span className="text-xs text-gray-500">
            <span className="text-green-500">
              {formatLargeNumberWithSuffix(buys)}
            </span>
            /
            <span className="text-red-500">
              {formatLargeNumberWithSuffix(sells)}
            </span>
          </span>
        </div>
      );
    },
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
    cell: info => formatLargeNumberWithSuffix(info.getValue(), '$'),
  }),
  columnHelper.accessor('liquidity', {
    header: 'Liquidity',
    cell: info => formatLargeNumberWithSuffix(info.getValue(), '$'),
  }),
  columnHelper.accessor('diff5M', {
    header: '5M',
    cell: info => {
      const value = info.getValue();

      if (!value || Number(value) === 0)
        return <span className="text-gray-500">0%</span>;

      if (Number(value) > 0) {
        return <span className="text-green-500">+{value}%</span>;
      }

      if (Number(value) < 0) {
        return <span className="text-red-500">{value}%</span>;
      }

      return `${value}%`;
    },
  }),
  columnHelper.accessor('diff1H', {
    header: '1H',
    cell: info => {
      const value = info.getValue();

      if (!value || Number(value) === 0)
        return <span className="text-gray-500">0%</span>;

      if (Number(value) > 0) {
        return <span className="text-green-500">+{value}%</span>;
      }

      if (Number(value) < 0) {
        return <span className="text-red-500">{value}%</span>;
      }

      return `${value}%`;
    },
  }),
  columnHelper.accessor('diff6H', {
    header: '6H',
    cell: info => {
      const value = info.getValue();

      if (!value || Number(value) === 0)
        return <span className="text-gray-500">0%</span>;

      if (Number(value) > 0) {
        return <span className="text-green-500">+{value}%</span>;
      }

      if (Number(value) < 0) {
        return <span className="text-red-500">{value}%</span>;
      }

      return `${value}%`;
    },
  }),
  columnHelper.accessor('diff24H', {
    header: '24H',
    cell: info => {
      const value = info.getValue();

      if (!value || Number(value) === 0)
        return <span className="text-gray-500">0%</span>;

      if (Number(value) > 0) {
        return <span className="text-green-500">+{value}%</span>;
      }

      if (Number(value) < 0) {
        return <span className="text-red-500">{value}%</span>;
      }

      return `${value}%`;
    },
  }),
  columnHelper.accessor('contractVerified', {
    header: 'Audit',
    cell: info => {
      const honeyPot = info.row.original.honeyPot;
      const mintable = info.row.original.mintable;
      const freezable = info.row.original.freezable;
      const burned = info.row.original.burned;

      return (
        <div className="flex flex-col items-center space-y-1">
          <div className="flex items-center space-x-2">
            <div className="flex flex-col items-center">
              <div
                className={`w-4 h-4 rounded-full border-2 ${
                  mintable
                    ? 'border-teal-400 bg-teal-400'
                    : 'border-red-500 bg-red-500'
                } flex items-center justify-center`}
              >
                {mintable ? (
                  <svg
                    className="w-2.5 h-2.5 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <span className="text-white text-xs font-bold relative bottom-[0.05rem]">
                    ×
                  </span>
                )}
              </div>
              <span className="text-xs text-white mt-1">Mintable</span>
            </div>

            <div className="flex flex-col items-center">
              <div
                className={`w-4 h-4 rounded-full border-2 ${
                  freezable
                    ? 'border-teal-400 bg-teal-400'
                    : 'border-red-500 bg-red-500'
                } flex items-center justify-center`}
              >
                {freezable ? (
                  <svg
                    className="w-2.5 h-2.5 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <span className="text-white text-xs font-bold relative bottom-[0.05rem]">
                    ×
                  </span>
                )}
              </div>
              <span className="text-xs text-white mt-1">Freezeable</span>
            </div>

            <div className="flex flex-col items-center">
              <div
                className={`w-4 h-4 rounded-full border-2 ${
                  burned
                    ? 'border-teal-400 bg-teal-400'
                    : 'border-red-500 bg-red-500'
                } flex items-center justify-center`}
              >
                {burned ? (
                  <svg
                    className="w-2.5 h-2.5 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <span className="text-white text-xs font-bold relative bottom-[0.05rem]">
                    ×
                  </span>
                )}
              </div>
              <span className="text-xs text-white mt-1">Burned</span>
            </div>

            <div className="flex flex-col items-center">
              <div
                className={`w-4 h-4 rounded-full border-2 ${
                  honeyPot
                    ? 'border-teal-400 bg-teal-400'
                    : 'border-red-500 bg-red-500'
                } flex items-center justify-center`}
              >
                {honeyPot ? (
                  <svg
                    className="w-2.5 h-2.5 text-white"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <span className="text-white text-xs font-bold relative bottom-[0.05rem]">
                    ×
                  </span>
                )}
              </div>
              <span className="text-xs text-white mt-1">Honeypot</span>
            </div>
          </div>
        </div>
      );
    },
  }),
];

interface DataTableProps {
  type: 'trending' | 'new';
}

export const DataTable = memo(function DataTable({ type }: DataTableProps) {
  const [sorting, setSorting] = useState<SortingState>(
    type === 'trending' ? [{ id: 'volume', desc: true }] : []
  );
  const [tableData, setTableData] = useState<ScannerResult[]>([]);
  const [visibleTokens, setVisibleTokens] = useState<Set<string>>(new Set());
  const [subscribedTokens, setSubscribedTokens] = useState<Set<string>>(
    new Set()
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
    console.log(`[${type}] Filter change:`, key, '=', value);
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleClearFilters = () => {
    console.log(`[${type}] Clearing filters`);
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

  const filteredData = useMemo(() => {
    console.log(`[${type}] Filtering data with filters:`, filters);
    console.log(`[${type}] Raw data length:`, memoizedData.length);

    const filtered = memoizedData.filter(token => {
      // Chain filter
      if (filters.chain && chainIdToName(token.chainId) !== filters.chain) {
        return false;
      }

      // Volume filter
      if (
        filters.minVolume &&
        parseFloat(token.volume || '0') < filters.minVolume
      ) {
        return false;
      }

      // Age filter
      if (filters.maxAge) {
        const tokenAge = new Date(token.age);
        const now = new Date();
        const ageInHours =
          (now.getTime() - tokenAge.getTime()) / (1000 * 60 * 60);
        if (ageInHours > filters.maxAge) {
          return false;
        }
      }

      // Market Cap filter
      if (filters.minMarketCap) {
        const marketCap = parseFloat(calculateMarketCap(token));
        if (marketCap < filters.minMarketCap) {
          return false;
        }
      }

      // Honeypot filter
      if (filters.excludeHoneypots && token.honeyPot) {
        return false;
      }

      return true;
    });

    console.log(`[${type}] Filtered data length:`, filtered.length);
    return filtered;
  }, [memoizedData, filters, type]);

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
    const processedData = filteredData.map(token => ({
      ...token,
      currentMcap: calculateMarketCap(token),
    }));
    setTableData(processedData);

    const currentTokenIds = new Set(
      processedData.map(token => token.pairAddress)
    );

    setVisibleTokens(prev => {
      const filtered = new Set<string>();
      prev.forEach(tokenId => {
        if (currentTokenIds.has(tokenId)) {
          filtered.add(tokenId);
        }
      });
      return filtered;
    });

    setSubscribedTokens(prev => {
      const filtered = new Set<string>();
      prev.forEach(tokenId => {
        if (currentTokenIds.has(tokenId)) {
          filtered.add(tokenId);
        }
      });
      return filtered;
    });
  }, [filteredData]);

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
                burned: parseFloat(statsData.pair.burnedSupply || '0') > 0,
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
});
