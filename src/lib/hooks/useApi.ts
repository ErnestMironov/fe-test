import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/axios';
import type { AxiosRequestConfig, AxiosResponse } from 'axios';

export function useApiQuery<TData = unknown>(
  queryKey: string[],
  endpoint: string,
  config?: AxiosRequestConfig
) {
  return useQuery({
    queryKey,
    queryFn: async (): Promise<TData> => {
      const response: AxiosResponse<TData> = await apiClient.get(
        endpoint,
        config
      );
      return response.data;
    },
  });
}
