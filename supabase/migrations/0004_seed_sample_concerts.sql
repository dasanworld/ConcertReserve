-- ============================================
-- Migration: Seed Sample Concert Data
-- Description: Inserts sample concert data for testing
-- ============================================

BEGIN;

-- Insert sample concerts
INSERT INTO concerts (title, status, thumbnail_url, concert_date, venue)
VALUES
  (
    'IU Concert Tour 2025 - Gleam',
    'published',
    'https://picsum.photos/seed/iu_concert_2025/400/300',
    '2025-03-28 19:00:00+09',
    '서울 올림픽공원 체조경기장'
  ),
  (
    'BLACKPINK World Tour 2025 - ENCORE',
    'published',
    'https://picsum.photos/seed/blackpink_world_tour/400/300',
    '2025-06-15 20:00:00+09',
    '서울 잠실 올림픽주경기장'
  ),
  (
    'BTS World Tour 2025 - Permission to Dance',
    'published',
    'https://picsum.photos/seed/bts_world_tour/400/300',
    '2025-08-22 18:30:00+09',
    '부산 벡스코 오디토리움'
  )
ON CONFLICT DO NOTHING;

COMMIT;

-- ============================================
-- End of Migration
-- ============================================
