'use client';

import { Card } from '@/components/ui/card';
import { Clock } from 'lucide-react';
import { useHoldExpiry } from '@/features/reservation/hooks/use-hold-expiry';

interface HoldExpiryTimerProps {
  // 선점 만료 시각 (ISO 8601 형식)
  expiresAt: string | null | undefined;
}

/**
 * 선점 만료 타이머 컴포넌트
 * 선점 시간 남은 시간을 MM:SS 형식으로 카운트다운
 */
export const HoldExpiryTimer = ({ expiresAt }: HoldExpiryTimerProps) => {
  const { remainingSeconds, isExpired } = useHoldExpiry(expiresAt);

  // 남은 시간 포맷팅 (MM:SS)
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const timeString = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // 1분 이상 남았으면 일반 스타일, 1분 미만이면 빨간색 강조
  const isUrgent = remainingSeconds < 60;
  const bgColor = isUrgent ? 'bg-red-50' : 'bg-blue-50';
  const textColor = isUrgent ? 'text-red-700' : 'text-blue-700';
  const timerColor = isUrgent ? 'text-red-600' : 'text-blue-600';

  return (
    <Card className={`p-4 ${bgColor}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className={`h-5 w-5 ${timerColor}`} />
          <span className={`font-medium ${textColor}`}>
            {isExpired ? '선점이 만료되었습니다' : '선점 남은 시간'}
          </span>
        </div>

        <span className={`text-2xl font-bold ${timerColor}`}>
          {timeString}
        </span>
      </div>

      {isUrgent && !isExpired && (
        <p className="text-xs text-red-600 mt-2">
          ⚠️ 선점 시간이 거의 만료되었습니다. 빠르게 진행해주세요.
        </p>
      )}
    </Card>
  );
};

