-- Fix BLACKPINK and BTS Special tier seat rows
-- 48 seats should be arranged as 3 rows × 4 groups (12 seats per row)
-- Not 4 rows × 12 seats

-- BLACKPINK Special tier - Fix row layout
UPDATE public.seats
SET row_number = 
  CASE 
    WHEN row_number = 1 THEN 1  -- A
    WHEN row_number = 2 THEN 2  -- B
    WHEN row_number = 3 THEN 3  -- C
    WHEN row_number = 4 THEN 3  -- D → C (combine to row 3)
  END,
  row_label = 
  CASE 
    WHEN row_number = 1 THEN 'A'
    WHEN row_number = 2 THEN 'B'
    WHEN row_number = 3 THEN 'C'
    WHEN row_number = 4 THEN 'C'
  END,
  seat_number = 
  CASE 
    WHEN row_number = 4 THEN seat_number + 12  -- Shift D row seats to continue C row
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
SET row_number = 
  CASE 
    WHEN row_number = 1 THEN 1  -- A
    WHEN row_number = 2 THEN 2  -- B
    WHEN row_number = 3 THEN 3  -- C
    WHEN row_number = 4 THEN 3  -- D → C (combine to row 3)
  END,
  row_label = 
  CASE 
    WHEN row_number = 1 THEN 'A'
    WHEN row_number = 2 THEN 'B'
    WHEN row_number = 3 THEN 'C'
    WHEN row_number = 4 THEN 'C'
  END,
  seat_number = 
  CASE 
    WHEN row_number = 4 THEN seat_number + 12  -- Shift D row seats to continue C row
    ELSE seat_number
  END
WHERE concert_id = '2b4820e5-be09-4223-b41c-6da9c90b758a'
  AND seat_tier_id IN (
    SELECT id FROM concert_seat_tiers 
    WHERE concert_id = '2b4820e5-be09-4223-b41c-6da9c90b758a' 
    AND label = 'Special'
  )
  AND deleted_at IS NULL;
