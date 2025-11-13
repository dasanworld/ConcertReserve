import { Hono } from 'hono';
import { errorBoundary } from '@/backend/middleware/error';
import { withAppContext } from '@/backend/middleware/context';
import { withSupabase } from '@/backend/middleware/supabase';
import { registerExampleRoutes } from '@/features/example/backend/route';
import { registerConcertRoutes } from '@/features/concert/backend/route';
import { registerSeatSelectionRoutes } from '@/features/seat-selection/backend/route';
import { registerReservationRoutes } from '@/features/reservation/backend/route';
import { registerJobRoutes } from '@/backend/jobs/route';
import type { AppEnv } from '@/backend/hono/context';

let singletonApp: Hono<AppEnv> | null = null;

export const createHonoApp = () => {
  if (singletonApp) {
    return singletonApp;
  }

  const app = new Hono<AppEnv>();

  app.use('*', errorBoundary());
  app.use('*', withAppContext());
  app.use('*', withSupabase());

  registerExampleRoutes(app);
  registerConcertRoutes(app);
  registerSeatSelectionRoutes(app);
  registerReservationRoutes(app);
  registerJobRoutes(app);

  singletonApp = app;

  return app;
};
