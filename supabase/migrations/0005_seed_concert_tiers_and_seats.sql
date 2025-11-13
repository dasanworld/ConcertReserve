-- ============================================
-- Migration: Seed Concert Seat Tiers and Seats
-- Description: Adds tier pricing/seat data for all sample concerts
--              based on docs requirements (Usecase 001, 002 specs)
-- ============================================

BEGIN;

WITH target_concerts AS (
    SELECT id, title
    FROM concerts
    WHERE title IN (
        'IU Concert Tour 2025 - Gleam',
        'BLACKPINK World Tour 2025 - ENCORE',
        'BTS World Tour 2025 - Permission to Dance'
    )
),
tier_specs AS (
    SELECT *
    FROM (
        VALUES
            ('IU Concert Tour 2025 - Gleam', 'Special', 250000, 48),
            ('IU Concert Tour 2025 - Gleam', 'Premium', 180000, 64),
            ('IU Concert Tour 2025 - Gleam', 'Advanced', 170000, 128),
            ('IU Concert Tour 2025 - Gleam', 'Regular', 140000, 80),
            ('BLACKPINK World Tour 2025 - ENCORE', 'Special', 250000, 48),
            ('BLACKPINK World Tour 2025 - ENCORE', 'Premium', 180000, 64),
            ('BLACKPINK World Tour 2025 - ENCORE', 'Advanced', 170000, 128),
            ('BLACKPINK World Tour 2025 - ENCORE', 'Regular', 140000, 80),
            ('BTS World Tour 2025 - Permission to Dance', 'Special', 250000, 48),
            ('BTS World Tour 2025 - Permission to Dance', 'Premium', 180000, 64),
            ('BTS World Tour 2025 - Permission to Dance', 'Advanced', 170000, 128),
            ('BTS World Tour 2025 - Permission to Dance', 'Regular', 140000, 80)
    ) AS v(title, label, price, seat_count)
),
tier_data AS (
    SELECT
        c.id AS concert_id,
        ts.label,
        ts.price,
        ts.seat_count
    FROM tier_specs ts
    JOIN target_concerts c ON c.title = ts.title
),
upserted_tiers AS (
    INSERT INTO concert_seat_tiers (concert_id, label, price)
    SELECT concert_id, label, price
    FROM tier_data
    ON CONFLICT (concert_id, label)
    DO UPDATE SET price = EXCLUDED.price
    RETURNING id, concert_id, label
),
tier_results AS (
    SELECT
        ut.id AS seat_tier_id,
        ut.concert_id,
        td.seat_count,
        ut.label
    FROM upserted_tiers ut
    JOIN tier_data td
        ON td.concert_id = ut.concert_id
       AND td.label = ut.label
),
seat_sources AS (
    SELECT
        tr.concert_id,
        tr.seat_tier_id,
        tr.label,
        gs.num,
        CONCAT(
            UPPER(REGEXP_REPLACE(tr.label, '[^a-zA-Z0-9]', '', 'g')),
            '-',
            LPAD(gs.num::text, 3, '0')
        ) AS seat_label
    FROM tier_results tr
    CROSS JOIN LATERAL generate_series(1, tr.seat_count) AS gs(num)
)
INSERT INTO seats (concert_id, seat_tier_id, label)
SELECT concert_id, seat_tier_id, seat_label
FROM seat_sources
ON CONFLICT (concert_id, label) DO NOTHING;

COMMIT;

-- ============================================
-- End of Migration
-- ============================================
