-- Fix BLACKPINK and BTS Special tier seat rows
-- 48 seats should be arranged as 3 rows × 16 seats per row
-- Originally 4 rows × 12 seats, consolidate into 3 rows with proper numbering
-- A: seat 1-16, B: seat 17-32, C: seat 33-48

-- BLACKPINK Special tier - Fix row layout
-- Step 1: Add temporary column to preserve original position
ALTER TABLE public.seats ADD COLUMN IF NOT EXISTS temp_seat_order INT;

-- Step 2: Update BLACKPINK Special seats with new numbering
UPDATE public.seats
SET 
  row_number = CASE 
    WHEN row_number = 1 THEN 1  -- A
    WHEN row_number = 2 THEN 2  -- B
    WHEN row_number = 3 THEN 3  -- C
    WHEN row_number = 4 THEN 3  -- D → C
  END,
  row_label = CASE 
    WHEN row_number = 1 THEN 'A'
    WHEN row_number = 2 THEN 'B'
    ELSE 'C'
  END,
  seat_number = 
    -- Original A: 1-12 → stays 1-12 (then pad to 16)
    CASE WHEN row_number = 1 THEN seat_number
    -- Original B: 1-12 → 13-24 (shift by 12, then pad to 32)
    WHEN row_number = 2 THEN seat_number + 12
    -- Original C: 1-12 → 25-36 (shift by 24)
    WHEN row_number = 3 AND seat_number <= 12 THEN seat_number + 24
    -- Original D: 1-12 → 37-48 (shift by 36)
    WHEN row_number = 4 THEN seat_number + 36
    ELSE seat_number
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
SET 
  row_number = CASE 
    WHEN row_number = 1 THEN 1  -- A
    WHEN row_number = 2 THEN 2  -- B
    WHEN row_number = 3 THEN 3  -- C
    WHEN row_number = 4 THEN 3  -- D → C
  END,
  row_label = CASE 
    WHEN row_number = 1 THEN 'A'
    WHEN row_number = 2 THEN 'B'
    ELSE 'C'
  END,
  seat_number = 
    -- Original A: 1-12 → stays 1-12
    CASE WHEN row_number = 1 THEN seat_number
    -- Original B: 1-12 → 13-24 (shift by 12)
    WHEN row_number = 2 THEN seat_number + 12
    -- Original C: 1-12 → 25-36 (shift by 24)
    WHEN row_number = 3 AND seat_number <= 12 THEN seat_number + 24
    -- Original D: 1-12 → 37-48 (shift by 36)
    WHEN row_number = 4 THEN seat_number + 36
    ELSE seat_number
  END
WHERE concert_id = '2b4820e5-be09-4223-b41c-6da9c90b758a'
  AND seat_tier_id IN (
    SELECT id FROM concert_seat_tiers 
    WHERE concert_id = '2b4820e5-be09-4223-b41c-6da9c90b758a' 
    AND label = 'Special'
  )
  AND deleted_at IS NULL;
