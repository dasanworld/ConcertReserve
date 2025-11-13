'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import {
  ConcertDetailResponseSchema,
  type ConcertDetailResponse,
} from '@/features/concert/lib/dto';

export const useConcertDetailQuery = (concertId: string) => {
  return useQuery({
    queryKey: ['concert', 'detail', concertId],
    queryFn: async (): Promise<ConcertDetailResponse> => {
      const response = await apiClient.get(`/api/concerts/${concertId}`);
      const parsed = ConcertDetailResponseSchema.safeParse(response.data);

      if (!parsed.success) {
        throw new Error('Invalid concert detail response');
      }

      return parsed.data;
    },
    enabled: !!concertId,
  });
};
