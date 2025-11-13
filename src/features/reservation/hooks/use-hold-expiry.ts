'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

/**
 * 선점 만료 타이머 훅
 * 선점 만료 시각을 추적하고, 만료 시 자동으로 처리
 *
 * @param expiresAt - 선점 만료 시각 (ISO 8601 형식)
 * @returns { remainingSeconds: number, isExpired: boolean }
 */
export const useHoldExpiry = (expiresAt: string | null | undefined) => {
  const router = useRouter();
  const { toast } = useToast();

  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const [isExpired, setIsExpired] = useState<boolean>(false);

  useEffect(() => {
    // 만료 시각이 없으면 타이머 실행 안 함
    if (!expiresAt) {
      return;
    }

    // 1초마다 남은 시간 계산
    const interval = setInterval(() => {
      const now = new Date();
      const expireTime = new Date(expiresAt);
      const diffMs = expireTime.getTime() - now.getTime();
      const diffSeconds = Math.ceil(diffMs / 1000);

      if (diffSeconds <= 0) {
        // 만료됨
        setIsExpired(true);
        setRemainingSeconds(0);
        clearInterval(interval);

        // 토스트 메시지 표시 및 리다이렉트
        toast({
          title: '선점 만료',
          description: '좌석 선점 시간이 만료되었습니다. 좌석 선택 페이지로 이동합니다.',
          variant: 'destructive',
        });

        // 좌석 선택 페이지로 이동 (뒤로가기)
        router.back();
      } else {
        setRemainingSeconds(diffSeconds);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, router, toast]);

  return { remainingSeconds, isExpired };
};

