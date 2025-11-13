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
import { getReservationDetail, createReservation, lookupReservation, cancelReservation } from './service';
import {
  reservationErrorCodes,
  type ReservationServiceError,
} from './error';
import { CreateReservationRequestSchema, ReservationLookupRequestSchema } from './schema';
import { z } from 'zod';

// UUID 검증 스키마
const uuidSchema = z.string().uuid();

export const registerReservationRoutes = (app: Hono<AppEnv>) => {
  // GET /api/reservations/:id - 예약 상세 조회
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

      if (errorResult.error.code === reservationErrorCodes.RESERVATION_NOT_FOUND) {
        logger.error('Reservation not found', { id });
      } else if (errorResult.error.code === reservationErrorCodes.RESERVATION_DB_ERROR) {
        logger.error('Database error while fetching reservation', errorResult.error.message);
      }

      return respond(c, result);
    }

    return respond(c, result);
  });

  // POST /api/reservations/lookup - 예약 조회
  app.post('/api/reservations/lookup', async (c) => {
    const supabase = getSupabase(c);
    const logger = getLogger(c);

    // 요청 본문 파싱
    const body = await c.req.json();

    // 요청 데이터 검증
    const validation = ReservationLookupRequestSchema.safeParse(body);
    if (!validation.success) {
      logger.error('Reservation lookup request validation failed', validation.error.format());
      return c.json(
        {
          success: false,
          error: {
            code: reservationErrorCodes.VALIDATION_ERROR,
            message: '입력값이 유효하지 않습니다.',
            details: validation.error.format(),
          },
        },
        400
      );
    }

    const result = await lookupReservation(supabase, validation.data);

    if (!result.ok) {
      const errorResult = result as ErrorResult<ReservationServiceError, unknown>;

      if (errorResult.error.code === reservationErrorCodes.INVALID_PASSWORD) {
        logger.warn('Invalid password or reservation not found', { phoneNumber: validation.data.phoneNumber });
      } else if (errorResult.error.code === reservationErrorCodes.RESERVATION_DB_ERROR) {
        logger.error('Database error while looking up reservation', errorResult.error.message);
      }

      return respond(c, result);
    }

    return respond(c, result);
  });

  // POST /api/reservations - 예약 생성
  app.post('/api/reservations', async (c) => {
    const supabase = getSupabase(c);
    const logger = getLogger(c);

    // 요청 본문 파싱
    const body = await c.req.json();

    // 요청 데이터 검증
    const validation = CreateReservationRequestSchema.safeParse(body);
    if (!validation.success) {
      logger.error('Reservation creation request validation failed', validation.error.format());
      return c.json(
        {
          success: false,
          error: {
            code: reservationErrorCodes.VALIDATION_ERROR,
            message: '입력값이 유효하지 않습니다.',
            details: validation.error.format(),
          },
        },
        400
      );
    }

    const result = await createReservation(supabase, validation.data);

    if (!result.ok) {
      const errorResult = result as ErrorResult<ReservationServiceError, unknown>;

      if (errorResult.error.code === reservationErrorCodes.SEAT_HOLD_EXPIRED) {
        logger.error('Seat hold expired', errorResult.error.details);
      } else if (errorResult.error.code === reservationErrorCodes.SEAT_NOT_HELD) {
        logger.error('Seat not held', errorResult.error.details);
      } else if (errorResult.error.code === reservationErrorCodes.DB_TRANSACTION_FAILED) {
        logger.error('Database transaction failed', errorResult.error.message);
      } else if (errorResult.error.code === reservationErrorCodes.INVALID_CONCERT) {
        logger.error('Invalid concert', errorResult.error.message);
      }

      return respond(c, result);
    }

    // 성공 시 201 Created 반환
    return respond(c, result);
  });

  // DELETE /api/reservations/:id - 예약 취소
  app.delete('/api/reservations/:id', async (c) => {
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

    const result = await cancelReservation(supabase, id);

    if (!result.ok) {
      const errorResult = result as ErrorResult<ReservationServiceError, unknown>;

      if (errorResult.error.code === reservationErrorCodes.RESERVATION_NOT_FOUND) {
        logger.error('Reservation not found for cancellation', { id });
      } else if (errorResult.error.code === reservationErrorCodes.ALREADY_CANCELLED) {
        logger.warn('Reservation already cancelled', { id });
      } else if (errorResult.error.code === reservationErrorCodes.CANCELLATION_FAILED) {
        logger.error('Cancellation failed', errorResult.error.message);
      }

      return respond(c, result);
    }

    return respond(c, result);
  });
};
