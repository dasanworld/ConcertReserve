'use client';

import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle } from 'lucide-react';

interface ReservationStatusBadgeProps {
  // 예약 상태
  status: 'confirmed' | 'cancelled';
}

/**
 * 예약 상태 배지 컴포넌트
 * 예약 상태를 배지로 표시 (확정/취소)
 */
export const ReservationStatusBadge = ({ status }: ReservationStatusBadgeProps) => {
  if (status === 'confirmed') {
    return (
      <Badge variant="default" className="flex items-center gap-1 w-fit">
        <CheckCircle2 className="h-3 w-3" />
        예약 확정
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="flex items-center gap-1 w-fit">
      <XCircle className="h-3 w-3" />
      예약 취소됨
    </Badge>
  );
};

