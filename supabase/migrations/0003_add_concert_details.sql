-- ============================================
-- Migration: Add Concert Detail Fields
-- Description: Adds thumbnail, date, venue fields to concerts table
-- ============================================

BEGIN;

-- Add new columns to concerts table
ALTER TABLE concerts
ADD COLUMN IF NOT EXISTS thumbnail_url text,
ADD COLUMN IF NOT EXISTS concert_date timestamptz,
ADD COLUMN IF NOT EXISTS venue text;

-- Add comments for new columns
COMMENT ON COLUMN concerts.thumbnail_url IS '콘서트 썸네일 이미지 URL';
COMMENT ON COLUMN concerts.concert_date IS '콘서트 개최 일시';
COMMENT ON COLUMN concerts.venue IS '콘서트 장소';

COMMIT;

-- ============================================
-- End of Migration
-- ============================================
