'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { ReservationDetailResponse } from '@/features/reservation/backend/schema';

interface ReservationInfoProps {
  // 예약 상세 정보
  reservation: ReservationDetailResponse;
}

/**
 * 예약 상세 정보 컴포넌트
 * 공연, 좌석, 결제 정보를 섹션별로 표시
 */
export const ReservationInfo = ({ reservation }: ReservationInfoProps) => {
  // 날짜 포맷팅
  const concertDateFormatted = reservation.concertDate
    ? format(new Date(reservation.concertDate), 'yyyy년 MM월 dd일 (EEE) HH:mm', { locale: ko })
    : '정보 없음';

  const createdAtFormatted = format(
    new Date(reservation.createdAt),
    'yyyy년 MM월 dd일 HH:mm:ss',
    { locale: ko }
  );

  const cancelledAtFormatted = reservation.status === 'cancelled' && reservation.createdAt
    ? format(new Date(reservation.createdAt), 'yyyy년 MM월 dd일 HH:mm:ss', { locale: ko })
    : null;

  const totalAmount = reservation.seats.reduce((sum, seat) => sum + seat.price, 0);

  return (
    <div className="space-y-4">
      {/* 공연 정보 */}
      <Card className="p-4">
        <h3 className="font-semibold mb-3">공연 정보</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">공연명</span>
            <span className="font-medium text-blue-600">{reservation.concertTitle}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">일시</span>
            <span className="font-medium">{concertDateFormatted}</span>
          </div>
          {reservation.concertVenue && (
            <div className="flex justify-between">
              <span className="text-gray-600">장소</span>
              <span className="font-medium">{reservation.concertVenue}</span>
            </div>
          )}
        </div>
      </Card>

      {/* 예약자 정보 */}
      <Card className="p-4">
        <h3 className="font-semibold mb-3">예약자 정보</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">이름</span>
            <span className="font-medium">{reservation.customerName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">휴대폰</span>
            <span className="font-medium">{reservation.phoneNumber}</span>
          </div>
        </div>
      </Card>

      {/* 좌석 정보 */}
      <Card className="p-4">
        <h3 className="font-semibold mb-3">좌석 정보</h3>
        <div className="space-y-2">
          {reservation.seats.map((seat) => (
            <div
              key={seat.seatId}
              className="flex items-center justify-between p-2 bg-gray-50 rounded"
            >
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {seat.tierLabel}
                </Badge>
                <span className="font-medium text-sm">{seat.label}</span>
              </div>
              <span className="text-sm font-semibold text-blue-600">
                ₩{seat.price.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* 결제 정보 */}
      <Card className="p-4 bg-blue-50">
        <h3 className="font-semibold mb-3">결제 정보</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">좌석 수</span>
            <span className="font-medium">{reservation.seatCount}석</span>
          </div>
          <div className="flex justify-between pb-2 border-b">
            <span className="text-gray-600">총액</span>
            <span className="font-semibold text-lg text-blue-600">
              ₩{totalAmount.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between text-xs text-gray-500 pt-2">
            <span>예약일시</span>
            <span>{createdAtFormatted}</span>
          </div>
          {reservation.status === 'cancelled' && cancelledAtFormatted && (
            <div className="flex justify-between text-xs text-red-600 pt-1">
              <span>취소일시</span>
              <span>{cancelledAtFormatted}</span>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

