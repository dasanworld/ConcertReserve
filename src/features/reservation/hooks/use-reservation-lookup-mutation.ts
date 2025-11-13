'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/remote/api-client';
import type { ReservationLookupResponse } from '@/features/reservation/backend/schema';

/**
 * 예약 조회 뮤테이션 훅
 * React Query를 사용하여 예약 조회 API 호출
 */
export const useReservationLookupMutation = () => {
  const router = useRouter();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: { phoneNumber: string; password: string }) => {
      const response = await apiClient.post<ReservationLookupResponse>(
        '/reservations/lookup',
        data,
      );
      return response;
    },
    onSuccess: (data) => {
      // 성공 시 예약 상세 페이지로 리다이렉트
      toast({
        title: '성공',
        description: '예약을 조회했습니다.',
        variant: 'default',
      });
      router.push(data.redirectUrl);
    },
    onError: (error: any) => {
      // 에러 처리
      const errorMessage =
        error?.response?.data?.error?.message || '예약 조회에 실패했습니다. 잠시 후 다시 시도해주세요.';

      toast({
        title: '오류',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });
};

