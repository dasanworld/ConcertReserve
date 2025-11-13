'use client';

import { Button } from '@/components/ui/button';

interface SeatHoldButtonProps {
  selectedCount: number;
  isLoading: boolean;
  onHoldSeats: () => void;
  disabled?: boolean;
}

export const SeatHoldButton = ({
  selectedCount,
  isLoading,
  onHoldSeats,
  disabled = false,
}: SeatHoldButtonProps) => {
  const isDisabled = disabled || selectedCount === 0 || isLoading;

  const getButtonText = () => {
    if (isLoading) {
      return '처리 중...';
    }
    if (selectedCount === 0) {
      return '좌석을 선택해주세요';
    }
    return `예약하기 (${selectedCount}석 선택)`;
  };

  return (
    <Button
      size="lg"
      className="w-full"
      disabled={isDisabled}
      onClick={onHoldSeats}
    >
      {getButtonText()}
    </Button>
  );
};
