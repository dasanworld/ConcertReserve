'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import type { SeatsResponse } from '@/features/seat-selection/lib/dto';

export const useSeatsQuery = (concertId: string) => {
  return useQuery({
    queryKey: ['seats', concertId],
    queryFn: async (): Promise<SeatsResponse> => {
      const response = await apiClient.get(`/api/concerts/${concertId}/seats`);
      return response.data;
    },
    enabled: !!concertId,
    staleTime: 1000 * 30, // 30초 동안 fresh 상태 유지
    refetchInterval: 1000 * 60, // 1분마다 자동 갱신 (선점 만료 확인)
  });
};
