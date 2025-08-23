import { useState, useEffect } from 'react';
import type { ScannerResult } from '../../../test-task-types';

interface UseDataTableStateParams {
  filteredData: ScannerResult[];
}

export const useDataTableState = ({
  filteredData,
}: UseDataTableStateParams) => {
  const [tableData, setTableData] = useState<ScannerResult[]>([]);
  const [visibleTokens, setVisibleTokens] = useState<Set<string>>(new Set());
  const [subscribedTokens, setSubscribedTokens] = useState<Set<string>>(
    new Set()
  );

  const calculateMarketCap = (token: ScannerResult): string => {
    if (token.currentMcap && token.currentMcap !== '0') {
      return token.currentMcap;
    }

    if (token.price && token.token1TotalSupplyFormatted) {
      const price = parseFloat(token.price);
      const supply = parseFloat(token.token1TotalSupplyFormatted);
      if (!isNaN(price) && !isNaN(supply)) {
        return (price * supply).toString();
      }
    }

    if (token.pairMcapUsdInitial) {
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

  return {
    tableData,
    setTableData,
    visibleTokens,
    setVisibleTokens,
    subscribedTokens,
    setSubscribedTokens,
  };
};
