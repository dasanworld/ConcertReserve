'use client';

import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import type { LookupFormData } from '@/features/reservation/hooks/use-lookup-form-validation';
import type { UseFormReturn } from 'react-hook-form';

interface SubmitLookupButtonProps {
  // react-hook-form의 form 객체
  form: UseFormReturn<LookupFormData>;
  // 로딩 상태
  isPending: boolean;
  // 클릭 핸들러
  onSubmit: (data: LookupFormData) => void;
}

/**
 * 예약 조회 제출 버튼 컴포넌트
 * 폼 검증 상태에 따라 활성화/비활성화
 * 로딩 중일 때 스피너 표시
 */
export const SubmitLookupButton = ({ form, isPending, onSubmit }: SubmitLookupButtonProps) => {
  // 폼이 유효한지 확인
  const isFormValid = form.formState.isValid;

  return (
    <Button
      type="button"
      disabled={!isFormValid || isPending}
      onClick={form.handleSubmit(onSubmit)}
      className="w-full"
      size="lg"
    >
      {isPending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          조회 중...
        </>
      ) : (
        '예약 조회'
      )}
    </Button>
  );
};

