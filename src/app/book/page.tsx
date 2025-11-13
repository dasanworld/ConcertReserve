'use client';

import { ReservationProcessProvider } from '@/features/reservation/process/reservation-process-provider';
import { useReservationProcessContext } from '@/features/reservation/process/reservation-process-provider';
import { SelectedSeatsPreview } from '@/features/reservation/components/selected-seats-preview';
import { HoldExpiryTimer } from '@/features/reservation/components/hold-expiry-timer';
import { ReservationForm } from '@/features/reservation/components/reservation-form';
import { SubmitReservationButton } from '@/features/reservation/components/submit-reservation-button';
import { Skeleton } from '@/components/ui/skeleton';

const ReservationProcessContent = () => {
  const {
    isReady,
    heldSeats,
    totalAmount,
    countdownSeconds,
    isHoldExpired,
    form,
    isSubmitting,
    submissionError,
    submitReservation,
  } = useReservationProcessContext();

  if (!isReady) {
    return (
      <main className="min-h-screen bg-gray-50 py-12">
        <div className="mx-auto max-w-2xl px-4 space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </main>
    );
  }

  // isReady 상태가 아니면 로딩 상태 유지 (Effect에서 리다이렉트 처리)
  if (!isReady) {
    return (
      <main className="min-h-screen bg-gray-50 py-12">
        <div className="mx-auto max-w-2xl px-4 space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </main>
    );
  }

  if (heldSeats.length === 0) {
    return (
      <main className="min-h-screen bg-gray-50 py-12">
        <div className="mx-auto max-w-2xl px-4">
          <div className="rounded-lg bg-white p-8 text-center shadow-sm">
            <h1 className="text-2xl font-bold text-gray-900">선점된 좌석이 없습니다</h1>
            <p className="mt-2 text-gray-600">
              좌석 선택 페이지에서 다시 시도해주세요.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const handleSubmit = form.handleSubmit((data) => submitReservation(data));

  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-2xl px-4 space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">예약 정보 입력</h1>
          <p className="text-gray-600">선점된 좌석 정보를 확인하고 예약을 완료해주세요.</p>
        </div>

        <SelectedSeatsPreview seats={heldSeats} totalAmount={totalAmount} />

        <HoldExpiryTimer remainingSeconds={countdownSeconds} isExpired={isHoldExpired} />

        <div className="space-y-6 rounded-lg bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-xl font-semibold mb-4">예약자 정보</h2>
            <ReservationForm form={form} />
          </div>

          <SubmitReservationButton
            form={form}
            isPending={isSubmitting}
            onSubmit={handleSubmit}
            disabled={isHoldExpired}
          />

          {submissionError && (
            <p className="text-sm text-red-600 text-center">{submissionError}</p>
          )}
        </div>

        <div className="space-y-2 rounded-lg bg-blue-50 p-4 text-sm text-gray-600">
          <p className="font-medium text-blue-900">💡 예약 안내</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>선점 시간이 만료되면 좌석이 자동으로 해제됩니다.</li>
            <li>휴대폰 번호와 비밀번호는 나중에 예약 조회 시 필요합니다.</li>
            <li>입력하신 정보는 안전하게 보호됩니다.</li>
          </ul>
        </div>
      </div>
    </main>
  );
};

export default function BookPage() {
  return (
    <ReservationProcessProvider>
      <ReservationProcessContent />
    </ReservationProcessProvider>
  );
}
