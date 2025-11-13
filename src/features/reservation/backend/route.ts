import type { Hono } from 'hono';
import {
  respond,
  type ErrorResult,
} from '@/backend/http/response';
import {
  getLogger,
  getSupabase,
  type AppEnv,
} from '@/backend/hono/context';
import { getReservationDetail } from './service';
import {
  reservationErrorCodes,
  type ReservationServiceError,
} from './error';
import { z } from 'zod';

// UUID 검증 스키마
const uuidSchema = z.string().uuid();

export const registerReservationRoutes = (app: Hono<AppEnv>) => {
  app.get('/api/reservations/:id', async (c) => {
    const supabase = getSupabase(c);
    const logger = getLogger(c);
    const { id } = c.req.param();

    // UUID 형식 검증
    const uuidValidation = uuidSchema.safeParse(id);
    if (!uuidValidation.success) {
      logger.error('Invalid reservation ID format', { id });
      return c.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '잘못된 예약 ID 형식입니다.',
            details: uuidValidation.error.format(),
          },
        },
        400
      );
    }

    const result = await getReservationDetail(supabase, id);

    if (!result.ok) {
      const errorResult = result as ErrorResult<ReservationServiceError, unknown>;

      if (errorResult.error.code === reservationErrorCodes.notFound) {
        logger.error('Reservation not found', { id });
      } else if (errorResult.error.code === reservationErrorCodes.dbError) {
        logger.error('Database error while fetching reservation', errorResult.error.message);
      }

      return respond(c, result);
    }

    return respond(c, result);
  });
};
