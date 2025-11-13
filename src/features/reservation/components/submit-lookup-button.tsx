'use client';

import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useReservationLookupContext } from '@/features/reservation/lookup/reservation-lookup-provider';

export const SubmitLookupButton = () => {
  const { lookupForm, isLookingUp, lookupReservation } =
    useReservationLookupContext();

  const isDisabled =
    isLookingUp ||
    lookupForm.phoneNumber.trim().length === 0 ||
    lookupForm.password.trim().length === 0;

  return (
    <Button
      type="button"
      disabled={isDisabled}
      onClick={lookupReservation}
      className="w-full"
      size="lg"
    >
      {isLookingUp ? (
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
