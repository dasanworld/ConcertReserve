-- Fix ALL seat tiers for BLACKPINK and BTS concerts
-- Recreate all seats with proper numbering (no duplicates, correct row/seat numbers)

-- ============================================
-- BLACKPINK Concert (b80ac6ea-9221-4a76-81e0-b0f5e316f52f)
-- ============================================

-- Delete all BLACKPINK seats
DELETE FROM public.seats
WHERE concert_id = 'b80ac6ea-9221-4a76-81e0-b0f5e316f52f';

-- Regular tier: 80 seats (5 rows, 16 seats per row)
INSERT INTO public.seats (
  id, concert_id, seat_tier_id, label, section_label, row_number, row_label, seat_number,
  status, created_at, updated_at
)
SELECT
  gen_random_uuid(),
  'b80ac6ea-9221-4a76-81e0-b0f5e316f52f',
  (SELECT id FROM concert_seat_tiers WHERE concert_id = 'b80ac6ea-9221-4a76-81e0-b0f5e316f52f' AND label = 'Regular'),
  'RG-' || CHR(65 + (row_num - 1)) || LPAD((seat_num::text), 2, '0'),
  'RG',
  row_num,
  CHR(65 + (row_num - 1)),
  seat_num,
  'available',
  NOW(),
  NOW()
FROM (
  SELECT generate_series(1, 5) as row_num
) rows,
(
  SELECT generate_series(1, 16) as seat_num
) seats;

-- Advanced tier: 128 seats (8 rows, 16 seats per row)
INSERT INTO public.seats (
  id, concert_id, seat_tier_id, label, section_label, row_number, row_label, seat_number,
  status, created_at, updated_at
)
SELECT
  gen_random_uuid(),
  'b80ac6ea-9221-4a76-81e0-b0f5e316f52f',
  (SELECT id FROM concert_seat_tiers WHERE concert_id = 'b80ac6ea-9221-4a76-81e0-b0f5e316f52f' AND label = 'Advanced'),
  'AD-' || CHR(65 + (row_num - 1)) || LPAD((seat_num::text), 2, '0'),
  'AD',
  row_num,
  CHR(65 + (row_num - 1)),
  seat_num,
  'available',
  NOW(),
  NOW()
FROM (
  SELECT generate_series(1, 8) as row_num
) rows,
(
  SELECT generate_series(1, 16) as seat_num
) seats;

-- Premium tier: 64 seats (4 rows, 16 seats per row)
INSERT INTO public.seats (
  id, concert_id, seat_tier_id, label, section_label, row_number, row_label, seat_number,
  status, created_at, updated_at
)
SELECT
  gen_random_uuid(),
  'b80ac6ea-9221-4a76-81e0-b0f5e316f52f',
  (SELECT id FROM concert_seat_tiers WHERE concert_id = 'b80ac6ea-9221-4a76-81e0-b0f5e316f52f' AND label = 'Premium'),
  'PR-' || CHR(65 + (row_num - 1)) || LPAD((seat_num::text), 2, '0'),
  'PR',
  row_num,
  CHR(65 + (row_num - 1)),
  seat_num,
  'available',
  NOW(),
  NOW()
FROM (
  SELECT generate_series(1, 4) as row_num
) rows,
(
  SELECT generate_series(1, 16) as seat_num
) seats;

-- Special tier: 48 seats (3 rows, 16 seats per row)
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

-- ============================================
-- BTS Concert (2b4820e5-be09-4223-b41c-6da9c90b758a)
-- ============================================

-- Delete all BTS seats
DELETE FROM public.seats
WHERE concert_id = '2b4820e5-be09-4223-b41c-6da9c90b758a';

-- Regular tier: 80 seats (5 rows, 16 seats per row)
INSERT INTO public.seats (
  id, concert_id, seat_tier_id, label, section_label, row_number, row_label, seat_number,
  status, created_at, updated_at
)
SELECT
  gen_random_uuid(),
  '2b4820e5-be09-4223-b41c-6da9c90b758a',
  (SELECT id FROM concert_seat_tiers WHERE concert_id = '2b4820e5-be09-4223-b41c-6da9c90b758a' AND label = 'Regular'),
  'RG-' || CHR(65 + (row_num - 1)) || LPAD((seat_num::text), 2, '0'),
  'RG',
  row_num,
  CHR(65 + (row_num - 1)),
  seat_num,
  'available',
  NOW(),
  NOW()
FROM (
  SELECT generate_series(1, 5) as row_num
) rows,
(
  SELECT generate_series(1, 16) as seat_num
) seats;

-- Advanced tier: 128 seats (8 rows, 16 seats per row)
INSERT INTO public.seats (
  id, concert_id, seat_tier_id, label, section_label, row_number, row_label, seat_number,
  status, created_at, updated_at
)
SELECT
  gen_random_uuid(),
  '2b4820e5-be09-4223-b41c-6da9c90b758a',
  (SELECT id FROM concert_seat_tiers WHERE concert_id = '2b4820e5-be09-4223-b41c-6da9c90b758a' AND label = 'Advanced'),
  'AD-' || CHR(65 + (row_num - 1)) || LPAD((seat_num::text), 2, '0'),
  'AD',
  row_num,
  CHR(65 + (row_num - 1)),
  seat_num,
  'available',
  NOW(),
  NOW()
FROM (
  SELECT generate_series(1, 8) as row_num
) rows,
(
  SELECT generate_series(1, 16) as seat_num
) seats;

-- Premium tier: 64 seats (4 rows, 16 seats per row)
INSERT INTO public.seats (
  id, concert_id, seat_tier_id, label, section_label, row_number, row_label, seat_number,
  status, created_at, updated_at
)
SELECT
  gen_random_uuid(),
  '2b4820e5-be09-4223-b41c-6da9c90b758a',
  (SELECT id FROM concert_seat_tiers WHERE concert_id = '2b4820e5-be09-4223-b41c-6da9c90b758a' AND label = 'Premium'),
  'PR-' || CHR(65 + (row_num - 1)) || LPAD((seat_num::text), 2, '0'),
  'PR',
  row_num,
  CHR(65 + (row_num - 1)),
  seat_num,
  'available',
  NOW(),
  NOW()
FROM (
  SELECT generate_series(1, 4) as row_num
) rows,
(
  SELECT generate_series(1, 16) as seat_num
) seats;

-- Special tier: 48 seats (3 rows, 16 seats per row)
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
