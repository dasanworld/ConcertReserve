'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/remote/api-client';
import type { CreateReservationResponse } from '@/features/reservation/backend/schema';

interface CreateReservationPayload {
  seatIds: string[];
  customerName: string;
  phoneNumber: string;
  password: string;
}

/**
 * 예약 생성 뮤테이션 훅
 * React Query를 사용하여 예약 생성 API 호출
 */
export const useCreateReservationMutation = () => {
  const router = useRouter();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateReservationPayload) => {
      const response = await apiClient.post<CreateReservationResponse>(
        '/reservations',
        data,
      );
      return response;
    },
    onSuccess: (response: any) => {
      // axios 응답 데이터 추출
      const data = response.data || response;
      
      // 성공 시 예약 완료 페이지로 리다이렉트
      toast({
        title: '성공',
        description: '예약이 완료되었습니다.',
        variant: 'default',
      });
      router.push(`/reservations/complete?id=${data.reservationId}`);
    },
    onError: (error: any) => {
      // 에러 처리
      const errorCode = error?.response?.data?.error?.code;
      const errorMessage = error?.response?.data?.error?.message || '예약 생성 중 오류가 발생했습니다.';

      // 선점 만료 에러 시 좌석 선택 페이지로 리다이렉트
      if (errorCode === 'SEAT_HOLD_EXPIRED') {
        toast({
          title: '선점 만료',
          description: '좌석 선점 시간이 만료되었습니다. 좌석을 다시 선택해주세요.',
          variant: 'destructive',
        });
        router.push('/concerts/[concertId]/seats'); // 동적이므로 뒤로가기 권장
        return;
      }

      toast({
        title: '오류',
        description: errorMessage,
        variant: 'destructive',
      });
    },
  });
};

