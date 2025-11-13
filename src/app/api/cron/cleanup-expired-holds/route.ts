import type { NextRequest } from 'next/server';
import { cleanupExpiredHolds } from '@/backend/jobs/cleanup-expired-holds';

/**
 * Vercel Cron Job Handler
 *
 * Vercel에서 제공하는 Cron Jobs 기능 사용
 * 설정은 vercel.json의 crons 배열에 정의됨
 * 1분마다 실행되어 만료된 선점 좌석을 자동으로 정리함
 */
export async function GET(request: NextRequest) {
  // Vercel에서 제공하는 Authorization 헤더 검증
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json(
      { message: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const result = await cleanupExpiredHolds();

    return Response.json(
      {
        success: result.success,
        message: result.message,
        clearedCount: result.clearedCount,
        expiredSeats: result.expiredSeats,
      },
      { status: result.success ? 200 : 500 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return Response.json(
      {
        success: false,
        message: `Cron job failed: ${message}`,
      },
      { status: 500 }
    );
  }
}
