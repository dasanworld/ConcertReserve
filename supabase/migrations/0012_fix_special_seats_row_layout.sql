-- Fix BLACKPINK and BTS Special tier seat rows
-- 48 seats should be arranged as 3 rows × 16 seats per row
-- Originally 4 rows × 12 seats, consolidate row D into row C
-- A: seat 1-12, B: seat 13-24, C: seat 25-36, D→C: seat 37-48

-- BLACKPINK Special tier - Fix row layout
UPDATE public.seats
SET row_number = 
  CASE 
    WHEN row_number = 1 THEN 1  -- A
    WHEN row_number = 2 THEN 2  -- B
    WHEN row_number = 3 THEN 3  -- C (keep 1-12)
    WHEN row_number = 4 THEN 3  -- D → C (shift to 13-24)
  END,
  row_label = 
  CASE 
    WHEN row_number = 1 THEN 'A'
    WHEN row_number = 2 THEN 'B'
    ELSE 'C'
  END,
  seat_number = 
  CASE 
    WHEN row_number = 1 THEN seat_number      -- A: 1-12
    WHEN row_number = 2 THEN seat_number + 12 -- B: 13-24 (shift original B)
    WHEN row_number = 3 THEN seat_number + 24 -- C: 25-36 (shift original C)
    WHEN row_number = 4 THEN seat_number + 24 -- D→C: 25-36 (shift original D, but label C)
  END
WHERE concert_id = 'b80ac6ea-9221-4a76-81e0-b0f5e316f52f'
  AND seat_tier_id IN (
    SELECT id FROM concert_seat_tiers 
    WHERE concert_id = 'b80ac6ea-9221-4a76-81e0-b0f5e316f52f' 
    AND label = 'Special'
  )
  AND deleted_at IS NULL;

-- BTS Special tier - Fix row layout
UPDATE public.seats
SET row_number = 
  CASE 
    WHEN row_number = 1 THEN 1  -- A
    WHEN row_number = 2 THEN 2  -- B
    WHEN row_number = 3 THEN 3  -- C (keep 1-12)
    WHEN row_number = 4 THEN 3  -- D → C (shift to 13-24)
  END,
  row_label = 
  CASE 
    WHEN row_number = 1 THEN 'A'
    WHEN row_number = 2 THEN 'B'
    ELSE 'C'
  END,
  seat_number = 
  CASE 
    WHEN row_number = 1 THEN seat_number      -- A: 1-12
    WHEN row_number = 2 THEN seat_number + 12 -- B: 13-24 (shift original B)
    WHEN row_number = 3 THEN seat_number + 24 -- C: 25-36 (shift original C)
    WHEN row_number = 4 THEN seat_number + 24 -- D→C: 25-36 (shift original D, but label C)
  END
WHERE concert_id = '2b4820e5-be09-4223-b41c-6da9c90b758a'
  AND seat_tier_id IN (
    SELECT id FROM concert_seat_tiers 
    WHERE concert_id = '2b4820e5-be09-4223-b41c-6da9c90b758a' 
    AND label = 'Special'
  )
  AND deleted_at IS NULL;
