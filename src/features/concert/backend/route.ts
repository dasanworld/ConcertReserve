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
import { getConcertList, getConcertDetail } from './service';
import {
  concertErrorCodes,
  type ConcertServiceError,
} from './error';

export const registerConcertRoutes = (app: Hono<AppEnv>) => {
  app.get('/api/concerts', async (c) => {
    const supabase = getSupabase(c);
    const logger = getLogger(c);

    const result = await getConcertList(supabase);

    if (!result.ok) {
      const errorResult = result as ErrorResult<ConcertServiceError, unknown>;

      if (errorResult.error.code === concertErrorCodes.fetchFailed) {
        logger.error('Failed to fetch concert list', errorResult.error.message);
      }

      return respond(c, result);
    }

    return respond(c, result);
  });

  app.get('/api/concerts/:concertId', async (c) => {
    const supabase = getSupabase(c);
    const logger = getLogger(c);
    const { concertId } = c.req.param();

    const result = await getConcertDetail(supabase, concertId);

    if (!result.ok) {
      const errorResult = result as ErrorResult<ConcertServiceError, unknown>;

      if (errorResult.error.code === concertErrorCodes.notFound) {
        logger.error('Concert not found', { concertId });
      } else if (errorResult.error.code === concertErrorCodes.fetchFailed) {
        logger.error('Failed to fetch concert detail', errorResult.error.message);
      }

      return respond(c, result);
    }

    return respond(c, result);
  });
};
