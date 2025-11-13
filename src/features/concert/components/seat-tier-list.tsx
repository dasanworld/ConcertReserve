'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { SeatTier } from '@/features/concert/lib/dto';

interface SeatTierListProps {
  seatTiers: SeatTier[];
}

const formatRange = (values: string[]) => {
  if (!values.length) {
    return '정보 없음';
  }

  if (values.length <= 2) {
    return values.join(', ');
  }

  return `${values[0]} ~ ${values[values.length - 1]}`;
};

export const SeatTierList = ({ seatTiers }: SeatTierListProps) => {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">좌석 등급</h2>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">등급별 요약</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="py-2 pr-4">등급</th>
                <th className="py-2 pr-4">가격</th>
                <th className="py-2 pr-4">잔여/전체</th>
                <th className="py-2 pr-4">임시 선점</th>
                <th className="py-2 pr-4">예약 완료</th>
                <th className="py-2 pr-4">구역/행</th>
              </tr>
            </thead>
            <tbody>
              {seatTiers.map((tier) => {
                const layout = tier.layoutSummary ?? {
                  sections: [],
                  rows: [],
                  seatsPerRow: 0,
                };

                return (
                  <tr key={tier.id} className="border-b last:border-b-0">
                    <td className="py-3 pr-4 font-semibold text-gray-800">
                      {tier.label}
                    </td>
                    <td className="py-3 pr-4 font-medium">
                      {tier.price.toLocaleString()}원
                  </td>
                  <td className="py-3 pr-4">
                    <span className="font-medium text-green-600">
                      {tier.availableSeats}
                    </span>
                    <span className="text-gray-500">
                      {' '}
                      / {tier.totalSeats}석
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-amber-600">
                    {tier.temporarilyHeldSeats}석
                  </td>
                  <td className="py-3 pr-4 text-red-600">
                    {tier.reservedSeats}석
                  </td>
                  <td className="py-3 pr-4 text-gray-600">
                    구역 {formatRange(layout.sections)} <br />
                    행 {formatRange(layout.rows)} · 행당{' '}
                    {layout.seatsPerRow > 0
                      ? `${layout.seatsPerRow}석`
                      : '정보 없음'}
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
};
