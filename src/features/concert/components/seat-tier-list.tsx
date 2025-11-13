'use client';

import type { SeatTier } from '@/features/concert/lib/dto';

interface SeatTierListProps {
  seatTiers: SeatTier[];
}

const getTierColorClass = (label: string): { box: string; dot: string } => {
  const lowerLabel = label.toLowerCase();

  if (lowerLabel.includes('special')) {
    return {
      box: 'bg-purple-500',
      dot: 'w-3 h-3 bg-purple-500 rounded',
    };
  }

  if (lowerLabel.includes('premium')) {
    return {
      box: 'bg-blue-500',
      dot: 'w-3 h-3 bg-blue-500 rounded',
    };
  }

  if (lowerLabel.includes('advanced')) {
    return {
      box: 'bg-green-500',
      dot: 'w-3 h-3 bg-green-500 rounded',
    };
  }

  if (lowerLabel.includes('regular')) {
    return {
      box: 'bg-orange-500',
      dot: 'w-3 h-3 bg-orange-500 rounded',
    };
  }

  return {
    box: 'bg-gray-500',
    dot: 'w-3 h-3 bg-gray-500 rounded',
  };
};

export const SeatTierList = ({ seatTiers }: SeatTierListProps) => {
  // 등급 순서: Special, Premium, Advanced, Regular
  const tierOrder = ['Special', 'Premium', 'Advanced', 'Regular'];
  const sortedTiers = [...seatTiers].sort((a, b) => {
    const orderA = tierOrder.indexOf(a.label);
    const orderB = tierOrder.indexOf(b.label);
    return (orderA === -1 ? tierOrder.length : orderA) - (orderB === -1 ? tierOrder.length : orderB);
  });

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">좌석 등급</h2>
      <div className="space-y-2">
        {sortedTiers.map((tier) => {
          const colors = getTierColorClass(tier.label);
          const reservedSeats = tier.totalSeats - tier.availableSeats - tier.temporarilyHeldSeats;

          return (
            <div key={tier.id} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
              {/* 색상 박스 */}
              <div className={`w-4 h-4 rounded ${colors.box}`} />

              {/* 등급명 및 행 범위 */}
              <div className="flex-1">
                <div className="text-sm font-semibold text-gray-800">
                  {tier.label}
                  <span className="text-gray-600 font-normal">
                    {tier.layoutSummary?.rows?.length > 0
                      ? ` (${tier.layoutSummary.rows[0] ?? ''} ~ ${
                          tier.layoutSummary.rows[tier.layoutSummary.rows.length - 1] ?? ''
                        }행)`
                      : ''}
                  </span>
                </div>
              </div>

              {/* 가격 */}
              <div className="text-right">
                <div className="font-semibold text-gray-900">
                  {tier.price.toLocaleString()}원
                </div>
              </div>

              {/* 잔여/전체 좌석 */}
              <div className="text-right">
                <div className="text-sm text-gray-600">
                  <span className="font-semibold text-gray-900">{tier.availableSeats}</span>
                  <span className="text-gray-500">/{tier.totalSeats}석</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
