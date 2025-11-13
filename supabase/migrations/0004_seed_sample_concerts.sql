-- ============================================
-- Migration: Seed Sample Concert Data
-- Description: Inserts sample concert data for testing
-- ============================================

BEGIN;

-- Insert sample concerts
INSERT INTO concerts (title, status, thumbnail_url, concert_date, venue)
VALUES
  (
    'IVE Concert 2025 <Either>',
    'published',
    'https://picsum.photos/seed/ive_concert/400/300',
    '2025-04-15 19:00:00+09',
    '서울 올림픽공원 체조경기장'
  ),
  (
    '뉴진스 월드투어 서울 콘서트',
    'published',
    'https://picsum.photos/seed/newjeans_concert/400/300',
    '2025-07-20 20:00:00+09',
    '부산 벡스코 오디토리움'
  ),
  (
    'SEVENTEEN <Right Here> World Tour',
    'published',
    'https://picsum.photos/seed/seventeen_concert/400/300',
    '2025-09-10 18:30:00+09',
    '대구 엑스코'
  )
ON CONFLICT DO NOTHING;

COMMIT;

-- ============================================
-- End of Migration
-- ============================================
