import type { Hono } from 'hono';
import { cleanupExpiredHolds } from '@/backend/jobs/cleanup-expired-holds';
import type { AppEnv } from '@/backend/hono/context';
import { getLogger } from '@/backend/hono/context';

/**
 * 백그라운드 작업 관련 라우트 등록
 * 
 * - POST /api/jobs/cleanup-expired-holds: 만료된 선점 좌석 정리 (수동 트리거)
 */
export const registerJobRoutes = (app: Hono<AppEnv>) => {
  app.post('/api/jobs/cleanup-expired-holds', async (c) => {
    const logger = getLogger(c);

    try {
      logger.info('Starting cleanup of expired seat holds');
      const result = await cleanupExpiredHolds();

      if (!result.success) {
        logger.error('Cleanup job failed', result.message);
        return c.json(
          {
            ok: false,
            error: {
              code: 'CLEANUP_FAILED',
              message: result.message,
            },
          },
          500
        );
      }

      logger.info('Cleanup job completed', {
        clearedCount: result.clearedCount,
        message: result.message,
      });

      return c.json(
        {
          ok: true,
          data: {
            message: result.message,
            clearedCount: result.clearedCount,
            expiredSeats: result.expiredSeats,
          },
        },
        200
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Unexpected error in cleanup job', message);
      return c.json(
        {
          ok: false,
          error: {
            code: 'INTERNAL_ERROR',
            message: 'An unexpected error occurred during cleanup',
          },
        },
        500
      );
    }
  });
};
