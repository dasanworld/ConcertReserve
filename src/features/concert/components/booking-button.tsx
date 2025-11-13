'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

interface BookingButtonProps {
  concertId: string;
  availableSeats: number;
}

export const BookingButton = ({
  concertId,
  availableSeats,
}: BookingButtonProps) => {
  const router = useRouter();
  const isSoldOut = availableSeats === 0;

  const handleBooking = () => {
    // 좌석 선택 섹션으로 스크롤
    const seatSelectionElement = document.getElementById('seat-selection');
    if (seatSelectionElement) {
      seatSelectionElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-lg z-50">
      <div className="max-w-7xl mx-auto">
        <Button
          onClick={handleBooking}
          disabled={isSoldOut}
          className="w-full h-14 text-lg font-semibold"
          size="lg"
        >
          {isSoldOut ? '매진' : '좌석 선택하기'}
        </Button>
      </div>
    </div>
  );
};
