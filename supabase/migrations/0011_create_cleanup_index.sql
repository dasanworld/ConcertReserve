-- Create index for efficient cleanup queries
-- Improves performance when querying expired holds

CREATE INDEX IF NOT EXISTS idx_seats_status_hold_expires_at
ON public.seats(status, hold_expires_at)
WHERE status = 'temporarily_held' AND deleted_at IS NULL;

-- Comment
COMMENT ON INDEX idx_seats_status_hold_expires_at IS
'Index for cleanup job to efficiently find expired seat holds';
