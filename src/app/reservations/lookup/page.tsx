'use client';

import { LookupFormHeader } from '@/features/reservation/components/lookup-form-header';
import { LookupForm } from '@/features/reservation/components/lookup-form';
import { SubmitLookupButton } from '@/features/reservation/components/submit-lookup-button';
import { ReservationLookupProvider } from '@/features/reservation/lookup/reservation-lookup-provider';

/**
 * 예약 조회 페이지
 * 휴대폰 번호와 비밀번호로 예약 정보를 조회
 */
export default function ReservationLookupPage() {
  return (
    <ReservationLookupProvider>
      <main className="min-h-screen bg-gray-50 py-12">
        <div className="mx-auto max-w-md space-y-8 px-4">
          <LookupFormHeader />

          <div className="space-y-6 rounded-lg bg-white p-6 shadow-sm">
            <LookupForm />
            <SubmitLookupButton />
          </div>

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
    </ReservationLookupProvider>
  );
}
