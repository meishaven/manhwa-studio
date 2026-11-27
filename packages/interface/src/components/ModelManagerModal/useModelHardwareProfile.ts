import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';

import { buildUrl } from '@/config/api';
import { aioDeviceInfoSchema } from '@/models/aioStageCatalog';
import { useAioPipelineStore } from '@/pages/dashboard/stores/aio-pipeline-store';
import { fetchWithTimeoutAndRetry } from '@/utils/http';

export function useModelHardwareProfile(open: boolean) {
  const storedDeviceInfo = useAioPipelineStore((state) => state.aioDeviceInfo);
  const setDeviceInfo = useAioPipelineStore((state) => state.setAioDeviceInfo);
  const endpoint = buildUrl('localUrl', '/device/info');

  const query = useQuery({
    queryKey: ['model-manager', 'hardware-profile', endpoint],
    enabled: open,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    retry: 0,
    refetchOnWindowFocus: false,
    queryFn: async ({ signal }) => {
      const response = await fetchWithTimeoutAndRetry(
        endpoint,
        { method: 'GET' },
        { timeoutMs: 10_000, retryCount: 0, signal },
      );

      if (!response.ok) {
        throw new Error(`HARDWARE_PROFILE_HTTP_${response.status}`);
      }

      const payload: unknown = await response.json();
      return aioDeviceInfoSchema.parse(payload);
    },
  });

  useEffect(() => {
    if (query.data !== undefined) {
      setDeviceInfo(query.data);
    }
  }, [query.data, setDeviceInfo]);

  return {
    deviceInfo: query.data ?? storedDeviceInfo,
    loading: query.isFetching,
    failed: query.isError && query.data === undefined && storedDeviceInfo === null,
    refresh: query.refetch,
  };
}
