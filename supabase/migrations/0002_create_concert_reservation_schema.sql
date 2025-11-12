-- ============================================
-- Migration: Concert Reservation System Schema
-- Description: Creates all tables, enums, indexes, constraints, and triggers
--              for the concert reservation system as defined in database.md
-- ============================================

BEGIN;

-- ============================================
-- 1. ENUM Type Definitions
-- ============================================

-- Concert status enum: draft, published, archived
DO $$ BEGIN
    CREATE TYPE concert_status AS ENUM ('draft', 'published', 'archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Seat status enum: available, temporarily_held, reserved
DO $$ BEGIN
    CREATE TYPE seat_status AS ENUM ('available', 'temporarily_held', 'reserved');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Reservation status enum: confirmed, cancelled
DO $$ BEGIN
    CREATE TYPE reservation_status AS ENUM ('confirmed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- 2. Updated_at Trigger Function
-- ============================================

-- Create or replace function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 3. concerts Table
-- ============================================

CREATE TABLE IF NOT EXISTS concerts (
    id              uuid            PRIMARY KEY DEFAULT gen_random_uuid(),
    title           text            NOT NULL,
    status          concert_status  NOT NULL DEFAULT 'draft',
    created_at      timestamptz     NOT NULL DEFAULT now(),
    updated_at      timestamptz     NOT NULL DEFAULT now(),
    deleted_at      timestamptz     NULL,

    -- Soft delete validation: deleted_at must be after created_at
    CONSTRAINT concerts_deleted_at_check CHECK (deleted_at IS NULL OR deleted_at >= created_at)
);

-- Partial index for published concerts (most frequently queried)
CREATE INDEX IF NOT EXISTS idx_concerts_status_published
ON concerts (status)
WHERE status = 'published';

-- Trigger to auto-update updated_at for concerts
DROP TRIGGER IF EXISTS update_concerts_updated_at ON concerts;
CREATE TRIGGER update_concerts_updated_at
    BEFORE UPDATE ON concerts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Disable RLS as per project guidelines
ALTER TABLE concerts DISABLE ROW LEVEL SECURITY;

COMMENT ON TABLE concerts IS '콘서트 메타정보 테이블';
COMMENT ON COLUMN concerts.id IS '콘서트 식별자';
COMMENT ON COLUMN concerts.title IS '콘서트 제목';
COMMENT ON COLUMN concerts.status IS 'published 상태만 사용자에게 노출';
COMMENT ON COLUMN concerts.deleted_at IS '소프트 삭제 시각';

-- ============================================
-- 4. concert_seat_tiers Table
-- ============================================

CREATE TABLE IF NOT EXISTS concert_seat_tiers (
    id              uuid            PRIMARY KEY DEFAULT gen_random_uuid(),
    concert_id      uuid            NOT NULL,
    label           text            NOT NULL,
    price           numeric(12,0)   NOT NULL,
    created_at      timestamptz     NOT NULL DEFAULT now(),
    updated_at      timestamptz     NOT NULL DEFAULT now(),
    deleted_at      timestamptz     NULL,

    -- Foreign key to concerts with cascade on update
    CONSTRAINT fk_concert_seat_tiers_concert_id
        FOREIGN KEY (concert_id)
        REFERENCES concerts(id)
        ON UPDATE CASCADE,

    -- Unique constraint: prevent duplicate tier labels per concert
    CONSTRAINT uq_concert_seat_tiers_concert_label
        UNIQUE (concert_id, label)
);

-- Trigger to auto-update updated_at for concert_seat_tiers
DROP TRIGGER IF EXISTS update_concert_seat_tiers_updated_at ON concert_seat_tiers;
CREATE TRIGGER update_concert_seat_tiers_updated_at
    BEFORE UPDATE ON concert_seat_tiers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Disable RLS
ALTER TABLE concert_seat_tiers DISABLE ROW LEVEL SECURITY;

COMMENT ON TABLE concert_seat_tiers IS '콘서트 좌석 등급 및 가격 정보';
COMMENT ON COLUMN concert_seat_tiers.id IS '좌석 등급 식별자';
COMMENT ON COLUMN concert_seat_tiers.concert_id IS '해당 콘서트 참조';
COMMENT ON COLUMN concert_seat_tiers.label IS '등급 명칭 (예: 스페셜, R석)';
COMMENT ON COLUMN concert_seat_tiers.price IS '등급별 가격';

-- ============================================
-- 5. seats Table
-- ============================================

CREATE TABLE IF NOT EXISTS seats (
    id                  uuid            PRIMARY KEY DEFAULT gen_random_uuid(),
    concert_id          uuid            NOT NULL,
    seat_tier_id        uuid            NOT NULL,
    label               text            NOT NULL,
    status              seat_status     NOT NULL DEFAULT 'available',
    hold_expires_at     timestamptz     NULL,
    created_at          timestamptz     NOT NULL DEFAULT now(),
    updated_at          timestamptz     NOT NULL DEFAULT now(),
    deleted_at          timestamptz     NULL,

    -- Foreign keys
    CONSTRAINT fk_seats_concert_id
        FOREIGN KEY (concert_id)
        REFERENCES concerts(id),
    CONSTRAINT fk_seats_seat_tier_id
        FOREIGN KEY (seat_tier_id)
        REFERENCES concert_seat_tiers(id),

    -- Unique constraint: prevent duplicate seat labels per concert
    CONSTRAINT uq_seats_concert_label
        UNIQUE (concert_id, label),

    -- Check: temporarily_held status must have hold_expires_at
    CONSTRAINT seats_hold_expires_check
        CHECK (
            (status = 'temporarily_held' AND hold_expires_at IS NOT NULL)
            OR
            (status <> 'temporarily_held')
        )
);

-- Partial index for cleanup scheduler to find expired held seats
CREATE INDEX IF NOT EXISTS idx_seats_hold_cleanup
ON seats (hold_expires_at)
WHERE status = 'temporarily_held';

-- Trigger to auto-update updated_at for seats
DROP TRIGGER IF EXISTS update_seats_updated_at ON seats;
CREATE TRIGGER update_seats_updated_at
    BEFORE UPDATE ON seats
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Disable RLS
ALTER TABLE seats DISABLE ROW LEVEL SECURITY;

COMMENT ON TABLE seats IS '콘서트 좌석 정보';
COMMENT ON COLUMN seats.id IS '좌석 식별자';
COMMENT ON COLUMN seats.concert_id IS '좌석이 속한 콘서트';
COMMENT ON COLUMN seats.seat_tier_id IS '좌석 등급/가격 매핑';
COMMENT ON COLUMN seats.label IS '좌석 표기 (행/번호 등)';
COMMENT ON COLUMN seats.status IS '좌석 상태 (available, temporarily_held, reserved)';
COMMENT ON COLUMN seats.hold_expires_at IS '임시 선점 만료 시각 (5분)';

-- ============================================
-- 6. reservations Table
-- ============================================

CREATE TABLE IF NOT EXISTS reservations (
    id              uuid                PRIMARY KEY DEFAULT gen_random_uuid(),
    concert_id      uuid                NOT NULL,
    customer_name   text                NOT NULL,
    phone_number    text                NOT NULL,
    password_hash   text                NOT NULL,
    status          reservation_status  NOT NULL DEFAULT 'confirmed',
    cancelled_at    timestamptz         NULL,
    created_at      timestamptz         NOT NULL DEFAULT now(),
    updated_at      timestamptz         NOT NULL DEFAULT now(),
    deleted_at      timestamptz         NULL,

    -- Foreign key to concerts
    CONSTRAINT fk_reservations_concert_id
        FOREIGN KEY (concert_id)
        REFERENCES concerts(id)
);

-- Index for phone number lookup (used in reservation query flow)
CREATE INDEX IF NOT EXISTS idx_reservations_phone
ON reservations (phone_number);

-- Trigger to auto-update updated_at for reservations
DROP TRIGGER IF EXISTS update_reservations_updated_at ON reservations;
CREATE TRIGGER update_reservations_updated_at
    BEFORE UPDATE ON reservations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Disable RLS
ALTER TABLE reservations DISABLE ROW LEVEL SECURITY;

COMMENT ON TABLE reservations IS '예약 정보';
COMMENT ON COLUMN reservations.id IS '예약 식별자';
COMMENT ON COLUMN reservations.concert_id IS '어떤 콘서트 예약인지';
COMMENT ON COLUMN reservations.customer_name IS '예약자 이름';
COMMENT ON COLUMN reservations.phone_number IS '휴대폰 번호 (조회 키)';
COMMENT ON COLUMN reservations.password_hash IS '해시된 비밀번호';
COMMENT ON COLUMN reservations.status IS '예약 상태 (confirmed, cancelled)';
COMMENT ON COLUMN reservations.cancelled_at IS '취소 완료 시각';

-- ============================================
-- 7. reservation_seats Table (Junction Table)
-- ============================================

CREATE TABLE IF NOT EXISTS reservation_seats (
    reservation_id  uuid            NOT NULL,
    seat_id         uuid            NOT NULL,
    created_at      timestamptz     NOT NULL DEFAULT now(),

    -- Composite primary key
    PRIMARY KEY (reservation_id, seat_id),

    -- Foreign keys
    CONSTRAINT fk_reservation_seats_reservation_id
        FOREIGN KEY (reservation_id)
        REFERENCES reservations(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_reservation_seats_seat_id
        FOREIGN KEY (seat_id)
        REFERENCES seats(id)
        ON UPDATE CASCADE
);

-- Disable RLS
ALTER TABLE reservation_seats DISABLE ROW LEVEL SECURITY;

COMMENT ON TABLE reservation_seats IS '예약과 좌석 간 매핑 테이블';
COMMENT ON COLUMN reservation_seats.reservation_id IS '예약 참조';
COMMENT ON COLUMN reservation_seats.seat_id IS '예약된 좌석';

-- ============================================
-- Final Validation and Commit
-- ============================================

-- Validate all tables were created successfully
DO $$
DECLARE
    missing_tables text[];
BEGIN
    SELECT array_agg(table_name)
    INTO missing_tables
    FROM (VALUES
        ('concerts'),
        ('concert_seat_tiers'),
        ('seats'),
        ('reservations'),
        ('reservation_seats')
    ) AS expected(table_name)
    WHERE NOT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = expected.table_name
    );

    IF missing_tables IS NOT NULL THEN
        RAISE EXCEPTION 'Missing tables: %', array_to_string(missing_tables, ', ');
    END IF;

    RAISE NOTICE 'All tables created successfully';
END $$;

COMMIT;

-- ============================================
-- End of Migration
-- ============================================
