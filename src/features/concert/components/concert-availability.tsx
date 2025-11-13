'use client';

import { Badge } from '@/components/ui/badge';

interface ConcertAvailabilityProps {
  availableSeats: number;
  totalSeats: number;
}

export const ConcertAvailability = ({
  availableSeats,
  totalSeats,
}: ConcertAvailabilityProps) => {
  const isSoldOut = availableSeats === 0;

  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center gap-3">
        <span className="text-lg font-semibold text-gray-700">좌석 현황</span>
        {isSoldOut && (
          <Badge variant="destructive" className="text-sm">
            매진
          </Badge>
        )}
      </div>
      <div className="text-lg font-medium">
        <span className={isSoldOut ? 'text-red-600' : 'text-blue-600'}>
          잔여 {availableSeats}석
        </span>
        <span className="text-gray-500"> / 전체 {totalSeats}석</span>
      </div>
    </div>
  );
};
