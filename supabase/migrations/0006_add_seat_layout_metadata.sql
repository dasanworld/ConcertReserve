-- ============================================
-- Migration: Add Seat Layout Metadata
-- Description:
--   * Adds section/row metadata columns to seats table
--   * Reseeds sample concerts with structured seat labels
--     so that each tier exposes section + row information
-- ============================================

BEGIN;

-- 1) Add layout columns to seats table
ALTER TABLE seats
  ADD COLUMN IF NOT EXISTS section_label text,
  ADD COLUMN IF NOT EXISTS row_label text,
  ADD COLUMN IF NOT EXISTS row_number integer,
  ADD COLUMN IF NOT EXISTS seat_number integer;

COMMENT ON COLUMN seats.section_label IS '좌석이 속한 구역/블록 라벨';
COMMENT ON COLUMN seats.row_label IS '좌석 행 라벨 (예: A, B, C)';
COMMENT ON COLUMN seats.row_number IS '좌석 행 번호 (정렬용)';
COMMENT ON COLUMN seats.seat_number IS '행 내 좌석 번호';

-- 2) Remove previously seeded seats for the sample concerts
WITH target_concerts AS (
  SELECT id
  FROM concerts
  WHERE title IN (
    'IU Concert Tour 2025 - Gleam',
    'BLACKPINK World Tour 2025 - ENCORE',
    'BTS World Tour 2025 - Permission to Dance'
  )
)
DELETE FROM seats
WHERE concert_id IN (SELECT id FROM target_concerts);

-- 3) Seed structured layout for each tier across the sample concerts
WITH target_concerts AS (
  SELECT id, title
  FROM concerts
  WHERE title IN (
    'IU Concert Tour 2025 - Gleam',
    'BLACKPINK World Tour 2025 - ENCORE',
    'BTS World Tour 2025 - Permission to Dance'
  )
),
layout_specs AS (
  -- (tier_label, section_prefix, section_count, rows_per_section, seats_per_row)
  SELECT *
  FROM (
    VALUES
      ('Special',  'SP', 2, 4, 6),  -- 2 sections * 4 rows * 6 seats = 48
      ('Premium',  'PR', 4, 4, 4),  -- 4 * 4 * 4 = 64
      ('Advanced', 'AD', 4, 8, 4),  -- 4 * 8 * 4 = 128
      ('Regular',  'RG', 5, 4, 4)   -- 5 * 4 * 4 = 80
  ) AS v(label, section_prefix, section_count, rows_per_section, seats_per_row)
),
tier_layout AS (
  SELECT
    c.id AS concert_id,
    st.id AS seat_tier_id,
    st.label AS tier_label,
    ls.section_prefix,
    ls.section_count,
    ls.rows_per_section,
    ls.seats_per_row
  FROM concert_seat_tiers st
  JOIN target_concerts c ON c.id = st.concert_id
  JOIN layout_specs ls ON ls.label = st.label
),
generated_seats AS (
  SELECT
    tl.concert_id,
    tl.seat_tier_id,
    tl.tier_label,
    tl.section_prefix || section_idx::text AS section_label,
    section_idx AS section_number,
    chr(64 + row_idx) AS row_label,
    row_idx AS row_number,
    seat_idx AS seat_number,
    CONCAT(
      tl.section_prefix,
      section_idx::text,
      '-',
      chr(64 + row_idx),
      LPAD(seat_idx::text, 2, '0')
    ) AS seat_label
  FROM tier_layout tl
  CROSS JOIN generate_series(1, tl.section_count) AS section_idx
  CROSS JOIN generate_series(1, tl.rows_per_section) AS row_idx
  CROSS JOIN generate_series(1, tl.seats_per_row) AS seat_idx
)
INSERT INTO seats (
  concert_id,
  seat_tier_id,
  label,
  status,
  section_label,
  row_label,
  row_number,
  seat_number
)
SELECT
  concert_id,
  seat_tier_id,
  seat_label,
  'available',
  section_label,
  row_label,
  row_number,
  seat_number
FROM generated_seats
ORDER BY concert_id, seat_tier_id, section_label, row_number, seat_number;

COMMIT;

-- ============================================
-- End of Migration
-- ============================================
