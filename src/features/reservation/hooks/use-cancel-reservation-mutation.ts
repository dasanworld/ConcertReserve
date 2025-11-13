'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/remote/api-client';

interface CancelReservationResponse {
  reservationId: string;
  reservationNumber: string;
  message: string;
  cancelledAt: string;
  releasedSeats: number;
}

/**
 * 예약 취소 뮤테이션 훅
 * React Query를 사용하여 예약 취소 API 호출
 */
export const useCancelReservationMutation = (reservationId: string) => {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.delete<CancelReservationResponse>(
        `/reservations/${reservationId}`,
      );
      return response;
    },
    onSuccess: (response: any) => {
      // axios 응답 데이터 추출
      const data = response.data || response;
      
      // 성공 시 토스트 메시지 표시
      toast({
        title: '취소 완료',
        description: data.message || '예약이 취소되었습니다.',
        variant: 'default',
      });

      // 예약 상세 데이터 무효화 (refetch)
      queryClient.invalidateQueries({
        queryKey: ['reservation', 'detail', reservationId],
      });

      // 홈 페이지로 리다이렉트
      setTimeout(() => {
        router.push('/');
      }, 1500);
    },
    onError: (error: any) => {
      // 에러 처리
      const errorCode = error?.response?.data?.error?.code;
      const errorMessage = error?.response?.data?.error?.message || '예약 취소에 실패했습니다.';

      toast({
        title: '오류',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });
};

