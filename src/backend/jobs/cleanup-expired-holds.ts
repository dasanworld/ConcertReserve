import { createClient } from '@supabase/supabase-js';
import { getAppConfig } from '@/backend/config';

const SEATS_TABLE = 'seats';

/**
 * 만료된 선점 좌석을 자동으로 복구하는 작업
 * 
 * 목적:
 * - status = 'temporarily_held' AND hold_expires_at < now()인 좌석을
 *   'available' 상태로 변경
 * 
 * 실행 빈도: 1분마다 (Vercel Cron Jobs 또는 외부 스케줄러)
 */
export async function cleanupExpiredHolds() {
  try {
    const config = getAppConfig();
    
    const supabase = createClient(
      config.supabase.url,
      config.supabase.serviceRoleKey
    );

    // 1. 만료된 선점 좌석 조회
    const { data: expiredSeats, error: fetchError } = await supabase
      .from(SEATS_TABLE)
      .select('id, label, concert_id')
      .eq('status', 'temporarily_held')
      .lt('hold_expires_at', new Date().toISOString())
      .is('deleted_at', null);

    if (fetchError) {
      throw new Error(`Failed to fetch expired holds: ${fetchError.message}`);
    }

    if (!expiredSeats || expiredSeats.length === 0) {
      return {
        success: true,
        message: 'No expired holds to cleanup',
        clearedCount: 0,
      };
    }

    // 2. 만료된 좌석 상태 복구
    const expiredSeatIds = expiredSeats.map(seat => seat.id);

    const { error: updateError, count } = await supabase
      .from(SEATS_TABLE)
      .update({
        status: 'available',
        hold_expires_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('status', 'temporarily_held')
      .lt('hold_expires_at', new Date().toISOString())
      .is('deleted_at', null);

    if (updateError) {
      throw new Error(`Failed to update expired holds: ${updateError.message}`);
    }

    // 3. 결과 반환
    return {
      success: true,
      message: `Successfully cleaned up ${count || 0} expired seat holds`,
      clearedCount: count || 0,
      expiredSeats: expiredSeats.map(seat => ({
        id: seat.id,
        label: seat.label,
        concertId: seat.concert_id,
      })),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      message: `Cleanup job failed: ${message}`,
      clearedCount: 0,
    };
  }
}
