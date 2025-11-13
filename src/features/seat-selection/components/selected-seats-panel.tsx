'use client';

import type { SeatInfo } from '@/features/seat-selection/lib/dto';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SelectedSeatsPanelProps {
  selectedSeats: SeatInfo[];
  totalPrice: number;
  onClearSelection: () => void;
}

const formatSeatLabel = (seat: SeatInfo) => {
  const seatNumber = seat.seatNumber.toString().padStart(2, '0');
  return `${seat.sectionLabel}-${seat.rowLabel}${seatNumber}`;
};

export const SelectedSeatsPanel = ({
  selectedSeats,
  totalPrice,
  onClearSelection,
}: SelectedSeatsPanelProps) => {
  if (selectedSeats.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">선택된 좌석</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">
            좌석을 선택해주세요. (최대 4석)
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">
            선택된 좌석 ({selectedSeats.length}석)
          </CardTitle>
          <button
            type="button"
            onClick={onClearSelection}
            className="text-sm text-red-600 hover:text-red-700"
          >
            전체 해제
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* 선택된 좌석 목록 */}
          <div className="max-h-48 overflow-y-auto space-y-2">
            {selectedSeats.map((seat) => (
              <div
                key={seat.id}
                className="flex justify-between items-center text-sm py-2 px-3 bg-gray-50 rounded"
              >
                <div>
                  <span className="font-medium">{seat.seatTierLabel}</span>
                  <span className="text-gray-600 ml-2">
                    {formatSeatLabel(seat)}
                  </span>
                </div>
                <span className="font-semibold">
                  {seat.price.toLocaleString()}원
                </span>
              </div>
            ))}
          </div>

          {/* 총액 */}
          <div className="border-t pt-3 flex justify-between items-center">
            <span className="text-lg font-semibold">총 결제 금액</span>
            <span className="text-xl font-bold text-blue-600">
              {totalPrice.toLocaleString()}원
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
