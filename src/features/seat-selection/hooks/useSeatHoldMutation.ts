'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import type {
  SeatHoldRequest,
  SeatHoldResponse,
} from '@/features/seat-selection/lib/dto';

export const useSeatHoldMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: SeatHoldRequest): Promise<SeatHoldResponse> => {
      const response = await apiClient.post('/api/seats/hold', request);
      return response.data;
    },
    onSuccess: (data, variables) => {
      // 좌석 선점 성공 시 해당 콘서트의 좌석 데이터 갱신
      queryClient.invalidateQueries({ queryKey: ['seats', variables.concertId] });
    },
  });
};
