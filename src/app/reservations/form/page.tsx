'use client';

import { useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { SelectedSeatsPreview } from '@/features/reservation/components/selected-seats-preview';
import { HoldExpiryTimer } from '@/features/reservation/components/hold-expiry-timer';
import { ReservationForm } from '@/features/reservation/components/reservation-form';
import { SubmitReservationButton } from '@/features/reservation/components/submit-reservation-button';
import { useReservationFormValidation } from '@/features/reservation/hooks/use-reservation-form-validation';
import { useCreateReservationMutation } from '@/features/reservation/hooks/use-create-reservation-mutation';
import type { SeatDetail } from '@/features/reservation/backend/schema';

/**
 * 예약 정보 입력 페이지
 * 선정된 좌석으로 예약 정보를 입력하고 예약 완료
 */
export default function ReservationFormPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // 클라이언트 상태에서 선정된 좌석 정보 관리
  const [selectedSeats, setSelectedSeats] = useState<SeatDetail[]>([]);
  const [holdExpiresAt, setHoldExpiresAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 폼 검증 관리
  const form = useReservationFormValidation();

  // 예약 생성 뮤테이션
  const createReservationMutation = useCreateReservationMutation();

  // 페이지 진입 시 선정된 좌석 정보 추출
  useEffect(() => {
    const seatsParam = searchParams.get('seats');
    const expiresAtParam = searchParams.get('expiresAt');

    if (!seatsParam) {
      // 좌석 정보가 없으면 좌석 선택 페이지로 리다이렉트
      router.push('/');
      return;
    }

    try {
      // URL에서 Base64로 인코딩된 좌석 정보 디코딩
      const decodedSeats = JSON.parse(atob(seatsParam)) as SeatDetail[];
      setSelectedSeats(decodedSeats);
      setHoldExpiresAt(expiresAtParam);
    } catch (error) {
      console.error('Failed to parse seats from URL:', error);
      router.push('/');
    } finally {
      setIsLoading(false);
    }
  }, [searchParams, router]);

  // 폼 제출 핸들러
  const handleSubmit = (data: Partial<{ customerName: string; phoneNumber: string; password: string }>) => {
    if (selectedSeats.length === 0 || !data.customerName || !data.phoneNumber || !data.password) {
      return;
    }

    const seatIds = selectedSeats.map((seat) => seat.seatId);

    createReservationMutation.mutate({
      seatIds,
      customerName: data.customerName,
      phoneNumber: data.phoneNumber,
      password: data.password,
    });
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gray-50 py-12">
        <div className="mx-auto max-w-2xl px-4">
          <div className="text-center">
            <p className="text-gray-600">페이지를 준비하고 있습니다...</p>
          </div>
        </div>
      </main>
    );
  }

  if (selectedSeats.length === 0) {
    return (
      <main className="min-h-screen bg-gray-50 py-12">
        <div className="mx-auto max-w-2xl px-4">
          <div className="text-center">
            <p className="text-gray-600">선택한 좌석이 없습니다.</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-2xl px-4 space-y-8">
        {/* 페이지 제목 */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">예약 정보 입력</h1>
          <p className="text-gray-600">선정된 좌석으로 예약을 완료해주세요.</p>
        </div>

        {/* 좌석 정보 미리보기 */}
        <SelectedSeatsPreview seats={selectedSeats} />

        {/* 선점 만료 타이머 */}
        <HoldExpiryTimer expiresAt={holdExpiresAt} />

        {/* 예약 정보 입력 폼 */}
        <div className="space-y-6 rounded-lg bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-xl font-semibold mb-4">예약자 정보</h2>
            <ReservationForm form={form} />
          </div>

          {/* 제출 버튼 */}
          <SubmitReservationButton
            form={form}
            isPending={createReservationMutation.isPending}
            onSubmit={handleSubmit}
          />
        </div>

        {/* 안내 사항 */}
        <div className="space-y-2 rounded-lg bg-blue-50 p-4 text-sm text-gray-600">
          <p className="font-medium text-blue-900">💡 예약 안내</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>선점 시간이 만료되면 좌석이 자동으로 해제됩니다</li>
            <li>휴대폰 번호와 비밀번호는 나중에 예약 조회 시 필요합니다</li>
            <li>입력하신 정보는 안전하게 보호됩니다</li>
          </ul>
        </div>
      </div>
    </main>
  );
}

