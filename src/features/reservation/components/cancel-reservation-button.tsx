'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { CancelConfirmDialog } from './cancel-confirm-dialog';
import { useCancelReservationMutation } from '@/features/reservation/hooks/use-cancel-reservation-mutation';

interface CancelReservationButtonProps {
  // 예약 ID
  reservationId: string;
  // 예약 상태
  status: 'confirmed' | 'cancelled';
}

/**
 * 예약 취소 버튼 컴포넌트
 * status가 confirmed일 때만 활성화
 * 클릭 시 확인 대화상자 표시
 */
export const CancelReservationButton = ({
  reservationId,
  status,
}: CancelReservationButtonProps) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const cancelMutation = useCancelReservationMutation(reservationId);

  // 이미 취소된 예약이면 버튼 비활성화
  if (status === 'cancelled') {
    return (
      <Button disabled className="w-full">
        예약 취소됨
      </Button>
    );
  }

  const handleCancelClick = () => {
    setDialogOpen(true);
  };

  const handleConfirm = () => {
    cancelMutation.mutate();
  };

  const handleCancel = () => {
    setDialogOpen(false);
  };

  return (
    <>
      <Button
        variant="destructive"
        disabled={cancelMutation.isPending}
        onClick={handleCancelClick}
        className="w-full"
      >
        {cancelMutation.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            취소 처리 중...
          </>
        ) : (
          '예약 취소'
        )}
      </Button>

      <CancelConfirmDialog
        isOpen={dialogOpen}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        isLoading={cancelMutation.isPending}
      />
    </>
  );
};

