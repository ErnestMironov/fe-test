import { useInfiniteQuery } from '@tanstack/react-query';
import { apiClient } from '../api/axios';
import type {
  ScannerApiResponse,
  GetScannerResultParams,
  OrderBy,
  SerdeRankBy,
} from '../../../test-task-types';

interface UseInfiniteScannerDataParams
  extends Omit<GetScannerResultParams, 'page'> {
  pageSize?: number;
  orderBy?: OrderBy;
  rankBy?: SerdeRankBy;
}

export function useInfiniteScannerData(params?: UseInfiniteScannerDataParams) {
  return useInfiniteQuery({
    queryKey: [
      'scanner',
      'infinite',
      params ? JSON.stringify(params) : 'default',
    ],
    queryFn: async ({ pageParam = 1 }) => {
      const queryParams = new URLSearchParams();

      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            if (Array.isArray(value)) {
              value.forEach(v => queryParams.append(key, v.toString()));
            } else {
              queryParams.append(key, value.toString());
            }
          }
        });
      }

      queryParams.append('page', pageParam.toString());

      const endpoint = `/scanner?${queryParams.toString()}`;
      const response = await apiClient.get<ScannerApiResponse>(endpoint);
      return response.data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const totalLoaded = allPages.reduce(
        (acc, page) => acc + (page.pairs?.length || 0),
        0
      );
      if (totalLoaded < lastPage.totalRows) {
        return allPages.length + 1;
      }
      return undefined;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useInfiniteTrendingTokens() {
  return useInfiniteScannerData({
    rankBy: 'volume',
    orderBy: 'desc',
    minVol24H: 1000,
    isNotHP: true,
    maxAge: 7 * 24 * 60 * 60,
  });
}

export function useInfiniteNewTokens() {
  return useInfiniteScannerData({
    rankBy: 'age',
    orderBy: 'desc',
    maxAge: 24 * 60 * 60,
    isNotHP: true,
  });
}
