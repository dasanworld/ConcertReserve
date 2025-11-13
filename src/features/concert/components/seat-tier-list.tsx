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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {seatTiers.map((tier) => (
          <Card key={tier.id}>
            <CardHeader>
              <CardTitle className="text-lg">{tier.label}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">가격</span>
                <span className="font-semibold text-lg">
                  {tier.price.toLocaleString()}원
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">잔여석</span>
                <span className="font-medium">
                  {tier.availableSeats} / {tier.totalSeats}석
                </span>
              </div>
              <div className="text-sm text-gray-600">
                구역 {formatRange(tier.layoutSummary.sections)}
              </div>
              <div className="text-sm text-gray-600">
                행 {formatRange(tier.layoutSummary.rows)} · 행당{' '}
                {tier.layoutSummary.seatsPerRow > 0
                  ? `${tier.layoutSummary.seatsPerRow}석`
                  : '정보 없음'}
              </div>
              {tier.temporarilyHeldSeats > 0 && (
                <div className="text-sm text-amber-600">
                  임시 선점 중: {tier.temporarilyHeldSeats}석
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
