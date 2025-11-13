'use client';

import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import type { ReservationFormData } from '@/features/reservation/hooks/use-reservation-form-validation';
import type { UseFormReturn } from 'react-hook-form';

interface SubmitReservationButtonProps {
  // react-hook-form의 form 객체
  form: UseFormReturn<ReservationFormData>;
  // 로딩 상태
  isPending: boolean;
  // 클릭 핸들러
  onSubmit: (data: Partial<ReservationFormData>) => void;
  disabled?: boolean;
}

/**
 * 예약 완료 제출 버튼 컴포넌트
 * 폼 검증 상태에 따라 활성화/비활성화
 * 로딩 중일 때 스피너 표시
 */
export const SubmitReservationButton = ({
  form,
  isPending,
  onSubmit,
  disabled = false,
}: SubmitReservationButtonProps) => {
  // 폼이 유효한지 확인
  const isFormValid = form.formState.isValid;

  return (
    <Button
      type="button"
      disabled={!isFormValid || isPending || disabled}
      onClick={form.handleSubmit(onSubmit)}
      className="w-full"
      size="lg"
    >
      {isPending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          예약 처리 중...
        </>
      ) : (
        '예약 완료'
      )}
    </Button>
  );
};
