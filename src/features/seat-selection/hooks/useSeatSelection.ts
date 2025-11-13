'use client';

import { useState, useCallback, useMemo } from 'react';
import type { SeatInfo } from '@/features/seat-selection/lib/dto';
import { SEAT_SELECTION_LIMITS } from '@/features/seat-selection/constants';

export const useSeatSelection = (seats: SeatInfo[]) => {
  const [selectedSeatIds, setSelectedSeatIds] = useState<Set<string>>(new Set());

  const toggleSeat = useCallback(
    (seatId: string) => {
      setSelectedSeatIds((prev) => {
        const newSet = new Set(prev);

        if (newSet.has(seatId)) {
          // 이미 선택된 좌석 -> 해제
          newSet.delete(seatId);
        } else {
          // 최대 선택 개수 체크
          if (newSet.size >= SEAT_SELECTION_LIMITS.MAX) {
            return prev; // 최대 개수 초과 시 변경하지 않음
          }
          newSet.add(seatId);
        }

        return newSet;
      });
    },
    [],
  );

  const clearSelection = useCallback(() => {
    setSelectedSeatIds(new Set());
  }, []);

  const isSelected = useCallback(
    (seatId: string) => {
      return selectedSeatIds.has(seatId);
    },
    [selectedSeatIds],
  );

  const selectedSeats = useMemo(() => {
    return seats.filter((seat) => selectedSeatIds.has(seat.id));
  }, [seats, selectedSeatIds]);

  const totalPrice = useMemo(() => {
    return selectedSeats.reduce((sum, seat) => sum + seat.price, 0);
  }, [selectedSeats]);

  const canSelectMore = useMemo(() => {
    return selectedSeatIds.size < SEAT_SELECTION_LIMITS.MAX;
  }, [selectedSeatIds.size]);

  const hasMinimumSelection = useMemo(() => {
    return selectedSeatIds.size >= SEAT_SELECTION_LIMITS.MIN;
  }, [selectedSeatIds.size]);

  return {
    selectedSeatIds,
    selectedSeats,
    totalPrice,
    canSelectMore,
    hasMinimumSelection,
    toggleSeat,
    clearSelection,
    isSelected,
  };
};
