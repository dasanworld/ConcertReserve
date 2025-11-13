'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { SeatTier } from '@/features/concert/lib/dto';

interface SeatTierListProps {
  seatTiers: SeatTier[];
}

const getTierColorClass = (label: string): { bg: string; text: string; border: string } => {
  const lowerLabel = label.toLowerCase();

  if (lowerLabel.includes('vip')) {
    return {
      bg: 'bg-purple-50',
      text: 'text-purple-700',
      border: 'border-purple-200',
    };
  }

  if (lowerLabel.includes('프리미엄') || lowerLabel.includes('premium')) {
    return {
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-200',
    };
  }

  if (lowerLabel.includes('프리미엘') || lowerLabel.includes('premier')) {
    return {
      bg: 'bg-indigo-50',
      text: 'text-indigo-700',
      border: 'border-indigo-200',
    };
  }

  if (lowerLabel.includes('표준') || lowerLabel.includes('standard')) {
    return {
      bg: 'bg-green-50',
      text: 'text-green-700',
      border: 'border-green-200',
    };
  }

  if (lowerLabel.includes('일반') || lowerLabel.includes('general')) {
    return {
      bg: 'bg-gray-50',
      text: 'text-gray-700',
      border: 'border-gray-200',
    };
  }

  return {
    bg: 'bg-slate-50',
    text: 'text-slate-700',
    border: 'border-slate-200',
  };
};

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
    <div className="space-y-3">
      <h2 className="text-2xl font-bold">좌석 등급</h2>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-gray-700">등급별 요약</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-gray-500 border-b text-[11px]">
                <th className="py-2 px-2">등급</th>
                <th className="py-2 px-2">가격</th>
                <th className="py-2 px-2">잔여/전체</th>
                <th className="py-2 px-2">임시 선점</th>
                <th className="py-2 px-2">예약 완료</th>
                <th className="py-2 px-2">구역/행</th>
              </tr>
            </thead>
            <tbody>
              {seatTiers.map((tier) => {
                const layout = tier.layoutSummary ?? {
                  sections: [],
                  rows: [],
                  seatsPerRow: 0,
                };
                const colors = getTierColorClass(tier.label);

                return (
                  <tr key={tier.id} className={`border-b last:border-b-0 ${colors.border}`}>
                    <td className={`py-2 px-2 font-semibold ${colors.text} rounded px-2.5 inline-block`}>
                      {tier.label}
                    </td>
                    <td className="py-2 px-2 font-medium text-gray-700">
                      {tier.price.toLocaleString()}원
                    </td>
                    <td className="py-2 px-2 text-gray-600">
                      <span className="font-semibold text-green-600">
                        {tier.availableSeats}
                      </span>
                      <span className="text-gray-500">{' '}/ {tier.totalSeats}</span>
                    </td>
                    <td className="py-2 px-2 text-amber-600 font-medium">
                      {tier.temporarilyHeldSeats}
                    </td>
                    <td className="py-2 px-2 text-red-600 font-medium">
                      {tier.reservedSeats}
                    </td>
                    <td className="py-2 px-2 text-gray-600 leading-tight">
                      <div className="text-[10px]">
                        구역 {formatRange(layout.sections)}
                      </div>
                      <div className="text-[10px]">
                        행 {formatRange(layout.rows)} · {layout.seatsPerRow > 0 ? `${layout.seatsPerRow}석` : '정보 없음'}
                      </div>
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
