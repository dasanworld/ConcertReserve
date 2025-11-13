-- Fix BLACKPINK and BTS Special tier seat rows
-- 48 seats should be arranged as 3 rows × 16 seats per row
-- Originally 4 rows × 12 seats, consolidate into 3 rows with proper numbering
-- A: seat 1-16, B: seat 17-32, C: seat 33-48

-- First, delete existing seats and recreate them properly
-- BLACKPINK Special tier - Recreate seats correctly
DELETE FROM public.seats
WHERE concert_id = 'b80ac6ea-9221-4a76-81e0-b0f5e316f52f'
  AND seat_tier_id IN (
    SELECT id FROM concert_seat_tiers 
    WHERE concert_id = 'b80ac6ea-9221-4a76-81e0-b0f5e316f52f' 
    AND label = 'Special'
  );

-- Recreate 48 seats as 3 rows × 16 seats
INSERT INTO public.seats (
  id, concert_id, seat_tier_id, label, section_label, row_number, row_label, seat_number, 
  status, created_at, updated_at
)
SELECT
  gen_random_uuid(),
  'b80ac6ea-9221-4a76-81e0-b0f5e316f52f',
  (SELECT id FROM concert_seat_tiers WHERE concert_id = 'b80ac6ea-9221-4a76-81e0-b0f5e316f52f' AND label = 'Special'),
  'SP-' || CHR(65 + (row_num - 1)) || LPAD((seat_num::text), 2, '0'),
  'SP',
  row_num,
  CHR(65 + (row_num - 1)),
  seat_num,
  'available',
  NOW(),
  NOW()
FROM (
  SELECT generate_series(1, 3) as row_num
) rows,
(
  SELECT generate_series(1, 16) as seat_num
) seats;

-- BTS Special tier - Recreate seats correctly
DELETE FROM public.seats
WHERE concert_id = '2b4820e5-be09-4223-b41c-6da9c90b758a'
  AND seat_tier_id IN (
    SELECT id FROM concert_seat_tiers 
    WHERE concert_id = '2b4820e5-be09-4223-b41c-6da9c90b758a' 
    AND label = 'Special'
  );

-- Recreate 48 seats as 3 rows × 16 seats
INSERT INTO public.seats (
  id, concert_id, seat_tier_id, label, section_label, row_number, row_label, seat_number,
  status, created_at, updated_at
)
SELECT
  gen_random_uuid(),
  '2b4820e5-be09-4223-b41c-6da9c90b758a',
  (SELECT id FROM concert_seat_tiers WHERE concert_id = '2b4820e5-be09-4223-b41c-6da9c90b758a' AND label = 'Special'),
  'SP-' || CHR(65 + (row_num - 1)) || LPAD((seat_num::text), 2, '0'),
  'SP',
  row_num,
  CHR(65 + (row_num - 1)),
  seat_num,
  'available',
  NOW(),
  NOW()
FROM (
  SELECT generate_series(1, 3) as row_num
) rows,
(
  SELECT generate_series(1, 16) as seat_num
) seats;
