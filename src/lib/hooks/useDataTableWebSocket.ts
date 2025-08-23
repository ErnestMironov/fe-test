import { useEffect } from 'react';
import type {
  ScannerResult,
  ScannerPairsEventPayload,
  TickEventPayload,
  PairStatsMsgData,
} from '../../../test-task-types';
import { chainIdToName } from '../../../test-task-types';
import { useWebSocket } from './useWebSocket';

interface UseDataTableWebSocketParams {
  tableData: ScannerResult[];
  visibleTokens: Set<string>;
  subscribedTokens: Set<string>;
  setTableData: React.Dispatch<React.SetStateAction<ScannerResult[]>>;
  setSubscribedTokens: React.Dispatch<React.SetStateAction<Set<string>>>;
}

export const useDataTableWebSocket = ({
  tableData,
  visibleTokens,
  subscribedTokens,
  setTableData,
  setSubscribedTokens,
}: UseDataTableWebSocketParams) => {
  const {
    subscribeToMultiplePairs,
    unsubscribeFromMultiplePairs,
    subscribeToScannerFilter,
    addMessageListener,
  } = useWebSocket();

  useEffect(() => {
    if (tableData.length === 0) return;

    const scannerFilterMessage = {
      event: 'scanner-filter',
      data: {
        rankBy: 'volume',
        chain: chainIdToName(tableData[0].chainId),
        isNotHP: true,
      },
    };

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
      subscribeToMultiplePairs(tokensToSubscribe);
      setSubscribedTokens(prev => {
        const newSet = new Set(prev);
        tokensToSubscribe.forEach(token => newSet.add(token.pair));
        return newSet;
      });
    }

    if (tokensToUnsubscribe.length > 0) {
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
    setSubscribedTokens,
  ]);

  useEffect(() => {
    const unsubscribe = addMessageListener(message => {
      if (message.event === 'tick') {
        const tickData = message.data as TickEventPayload;

        setTableData(prevData => {
          return prevData.map(token => {
            if (token.pairAddress === tickData.pair.pair) {
              const latestSwap = tickData.swaps
                ?.filter(swap => !swap.isOutlier)
                ?.pop();

              if (latestSwap) {
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

          return filteredData;
        });
      }
    });

    return unsubscribe;
  }, [addMessageListener, setTableData]);
};
