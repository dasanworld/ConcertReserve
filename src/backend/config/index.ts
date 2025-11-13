import type { AppConfig } from '@/backend/hono/context';

let cachedConfig: AppConfig | null = null;

export const getAppConfig = (): AppConfig => {
  if (cachedConfig) {
    return cachedConfig;
  }

  // Fallback to NEXT_PUBLIC_SUPABASE_URL if SUPABASE_URL is not set
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!supabaseUrl) {
    throw new Error(
      'Invalid backend configuration: SUPABASE_URL: Required (set SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL)'
    );
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error('Invalid backend configuration: SUPABASE_SERVICE_ROLE_KEY: Required');
  }

  cachedConfig = {
    supabase: {
      url: supabaseUrl,
      serviceRoleKey: serviceRoleKey,
    },
  } satisfies AppConfig;

  return cachedConfig;
};
