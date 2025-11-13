'use client';

import type { SeatTierInfo } from '@/features/seat-selection/lib/dto';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SeatTierInfoProps {
  tiers: SeatTierInfo[];
}

export const SeatTierInfoCard = ({ tiers }: SeatTierInfoProps) => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">등급별 좌석 정보</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tiers.map((tier) => (
          <Card key={tier.id}>
            <CardHeader>
              <CardTitle className="text-lg">{tier.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">가격</span>
                  <span className="font-semibold">
                    {tier.price.toLocaleString()}원
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">예약 가능</span>
                  <span className="font-semibold text-green-600">
                    {tier.availableCount}석
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">임시 선점</span>
                  <span className="text-orange-600">{tier.heldCount}석</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">예약 완료</span>
                  <span className="text-red-600">{tier.reservedCount}석</span>
                </div>
                <div className="border-t pt-2 flex justify-between">
                  <span className="text-gray-600">전체</span>
                  <span className="font-semibold">{tier.totalCount}석</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
