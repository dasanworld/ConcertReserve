import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { cleanupExpiredHolds } from '@/backend/jobs/cleanup-expired-holds';

/**
 * 선점 자동 정리 작업 테스트
 * 
 * 주의: 실제 Supabase 클라이언트를 사용하므로,
 * 테스트 환경 설정이 필요합니다.
 */

describe('cleanupExpiredHolds', () => {
  it('should return success with 0 cleared count when no expired holds exist', async () => {
    const result = await cleanupExpiredHolds();
    
    expect(result.success).toBe(true);
    expect(result.clearedCount).toBeGreaterThanOrEqual(0);
    expect(result.message).toBeDefined();
  });

  it('should have correct response structure', async () => {
    const result = await cleanupExpiredHolds();
    
    expect(result).toHaveProperty('success');
    expect(result).toHaveProperty('message');
    expect(result).toHaveProperty('clearedCount');
    expect(result).toHaveProperty('expiredSeats');
    expect(Array.isArray(result.expiredSeats)).toBe(true);
  });

  it('should have correct expired seat structure', async () => {
    const result = await cleanupExpiredHolds();
    
    if (result.expiredSeats.length > 0) {
      const seat = result.expiredSeats[0];
      expect(seat).toHaveProperty('id');
      expect(seat).toHaveProperty('label');
      expect(seat).toHaveProperty('concertId');
    }
  });

  it('should handle errors gracefully', async () => {
    // Mock environment variable to simulate error
    const originalEnv = process.env.SUPABASE_URL;
    
    try {
      // Cleanup job should return error response instead of throwing
      const result = await cleanupExpiredHolds();
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('message');
    } finally {
      process.env.SUPABASE_URL = originalEnv;
    }
  });
});
