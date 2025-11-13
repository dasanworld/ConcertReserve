-- Rebuild seats table with correct structure
-- Delete all existing seats and recreate with proper data

BEGIN;

-- Delete existing seats
DELETE FROM public.seats WHERE concert_id = 'f73468e2-7d45-4eaa-ab2d-5d569edea9eb';

-- Special tier: 48 seats (3 rows, 16 seats per row)
WITH special_tier AS (SELECT id FROM public.concert_seat_tiers WHERE concert_id = 'f73468e2-7d45-4eaa-ab2d-5d569edea9eb' AND label = 'Special')
INSERT INTO public.seats (id, concert_id, seat_tier_id, label, status, section_label, row_label, row_number, seat_number, created_at, updated_at)
SELECT
  gen_random_uuid(), 'f73468e2-7d45-4eaa-ab2d-5d569edea9eb', (SELECT id FROM special_tier),
  'SP-' || CHR(65 + (row_num - 1)) || LPAD((seat_num::text), 2, '0'),
  'available', 'SP', CHR(65 + (row_num - 1)), row_num, seat_num,
  NOW(), NOW()
FROM (
  SELECT generate_series(1, 3) as row_num
) rows,
(
  SELECT generate_series(1, 16) as seat_num
) seats;

-- Premium tier: 64 seats (4 rows, 16 seats per row)
WITH premium_tier AS (SELECT id FROM public.concert_seat_tiers WHERE concert_id = 'f73468e2-7d45-4eaa-ab2d-5d569edea9eb' AND label = 'Premium')
INSERT INTO public.seats (id, concert_id, seat_tier_id, label, status, section_label, row_label, row_number, seat_number, created_at, updated_at)
SELECT
  gen_random_uuid(), 'f73468e2-7d45-4eaa-ab2d-5d569edea9eb', (SELECT id FROM premium_tier),
  'PR-' || CHR(65 + (row_num - 1)) || LPAD((seat_num::text), 2, '0'),
  'available', 'PR', CHR(65 + (row_num - 1)), row_num, seat_num,
  NOW(), NOW()
FROM (
  SELECT generate_series(1, 4) as row_num
) rows,
(
  SELECT generate_series(1, 16) as seat_num
) seats;

-- Advanced tier: 128 seats (8 rows, 16 seats per row)
WITH advanced_tier AS (SELECT id FROM public.concert_seat_tiers WHERE concert_id = 'f73468e2-7d45-4eaa-ab2d-5d569edea9eb' AND label = 'Advanced')
INSERT INTO public.seats (id, concert_id, seat_tier_id, label, status, section_label, row_label, row_number, seat_number, created_at, updated_at)
SELECT
  gen_random_uuid(), 'f73468e2-7d45-4eaa-ab2d-5d569edea9eb', (SELECT id FROM advanced_tier),
  'AD-' || CHR(65 + (row_num - 1)) || LPAD((seat_num::text), 2, '0'),
  'available', 'AD', CHR(65 + (row_num - 1)), row_num, seat_num,
  NOW(), NOW()
FROM (
  SELECT generate_series(1, 8) as row_num
) rows,
(
  SELECT generate_series(1, 16) as seat_num
) seats;

-- Regular tier: 80 seats (5 rows, 16 seats per row)
WITH regular_tier AS (SELECT id FROM public.concert_seat_tiers WHERE concert_id = 'f73468e2-7d45-4eaa-ab2d-5d569edea9eb' AND label = 'Regular')
INSERT INTO public.seats (id, concert_id, seat_tier_id, label, status, section_label, row_label, row_number, seat_number, created_at, updated_at)
SELECT
  gen_random_uuid(), 'f73468e2-7d45-4eaa-ab2d-5d569edea9eb', (SELECT id FROM regular_tier),
  'RG-' || CHR(65 + (row_num - 1)) || LPAD((seat_num::text), 2, '0'),
  'available', 'RG', CHR(65 + (row_num - 1)), row_num, seat_num,
  NOW(), NOW()
FROM (
  SELECT generate_series(1, 5) as row_num
) rows,
(
  SELECT generate_series(1, 16) as seat_num
) seats;

COMMIT;
