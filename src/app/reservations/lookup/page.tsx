'use client';

import { LookupFormHeader } from '@/features/reservation/components/lookup-form-header';
import { LookupForm } from '@/features/reservation/components/lookup-form';
import { SubmitLookupButton } from '@/features/reservation/components/submit-lookup-button';
import { useLookupFormValidation } from '@/features/reservation/hooks/use-lookup-form-validation';
import { useReservationLookupMutation } from '@/features/reservation/hooks/use-reservation-lookup-mutation';

/**
 * 예약 조회 페이지
 * 휴대폰 번호와 비밀번호로 예약 정보를 조회
 */
export default function ReservationLookupPage() {
  // 폼 검증 관리
  const form = useLookupFormValidation();

  // 예약 조회 뮤테이션
  const lookupMutation = useReservationLookupMutation();

  // 폼 제출 핸들러
  const handleSubmit = (data: { phoneNumber: string; password: string }) => {
    lookupMutation.mutate(data);
  };

  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-md space-y-8 px-4">
        {/* 헤더 */}
        <LookupFormHeader />

        {/* 폼 */}
        <div className="space-y-6 rounded-lg bg-white p-6 shadow-sm">
          <LookupForm form={form} />

          {/* 제출 버튼 */}
          <SubmitLookupButton
            form={form}
            isPending={lookupMutation.isPending}
            onSubmit={handleSubmit}
          />
        </div>

        {/* 도움말 */}
        <div className="space-y-2 rounded-lg bg-blue-50 p-4 text-sm text-gray-600">
          <p className="font-medium text-blue-900">💡 예약 조회 안내</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>예약 시 입력하신 휴대폰 번호를 정확히 입력해주세요</li>
            <li>비밀번호는 예약 시 설정한 비밀번호를 입력해주세요</li>
            <li>확정된 예약만 조회 가능합니다</li>
          </ul>
        </div>
      </div>
    </main>
  );
}

