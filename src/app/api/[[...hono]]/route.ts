import { handle } from 'hono/vercel';
import { createHonoApp } from '@/backend/hono/app';

export const runtime = 'nodejs';

// Hono 앱을 동적으로 초기화 (빌드 타임에 환경 변수 에러 방지)
let app: any = null;

const getApp = () => {
  if (!app) {
    app = createHonoApp();
  }
  return app;
};

export const GET = (request: Request) => {
  return handle(getApp())(request);
};

export const POST = (request: Request) => {
  return handle(getApp())(request);
};

export const PUT = (request: Request) => {
  return handle(getApp())(request);
};

export const PATCH = (request: Request) => {
  return handle(getApp())(request);
};

export const DELETE = (request: Request) => {
  return handle(getApp())(request);
};

export const OPTIONS = (request: Request) => {
  return handle(getApp())(request);
};
