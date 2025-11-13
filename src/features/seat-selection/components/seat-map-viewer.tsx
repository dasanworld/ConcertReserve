'use client';

import { useMemo } from 'react';
import type { SeatTierInfo } from '@/features/seat-selection/lib/dto';
import type { EnhancedSeat } from '@/features/seat-selection/types/enhanced-seat';
import {
  SEAT_STATUS_COLORS,
  SEAT_STATUS_TEXT_COLORS,
} from '@/features/seat-selection/constants';

const TIER_COLOR_STYLES: Record<
  string,
  { dot: string; seat: string; seatHover?: string }
> = {
  Special: {
    dot: 'bg-purple-500',
    seat: 'bg-purple-100 text-purple-800 border border-purple-200',
    seatHover: 'hover:bg-purple-200',
  },
  Premium: {
    dot: 'bg-blue-500',
    seat: 'bg-blue-100 text-blue-800 border border-blue-200',
    seatHover: 'hover:bg-blue-200',
  },
  Advanced: {
    dot: 'bg-green-500',
    seat: 'bg-green-100 text-green-800 border border-green-200',
    seatHover: 'hover:bg-green-200',
  },
  Regular: {
    dot: 'bg-orange-500',
    seat: 'bg-orange-100 text-orange-800 border border-orange-200',
    seatHover: 'hover:bg-orange-200',
  },
};

const getTierColorClass = (label: string) =>
  TIER_COLOR_STYLES[label] ?? {
    dot: 'bg-gray-400',
    seat: 'bg-gray-100 text-gray-800 border border-gray-200',
    seatHover: 'hover:bg-gray-200',
  };

interface SeatMapViewerProps {
  seats: EnhancedSeat[];
  seatTiers: SeatTierInfo[];
  selectedSeatIds: Set<string>;
  onSeatClick: (seatId: string) => void;
}

export const SeatMapViewer = ({
  seats,
  seatTiers,
  selectedSeatIds,
  onSeatClick,
}: SeatMapViewerProps) => {
  const getSeatStatus = (seat: EnhancedSeat) => {
    if (selectedSeatIds.has(seat.id)) {
      return 'selected';
    }
    return seat.status;
  };

  const canSelectSeat = (seat: EnhancedSeat) => {
    if (selectedSeatIds.has(seat.id)) {
      return true;
    }
    return seat.status === 'available';
  };

  const handleSeatClick = (seat: EnhancedSeat) => {
    if (canSelectSeat(seat)) {
      onSeatClick(seat.id);
    }
  };

  const renderSeat = (seat: EnhancedSeat, tierStyle: ReturnType<typeof getTierColorClass>) => {
    const status = getSeatStatus(seat);
    const isClickable = canSelectSeat(seat);

    let baseClass = '';
    let textClass = '';

    if (seat.ephemeralStatus === 'unavailable_on_hold') {
      baseClass = 'bg-red-100 border border-red-300';
      textClass = 'text-red-700';
    } else if (status === 'available') {
      baseClass = `${tierStyle.seat} ${tierStyle.seatHover ?? ''}`;
      textClass = '';
    } else {
      baseClass = SEAT_STATUS_COLORS[status];
      textClass = SEAT_STATUS_TEXT_COLORS[status];
    }

    return (
      <button
        key={seat.id}
        type="button"
        onClick={() => handleSeatClick(seat)}
        disabled={!isClickable}
        className={`w-7 h-7 rounded text-xs font-semibold flex items-center justify-center transition-all duration-150 ${baseClass} ${textClass} ${isClickable ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
        title={`${seat.seatTierLabel} - ${seat.sectionLabel} ${seat.rowLabel}${seat.seatNumber.toString().padStart(2, '0')} (${seat.price.toLocaleString()}원)`}
      >
        {seat.seatNumber.toString().padStart(2, '0')}
      </button>
    );
  };

  const tierData = useMemo(() => {
    const tierOrder = ['Special', 'Premium', 'Advanced', 'Regular'];
    const sortedTiers = [...seatTiers].sort((a, b) => {
      const orderA = tierOrder.indexOf(a.label);
      const orderB = tierOrder.indexOf(b.label);
      return (orderA === -1 ? Number.MAX_SAFE_INTEGER : orderA) -
        (orderB === -1 ? Number.MAX_SAFE_INTEGER : orderB);
    });

    const tierMap = new Map<string, EnhancedSeat[]>();
    seats.forEach((seat) => {
      if (!tierMap.has(seat.seatTierId)) {
        tierMap.set(seat.seatTierId, []);
      }
      tierMap.get(seat.seatTierId)!.push(seat);
    });

    return sortedTiers.map((tier) => {
      const tierSeats = [...(tierMap.get(tier.id) ?? [])].sort((a, b) => {
        const sectionDiff = (a.sectionLabel ?? '').localeCompare(b.sectionLabel ?? '');
        if (sectionDiff !== 0) return sectionDiff;
        const rowDiff = (a.rowNumber ?? 0) - (b.rowNumber ?? 0);
        if (rowDiff !== 0) return rowDiff;
        return a.seatNumber - b.seatNumber;
      });

      const sectionMap = new Map<string, EnhancedSeat[]>();
      tierSeats.forEach((seat) => {
        const sectionKey = seat.sectionLabel ?? 'Unknown';
        if (!sectionMap.has(sectionKey)) {
          sectionMap.set(sectionKey, []);
        }
        sectionMap.get(sectionKey)!.push(seat);
      });

      const sections = Array.from(sectionMap.entries()).map(([sectionLabel, sectionSeats]) => {
        const rowMap = new Map<number, EnhancedSeat[]>();
        sectionSeats.forEach((seat) => {
          const rowNum = seat.rowNumber ?? 0;
          if (!rowMap.has(rowNum)) {
            rowMap.set(rowNum, []);
          }
          rowMap.get(rowNum)!.push(seat);
        });

        const rows = Array.from(rowMap.entries())
          .sort((a, b) => a[0] - b[0])
          .map(([rowNum, rowSeats]) => {
            const sortedSeats = rowSeats.sort((a, b) => a.seatNumber - b.seatNumber);
            return { rowNum, rowLabel: String.fromCharCode(65 + (rowNum - 1)), seats: sortedSeats };
          });

        return { sectionLabel, rows };
      });

      return { tier, sections };
    });
  }, [seatTiers, seats]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center py-3 bg-gray-100 rounded-lg px-1">
        <span className="w-7" />
        <p className="text-sm font-semibold text-gray-600">무대</p>
        <span className="w-7" />
      </div>

      <div className="space-y-8">
        {tierData.map(({ tier, sections }) => {
          const tierStyle = getTierColorClass(tier.label);
          return (
            <div key={tier.id}>
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-4 h-4 rounded-full ${tierStyle.dot}`} />
                  <h3 className="font-bold text-lg">{tier.label}</h3>
                </div>
                <p className="text-xs text-gray-500">
                  잔여 {tier.availableCount} / {tier.totalCount}석
                </p>
              </div>

              <div className="space-y-6">
                {sections.map((section) => (
                  <div key={`${tier.id}-${section.sectionLabel}`}>
                    <p className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                      {section.sectionLabel}
                    </p>
                    <div className="space-y-3">
                      {section.rows.map((row) => {
                        // 4개씩 그룹으로 나누기
                        const groups: (EnhancedSeat[])[] = [];
                        for (let i = 0; i < row.seats.length; i += 4) {
                          groups.push(row.seats.slice(i, i + 4));
                        }

                        return (
                          <div key={`${tier.id}-${section.sectionLabel}-${row.rowNum}`}>
                            <div className="text-xs text-gray-500 mb-2 pl-1">
                              {row.rowLabel}행 ({row.seats.length}석)
                            </div>
                            <div className="flex gap-8 justify-between">
                              {groups.map((groupSeats, groupIndex) => (
                                <div
                                  key={`group-${groupIndex}`}
                                  className="flex gap-1"
                                >
                                  {groupSeats.map((seat) => (
                                    <div key={seat.id}>
                                      {renderSeat(seat, tierStyle)}
                                    </div>
                                  ))}
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t pt-4 mt-6">
        <p className="text-xs font-semibold text-gray-600 mb-3">범례</p>
        <div className="grid grid-cols-3 gap-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded" />
            <span className="text-gray-600">선택됨</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-400 rounded" />
            <span className="text-gray-600">임시 선점</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded" />
            <span className="text-gray-600">예약 완료</span>
          </div>
        </div>
      </div>
    </div>
  );
};
