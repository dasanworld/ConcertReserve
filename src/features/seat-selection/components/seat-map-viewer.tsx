'use client';

import type { SeatInfo } from '@/features/seat-selection/lib/dto';
import {
  SEAT_STATUS_COLORS,
  SEAT_STATUS_TEXT_COLORS,
} from '@/features/seat-selection/constants';

interface SeatMapViewerProps {
  seats: SeatInfo[];
  selectedSeatIds: Set<string>;
  onSeatClick: (seatId: string) => void;
}

export const SeatMapViewer = ({
  seats,
  selectedSeatIds,
  onSeatClick,
}: SeatMapViewerProps) => {
  const getSeatStatus = (seat: SeatInfo): keyof typeof SEAT_STATUS_COLORS => {
    if (selectedSeatIds.has(seat.id)) {
      return 'selected';
    }
    return seat.status;
  };

  const canSelectSeat = (seat: SeatInfo): boolean => {
    // 이미 선택된 좌석이면 해제 가능
    if (selectedSeatIds.has(seat.id)) {
      return true;
    }
    // available 상태만 선택 가능
    return seat.status === 'available';
  };

  const handleSeatClick = (seat: SeatInfo) => {
    if (canSelectSeat(seat)) {
      onSeatClick(seat.id);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center py-4 bg-gray-100 rounded-lg">
        <p className="text-sm font-semibold text-gray-600">무대</p>
      </div>

      <div className="grid grid-cols-10 gap-2 justify-items-center">
        {seats.map((seat) => {
          const status = getSeatStatus(seat);
          const colorClass = SEAT_STATUS_COLORS[status];
          const textColorClass = SEAT_STATUS_TEXT_COLORS[status];
          const isClickable = canSelectSeat(seat);

          return (
            <button
              key={seat.id}
              type="button"
              onClick={() => handleSeatClick(seat)}
              disabled={!isClickable}
              className={`
                w-10 h-10 rounded text-xs font-medium
                flex items-center justify-center
                transition-colors
                ${colorClass}
                ${textColorClass}
                ${!isClickable ? 'opacity-50' : ''}
              `}
              title={`${seat.seatTierLabel} - ${seat.label} (${seat.price.toLocaleString()}원)`}
            >
              {seat.label}
            </button>
          );
        })}
      </div>

      {/* 범례 */}
      <div className="flex justify-center gap-4 text-sm flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-200 rounded" />
          <span>예약 가능</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded" />
          <span>선택됨</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-orange-400 rounded" />
          <span>임시 선점</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded" />
          <span>예약 완료</span>
        </div>
      </div>
    </div>
  );
};
