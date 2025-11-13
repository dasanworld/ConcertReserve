import { handle } from 'hono/vercel';
import { createHonoApp } from '@/backend/hono/app';

// Force dynamic rendering - API 라우트는 항상 동적이어야 함
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Vercel Serverless Function으로 배포될 때 앱 초기화
const app = createHonoApp();

export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const PATCH = handle(app);
export const DELETE = handle(app);
export const OPTIONS = handle(app);
