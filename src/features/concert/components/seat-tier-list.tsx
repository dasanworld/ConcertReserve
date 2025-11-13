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
    <div className="space-y-2">
      <h2 className="text-xs font-semibold text-gray-500">좌석 등급</h2>
      <div className="space-y-1">
        {sortedTiers.map((tier) => {
          const colors = getTierColorClass(tier.label);
          const reservedSeats = tier.totalSeats - tier.availableSeats - tier.temporarilyHeldSeats;

          return (
            <div key={tier.id} className="flex items-center gap-2 p-2 bg-white rounded-md border border-gray-200">
              {/* 색상 박스 */}
              <div className={`w-3 h-3 rounded ${colors.box}`} />

              {/* 등급명 및 행 범위 */}
              <div className="flex-1">
                <div className="text-[11px] font-medium text-gray-700">
                  {tier.label}
                  <span className="text-gray-500 font-normal">
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
                <div className="text-[11px] font-medium text-gray-700">
                  {tier.price.toLocaleString()}원
                </div>
              </div>

              {/* 잔여/전체 좌석 */}
              <div className="text-right">
                <div className="text-[11px] text-gray-600">
                  <span className="font-medium text-gray-700">{tier.availableSeats}</span>
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
