import type { Hono } from 'hono';
import { respond } from '@/backend/http/response';
import { getLogger, getSupabase, type AppEnv } from '@/backend/hono/context';
import { getSeatsByConcertId, holdSeats } from '@/features/seat-selection/backend/service';
import { SeatHoldRequestSchema } from '@/features/seat-selection/backend/schema';

export const registerSeatSelectionRoutes = (app: Hono<AppEnv>) => {
  // GET /api/concerts/:concertId/seats - 좌석 조회
  app.get('/api/concerts/:concertId/seats', async (c) => {
    const supabase = getSupabase(c);
    const logger = getLogger(c);
    const { concertId } = c.req.param();

    logger.info(`Fetching seats for concert: ${concertId}`);

    const result = await getSeatsByConcertId(supabase, concertId);

    return respond(c, result);
  });

  // POST /api/seats/hold - 좌석 선점
  app.post('/api/seats/hold', async (c) => {
    const supabase = getSupabase(c);
    const logger = getLogger(c);

    const body = await c.req.json();

    // Validate request body
    const parseResult = SeatHoldRequestSchema.safeParse(body);
    if (!parseResult.success) {
      return c.json(
        {
          ok: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request body',
            details: parseResult.error.format(),
          },
        },
        400
      );
    }

    const { concertId, seatIds } = parseResult.data;

    logger.info(`Holding seats for concert ${concertId}:`, seatIds);

    const result = await holdSeats(supabase, concertId, seatIds);

    return respond(c, result);
  });
};
