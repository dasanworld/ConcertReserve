'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { SeatTierInfoCard } from '@/features/seat-selection/components/seat-tier-info';
import { SeatMapViewer } from '@/features/seat-selection/components/seat-map-viewer';
import { SelectedSeatsPanel } from '@/features/seat-selection/components/selected-seats-panel';
import { SeatHoldButton } from '@/features/seat-selection/components/seat-hold-button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  SeatSelectionProvider,
  useSeatSelectionContext,
} from '@/features/seat-selection/state/seat-selection-context';

interface SeatSelectionPageProps {
  params: Promise<{ id: string }>;
}

const SeatSelectionContent = () => {
  const router = useRouter();
  const {
    concertTitle,
    seatTiers,
    enhancedSeatMap,
    selectedSeatIdSet,
    selectedSeats,
    totalAmount,
    selectionError,
    isSeatMapLoading,
    seatMapError,
    canSubmitHold,
    toggleSeat,
    clearSelection,
    holdSeats,
    isHolding,
    holdErrorMessage,
  } = useSeatSelectionContext();

  if (isSeatMapLoading) {
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

  if (seatMapError) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            좌석 정보를 불러올 수 없습니다
          </h1>
          <p className="text-gray-600 mb-4">
            {seatMapError.message}
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

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm text-gray-600 hover:text-gray-800 mb-2"
        >
          ← 뒤로 가기
        </button>
        <h1 className="text-3xl font-bold tracking-tight">{concertTitle}</h1>
        <p className="mt-2 text-gray-600">좌석을 선택해주세요</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <SeatTierInfoCard tiers={seatTiers} />
          <SeatMapViewer
            seats={enhancedSeatMap}
            selectedSeatIds={selectedSeatIdSet}
            onSeatClick={toggleSeat}
            disabled={!canSubmitHold}
          />
        </div>

        <div className="space-y-6">
          <SelectedSeatsPanel
            selectedSeats={selectedSeats}
            totalPrice={totalAmount}
            onClearSelection={clearSelection}
          />

          <SeatHoldButton
            selectedCount={selectedSeats.length}
            isLoading={isHolding}
            onHoldSeats={holdSeats}
          />

          {selectionError && (
            <div className="text-sm text-red-600 text-center">
              {selectionError}
            </div>
          )}

          {holdErrorMessage && (
            <div className="text-sm text-red-600 text-center">
              {holdErrorMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function SeatSelectionPage({ params }: SeatSelectionPageProps) {
  const { id: concertId } = use(params);

  return (
    <SeatSelectionProvider concertId={concertId}>
      <SeatSelectionContent />
    </SeatSelectionProvider>
  );
}
