-- ============================================
-- Migration: Remove Duplicate Concert Data and Related Records
-- Description: Removes duplicate concert records and all related data
--              (seats, concert_seat_tiers, reservations, reservation_seats)
-- ============================================

BEGIN;

-- Find duplicate concerts to delete (keeping the first one by created_at)
WITH concerts_to_delete AS (
  SELECT id
  FROM concerts
  WHERE id NOT IN (
    SELECT DISTINCT ON (title) id
    FROM concerts
    WHERE title IN (
      'IU Concert Tour 2025 - Gleam',
      'BLACKPINK World Tour 2025 - ENCORE',
      'BTS World Tour 2025 - Permission to Dance'
    )
    ORDER BY title, created_at ASC
  )
  AND title IN (
    'IU Concert Tour 2025 - Gleam',
    'BLACKPINK World Tour 2025 - ENCORE',
    'BTS World Tour 2025 - Permission to Dance'
  )
)
DELETE FROM concerts
WHERE id IN (SELECT id FROM concerts_to_delete);

COMMIT;

-- ============================================
-- End of Migration
-- ============================================
