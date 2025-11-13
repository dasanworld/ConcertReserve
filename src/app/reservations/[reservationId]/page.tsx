'use client';

import { useParams, useRouter } from 'next/navigation';
import { useReservationDetailQuery } from '@/features/reservation/hooks/use-reservation-detail-query';
import { ReservationStatusBadge } from '@/features/reservation/components/reservation-status-badge';
import { ReservationInfo } from '@/features/reservation/components/reservation-info';
import { CancelReservationButton } from '@/features/reservation/components/cancel-reservation-button';
import { ActionButtons } from '@/features/reservation/components/action-buttons';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

/**
 * 예약 내역 상세 페이지
 * 예약 정보 조회 및 예약 취소 기능 제공
 */
export default function ReservationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const reservationId = params.reservationId as string;

  // 예약 상세 정보 조회
  const { data: reservation, isLoading, error } = useReservationDetailQuery(reservationId);

  // 로딩 상태
  if (isLoading) {
    return (
      <main className="min-h-screen bg-gray-50 py-12">
        <div className="mx-auto max-w-2xl px-4 space-y-8">
          {/* 헤더 로딩 */}
          <div className="space-y-3">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>

          {/* 컨텐츠 로딩 */}
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </div>
      </main>
    );
  }

  // 에러 상태
  if (error || !reservation) {
    return (
      <main className="min-h-screen bg-gray-50 py-12">
        <div className="mx-auto max-w-2xl px-4">
          <div className="space-y-4 text-center">
            <h1 className="text-2xl font-bold text-red-600">오류가 발생했습니다</h1>
            <p className="text-gray-600">
              예약 정보를 찾을 수 없습니다. 예약 번호를 다시 확인해주세요.
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => router.back()}>
                뒤로가기
              </Button>
              <Button onClick={() => router.push('/')}>홈으로</Button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-2xl px-4 space-y-8">
        {/* 페이지 헤더 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold tracking-tight">예약 내역 상세</h1>
            <ReservationStatusBadge status={reservation.status} />
          </div>
          <p className="text-gray-600">예약 번호: {reservation.reservationNumber}</p>
        </div>

        {/* 예약 정보 */}
        <ReservationInfo reservation={reservation} />

        {/* 예약 취소 버튼 (status가 confirmed일 때만) */}
        {reservation.status === 'confirmed' && (
          <CancelReservationButton
            reservationId={reservation.reservationId}
            status={reservation.status}
          />
        )}

        {/* 액션 버튼 */}
        <ActionButtons />
      </div>
    </main>
  );
}

