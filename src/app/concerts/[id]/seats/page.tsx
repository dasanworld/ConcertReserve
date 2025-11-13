'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { useSeatsQuery } from '@/features/seat-selection/hooks/useSeatsQuery';
import { useSeatHoldMutation } from '@/features/seat-selection/hooks/useSeatHoldMutation';
import { useSeatSelection } from '@/features/seat-selection/hooks/useSeatSelection';
import { SeatTierInfoCard } from '@/features/seat-selection/components/seat-tier-info';
import { SeatMapViewer } from '@/features/seat-selection/components/seat-map-viewer';
import { SelectedSeatsPanel } from '@/features/seat-selection/components/selected-seats-panel';
import { SeatHoldButton } from '@/features/seat-selection/components/seat-hold-button';
import { Skeleton } from '@/components/ui/skeleton';

interface SeatSelectionPageProps {
  params: Promise<{ id: string }>;
}

export default function SeatSelectionPage({ params }: SeatSelectionPageProps) {
  const { id: concertId } = use(params);
  const router = useRouter();

  const { data, isLoading, error } = useSeatsQuery(concertId);
  const holdMutation = useSeatHoldMutation();

  const {
    selectedSeatIds,
    selectedSeats,
    totalPrice,
    toggleSeat,
    clearSelection,
  } = useSeatSelection(data?.seats || []);

  const handleHoldSeats = async () => {
    try {
      const response = await holdMutation.mutateAsync({
        concertId,
        seatIds: Array.from(selectedSeatIds),
      });

      // 선점 성공 시 예약 정보 입력 페이지로 이동
      // TODO: 선점된 좌석 정보를 query parameter 또는 state로 전달
      router.push(
        `/book?concertId=${concertId}&holdExpiresAt=${encodeURIComponent(response.holdExpiresAt)}`
      );
    } catch (err) {
      console.error('Failed to hold seats:', err);
      // 에러 처리 (토스트 메시지 등)
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Skeleton className="h-8 w-64 mb-6" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            좌석 정보를 불러올 수 없습니다
          </h1>
          <p className="text-gray-600 mb-4">
            {error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'}
          </p>
          <button
            type="button"
            onClick={() => router.back()}
            className="text-blue-600 hover:underline"
          >
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* 헤더 */}
      <div className="mb-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm text-gray-600 hover:text-gray-800 mb-2"
        >
          ← 뒤로 가기
        </button>
        <h1 className="text-3xl font-bold tracking-tight">{data.concertTitle}</h1>
        <p className="mt-2 text-gray-600">좌석을 선택해주세요</p>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* 좌측: 등급 정보 + 좌석 배치도 */}
        <div className="lg:col-span-2 space-y-6">
          <SeatTierInfoCard tiers={data.tiers} />
          <SeatMapViewer
            seats={data.seats}
            selectedSeatIds={selectedSeatIds}
            onSeatClick={toggleSeat}
          />
        </div>

        {/* 우측: 선택된 좌석 + 예약 버튼 */}
        <div className="space-y-6">
          <SelectedSeatsPanel
            selectedSeats={selectedSeats}
            totalPrice={totalPrice}
            onClearSelection={clearSelection}
          />

          <SeatHoldButton
            selectedCount={selectedSeats.length}
            isLoading={holdMutation.isPending}
            onHoldSeats={handleHoldSeats}
          />

          {holdMutation.isError && (
            <div className="text-sm text-red-600 text-center">
              {holdMutation.error instanceof Error
                ? holdMutation.error.message
                : '좌석 선점에 실패했습니다. 다시 시도해주세요.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
