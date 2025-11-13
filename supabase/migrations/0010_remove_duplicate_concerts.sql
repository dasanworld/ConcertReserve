-- ============================================
-- Migration: Remove Duplicate Concert Data
-- Description: Removes duplicate concert records that were created by ON CONFLICT DO NOTHING
-- ============================================

BEGIN;

-- Delete duplicate concerts, keeping only the first one by created_at
DELETE FROM concerts
WHERE id NOT IN (
  SELECT MIN(id)
  FROM concerts
  WHERE title IN (
    'IU Concert Tour 2025 - Gleam',
    'BLACKPINK World Tour 2025 - ENCORE',
    'BTS World Tour 2025 - Permission to Dance'
  )
  GROUP BY title
);

COMMIT;

-- ============================================
-- End of Migration
-- ============================================
