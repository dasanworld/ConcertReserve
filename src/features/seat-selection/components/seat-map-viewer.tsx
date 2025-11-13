'use client';

import { useMemo } from 'react';
import type { EnhancedSeat } from '@/features/seat-selection/types/enhanced-seat';
import {
  SEAT_STATUS_COLORS,
  SEAT_STATUS_TEXT_COLORS,
} from '@/features/seat-selection/constants';

interface SeatMapViewerProps {
  seats: EnhancedSeat[];
  selectedSeatIds: Set<string>;
  onSeatClick: (seatId: string) => void;
}

const sortSections = (a: string, b: string) => {
  const prefixA = a.replace(/\d+$/, '');
  const prefixB = b.replace(/\d+$/, '');

  if (prefixA === prefixB) {
    const numberA = Number(a.replace(/^\D+/, '')) || 0;
    const numberB = Number(b.replace(/^\D+/, '')) || 0;
    return numberA - numberB;
  }

  return prefixA.localeCompare(prefixB);
};

export const SeatMapViewer = ({
  seats,
  selectedSeatIds,
  onSeatClick,
}: SeatMapViewerProps) => {
  const getSeatStatus = (seat: EnhancedSeat): keyof typeof SEAT_STATUS_COLORS => {
    if (selectedSeatIds.has(seat.id)) {
      return 'selected';
    }
    return seat.status;
  };

  const canSelectSeat = (seat: EnhancedSeat): boolean => {
    // 이미 선택된 좌석이면 해제 가능
    if (selectedSeatIds.has(seat.id)) {
      return true;
    }
    // available 상태만 선택 가능
    return seat.status === 'available';
  };

  const handleSeatClick = (seat: EnhancedSeat) => {
    if (canSelectSeat(seat)) {
      onSeatClick(seat.id);
    }
  };

  const groupedSeats = useMemo(() => {
    const sectionMap = new Map<string, Map<number, EnhancedSeat[]>>();

    seats.forEach((seat) => {
      if (!sectionMap.has(seat.sectionLabel)) {
        sectionMap.set(seat.sectionLabel, new Map());
      }

      const rowMap = sectionMap.get(seat.sectionLabel)!;
      if (!rowMap.has(seat.rowNumber)) {
        rowMap.set(seat.rowNumber, []);
      }

      rowMap.get(seat.rowNumber)!.push(seat);
    });

    return Array.from(sectionMap.entries())
      .sort(([sectionA], [sectionB]) => sortSections(sectionA, sectionB))
      .map(([sectionLabel, rowMap]) => ({
        sectionLabel,
        rows: Array.from(rowMap.entries())
          .sort(([rowA], [rowB]) => rowA - rowB)
          .map(([rowNumber, rowSeats]) => ({
            rowNumber,
            rowLabel: rowSeats[0]?.rowLabel ?? `R${rowNumber}`,
            seats: rowSeats.sort((a, b) => a.seatNumber - b.seatNumber),
          })),
      }));
  }, [seats]);

  const seatDisplayLabel = (seat: EnhancedSeat) =>
    seat.seatNumber.toString().padStart(2, '0');

  return (
    <div className="space-y-4">
      <div className="text-center py-4 bg-gray-100 rounded-lg">
        <p className="text-sm font-semibold text-gray-600">무대</p>
      </div>

      <div className="space-y-6">
        {groupedSeats.map((section) => (
          <div key={section.sectionLabel} className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-lg">{section.sectionLabel}</p>
              <p className="text-sm text-gray-500">
                {section.rows.length}행 · {section.rows[0]?.seats.length ?? 0}열
              </p>
            </div>
            <div className="space-y-1">
              {section.rows.map((row) => (
                <div
                  key={`${section.sectionLabel}-${row.rowNumber}`}
                  className="flex items-center gap-3"
                >
                  <div className="w-10 text-sm font-semibold text-gray-600 text-center">
                    {row.rowLabel}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {row.seats.map((seat) => {
                      const status = getSeatStatus(seat);
                      let colorClass = SEAT_STATUS_COLORS[status];
                      let textColorClass = SEAT_STATUS_TEXT_COLORS[status];
                      const isClickable = canSelectSeat(seat);

                      if (seat.ephemeralStatus === 'unavailable_on_hold') {
                        colorClass = 'bg-red-100 border border-red-300';
                        textColorClass = 'text-red-700';
                      }

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
                          title={`${seat.sectionLabel}-${seat.rowLabel}${seat.seatNumber.toString().padStart(2, '0')} (${seat.price.toLocaleString()}원)`}
                        >
                          {seatDisplayLabel(seat)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
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
