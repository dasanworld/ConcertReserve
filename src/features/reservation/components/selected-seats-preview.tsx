'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { SeatDetail } from '@/features/reservation/backend/schema';

interface SelectedSeatsPreviewProps {
  seats: SeatDetail[];
  totalAmount?: number;
}

/**
 * 선정된 좌석 미리보기 컴포넌트
 * 선택한 좌석의 등급, 번호, 가격을 표시하고 총액 계산
 */
export const SelectedSeatsPreview = ({
  seats,
  totalAmount,
}: SelectedSeatsPreviewProps) => {
  const computedTotal = totalAmount ?? seats.reduce((sum, seat) => sum + seat.price, 0);

  return (
    <Card className="p-4 space-y-4">
      <div>
        <h2 className="font-semibold text-lg mb-3">선택하신 좌석</h2>

        {/* 좌석 목록 */}
        <div className="space-y-2 mb-4">
          {seats.map((seat) => (
            <div
              key={seat.seatId}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                {/* 좌석 등급 배지 */}
                <Badge variant="secondary">{seat.tierLabel}</Badge>

                {/* 좌석 번호 */}
                <span className="font-medium">{seat.label}</span>
              </div>

              {/* 좌석 가격 */}
              <span className="text-right font-semibold text-blue-600">
                ₩{seat.price.toLocaleString()}
              </span>
            </div>
          ))}
        </div>

        {/* 구분선 */}
        <div className="border-t my-3" />

        {/* 총액 */}
        <div className="flex items-center justify-between">
          <span className="font-semibold">총액</span>
          <span className="text-2xl font-bold text-blue-600">
            ₩{computedTotal.toLocaleString()}
          </span>
        </div>

        {/* 좌석 수 */}
        <div className="text-sm text-gray-600 mt-2">
          총 {seats.length}석
        </div>
      </div>
    </Card>
  );
};
