'use client';

import { Button } from '@/components/ui/button';
import { ReservationInfo } from '@/features/reservation/components/reservation-info';
import { CancelConfirmDialog } from '@/features/reservation/components/cancel-confirm-dialog';
import { CancelResultDialog } from '@/features/reservation/components/cancel-result-dialog';
import { useReservationLookupContext } from '@/features/reservation/lookup/reservation-lookup-provider';

export const LookupResultPanel = () => {
  const {
    reservationDetail,
    canCancel,
    isCancelModalOpen,
    isCancelling,
    cancelError,
    isResultDialogOpen,
    resultDialogSuccess,
    resultDialogMessage,
    showCancelModal,
    hideCancelModal,
    cancelReservation,
    closeResultDialog,
  } = useReservationLookupContext();

  if (!reservationDetail) {
    return null;
  }

  return (
    <div className="space-y-4 rounded-lg bg-white p-6 shadow-sm">
      <ReservationInfo reservation={reservationDetail} />

      {cancelError && (
        <div className="text-sm text-red-600">{cancelError}</div>
      )}

      <Button
        type="button"
        variant="destructive"
        disabled={!canCancel || isCancelling}
        onClick={showCancelModal}
        className="w-full"
      >
        예약 취소
      </Button>

      <CancelConfirmDialog
        isOpen={isCancelModalOpen}
        onConfirm={cancelReservation}
        onCancel={hideCancelModal}
        isLoading={isCancelling}
      />

      <CancelResultDialog
        isOpen={isResultDialogOpen}
        isSuccess={resultDialogSuccess}
        message={resultDialogMessage}
        onClose={closeResultDialog}
      />
    </div>
  );
};
