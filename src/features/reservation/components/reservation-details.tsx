"use client";

import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ReservationDetailResponse } from "@/features/reservation/lib/dto";

interface ReservationDetailsProps {
  reservation: ReservationDetailResponse;
}

export const ReservationDetails = ({ reservation }: ReservationDetailsProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ko-KR", {
      style: "currency",
      currency: "KRW",
    }).format(amount);
  };

  const formatDateTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "yyyy년 MM월 dd일 HH:mm", { locale: ko });
    } catch {
      return dateString;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return format(date, "yyyy년 MM월 dd일 HH:mm", { locale: ko });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-6">
      {/* 공연 정보 */}
      <Card>
        <CardHeader>
          <CardTitle>공연 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">공연명</span>
            <span className="font-medium">{reservation.concertTitle}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">공연 일시</span>
            <span className="font-medium">{formatDate(reservation.concertDate)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">장소</span>
            <span className="font-medium">{reservation.concertVenue || "-"}</span>
          </div>
        </CardContent>
      </Card>

      {/* 예약자 정보 */}
      <Card>
        <CardHeader>
          <CardTitle>예약자 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">이름</span>
            <span className="font-medium">{reservation.customerName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">휴대폰 번호</span>
            <span className="font-medium">{reservation.phoneNumber}</span>
          </div>
        </CardContent>
      </Card>

      {/* 좌석 정보 */}
      <Card>
        <CardHeader>
          <CardTitle>좌석 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {reservation.seats.map((seat) => (
              <div
                key={seat.seatId}
                className="flex justify-between border-b border-gray-100 pb-2 last:border-0 last:pb-0"
              >
                <div className="flex items-center space-x-2">
                  <span className="rounded bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800">
                    {seat.tierLabel}
                  </span>
                  <span className="font-medium">{seat.label}</span>
                </div>
                <span className="font-semibold text-gray-900">
                  {formatCurrency(seat.price)}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 결제 정보 */}
      <Card>
        <CardHeader>
          <CardTitle>결제 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">좌석 수</span>
            <span className="font-medium">{reservation.seatCount}석</span>
          </div>
          <div className="flex justify-between border-t border-gray-200 pt-3">
            <span className="text-lg font-semibold text-gray-900">총 금액</span>
            <span className="text-lg font-bold text-blue-600">
              {formatCurrency(reservation.totalAmount)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* 예약 일시 */}
      <Card>
        <CardHeader>
          <CardTitle>예약 일시</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-gray-900">{formatDateTime(reservation.createdAt)}</div>
        </CardContent>
      </Card>
    </div>
  );
};
