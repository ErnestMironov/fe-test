import { createColumnHelper } from '@tanstack/react-table';
import type { ScannerResult } from '../../test-task-types';
import {
  formatPrice,
  formatLargeNumberWithSuffix,
} from '../lib/utils/priceFormatter';
import { NetworkLogo } from './NetworkLogo';
import TelegramIcon from '../assets/icons/telegram.svg';
import DiscordIcon from '../assets/icons/discord.svg';

const columnHelper = createColumnHelper<ScannerResult>();

export const createDataTableColumns = () => [
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
