-- ============================================
-- Migration: Ensure Public Schema Permissions
-- Description:
--   Re-grants USAGE on schema public and SELECT/ALL privileges
--   so that service_role (used by backend) and anon/authenticated
--   roles can access tables without "permission denied for schema public".
-- ============================================

BEGIN;

DO $$
BEGIN
  -- Grant schema usage so PostgREST roles can access objects
  EXECUTE 'GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role';

  -- Ensure service_role has full table access (needed for backend)
  EXECUTE 'GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role';
  EXECUTE 'GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role';

  -- Read-only access for anon/authenticated roles
  EXECUTE 'GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated';
  EXECUTE 'GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated';

  -- Keep future objects aligned
  EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO anon, authenticated';
  EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO anon, authenticated';
  EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role';
  EXECUTE 'ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role';
END $$;

COMMIT;

-- ============================================
-- End of Migration
-- ============================================

