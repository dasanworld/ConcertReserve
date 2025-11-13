import type { SupabaseClient } from '@supabase/supabase-js';
import {
  failure,
  success,
  type HandlerResult,
} from '@/backend/http/response';
import {
  SeatsResponseSchema,
  SeatRowSchema,
  SeatTierRowSchema,
  SeatHoldResponseSchema,
  type SeatsResponse,
  type SeatHoldResponse,
  type SeatRow,
  type SeatTierRow,
} from '@/features/seat-selection/backend/schema';
import {
  seatSelectionErrorCodes,
  type SeatSelectionServiceError,
} from '@/features/seat-selection/backend/error';

const CONCERTS_TABLE = 'concerts';
const SEAT_TIERS_TABLE = 'concert_seat_tiers';
const SEATS_TABLE = 'seats';

// 5분 선점 시간 (밀리초)
const HOLD_DURATION_MS = 5 * 60 * 1000;

const deriveRowNumber = (label: string): number | null => {
  const match = label.match(/-([A-Z])\d+$/);
  if (!match) {
    return null;
  }
  const charCode = match[1].charCodeAt(0) - 64;
  return charCode > 0 ? charCode : null;
};

const deriveSeatNumber = (label: string): number | null => {
  const match = label.match(/(\d+)$/);
  return match ? Number(match[1]) : null;
};

const deriveSectionLabel = (label: string): string | null => {
  const match = label.match(/^([A-Z]+[0-9]+)/);
  return match ? match[1] : null;
};

const toRowLabel = (rowNumber: number | null): string => {
  if (!rowNumber || rowNumber <= 0) {
    return 'ROW';
  }
  return String.fromCharCode(64 + rowNumber);
};

export const getSeatsByConcertId = async (
  client: SupabaseClient,
  concertId: string,
): Promise<
  HandlerResult<SeatsResponse, SeatSelectionServiceError, unknown>
> => {
  // 1. 콘서트 존재 여부 확인
  const { data: concertData, error: concertError } = await client
    .from(CONCERTS_TABLE)
    .select('id, title, status, deleted_at')
    .eq('id', concertId)
    .eq('status', 'published')
    .is('deleted_at', null)
    .single();

  if (concertError) {
    if (concertError.code === 'PGRST116') {
      return failure(404, seatSelectionErrorCodes.concertNotFound, '콘서트를 찾을 수 없습니다.');
    }
    return failure(500, seatSelectionErrorCodes.fetchFailed, concertError.message);
  }

  if (!concertData) {
    return failure(404, seatSelectionErrorCodes.concertNotFound, '콘서트를 찾을 수 없습니다.');
  }

  // 2. 좌석 등급 정보 조회
  const { data: tierData, error: tierError } = await client
    .from(SEAT_TIERS_TABLE)
    .select('*')
    .eq('concert_id', concertId)
    .is('deleted_at', null)
    .order('price', { ascending: true });

  if (tierError) {
    return failure(500, seatSelectionErrorCodes.fetchFailed, tierError.message);
  }

  const validatedTiers: SeatTierRow[] = [];
  for (const row of tierData || []) {
    const tierParse = SeatTierRowSchema.safeParse(row);
    if (!tierParse.success) {
      return failure(
        500,
        seatSelectionErrorCodes.validationError,
        'Seat tier row failed validation.',
        tierParse.error.format(),
      );
    }
    validatedTiers.push(tierParse.data);
  }

  // 3. 모든 좌석 정보 조회
  const { data: seatData, error: seatError } = await client
    .from(SEATS_TABLE)
    .select('*')
    .eq('concert_id', concertId)
    .is('deleted_at', null)
    .order('label', { ascending: true });

  if (seatError) {
    return failure(500, seatSelectionErrorCodes.fetchFailed, seatError.message);
  }

  const validatedSeats: SeatRow[] = [];
  for (const row of seatData || []) {
    const seatParse = SeatRowSchema.safeParse(row);
    if (!seatParse.success) {
      return failure(
        500,
        seatSelectionErrorCodes.validationError,
        'Seat row failed validation.',
        seatParse.error.format(),
      );
    }
    validatedSeats.push(seatParse.data);
  }

  // 4. 등급별 통계 계산
  const tierMap = new Map(validatedTiers.map((t) => [t.id, t]));
  const tiers = validatedTiers.map((tier) => {
    const tierSeats = validatedSeats.filter((s) => s.seat_tier_id === tier.id);
    const totalCount = tierSeats.length;
    const availableCount = tierSeats.filter((s) => s.status === 'available').length;
    const heldCount = tierSeats.filter((s) => s.status === 'temporarily_held').length;
    const reservedCount = tierSeats.filter((s) => s.status === 'reserved').length;

    return {
      id: tier.id,
      label: tier.label,
      price: Number(tier.price),
      availableCount,
      heldCount,
      reservedCount,
      totalCount,
    };
  });

  // 5. 좌석 정보 매핑
  const seats = validatedSeats.map((seat) => {
    const tier = tierMap.get(seat.seat_tier_id);
    const sectionLabel = seat.section_label ?? deriveSectionLabel(seat.label) ?? tier?.label ?? 'GENERAL';
    const computedRowNumber = seat.row_number ?? deriveRowNumber(seat.label) ?? 1;
    const computedSeatNumber = seat.seat_number ?? deriveSeatNumber(seat.label) ?? 1;
    const rowLabel = seat.row_label ?? toRowLabel(computedRowNumber);

    return {
      id: seat.id,
      seatTierId: seat.seat_tier_id,
      seatTierLabel: tier?.label || '',
      label: seat.label,
      sectionLabel,
      rowLabel,
      rowNumber: computedRowNumber,
      seatNumber: computedSeatNumber,
      status: seat.status,
      price: tier ? Number(tier.price) : 0,
      holdExpiresAt: seat.hold_expires_at,
    };
  });

  // 6. 응답 데이터 구성
  const response = {
    concertId: concertData.id,
    concertTitle: concertData.title,
    tiers,
    seats,
  };

  // 7. 스키마 검증
  const parsed = SeatsResponseSchema.safeParse(response);
  if (!parsed.success) {
    return failure(
      500,
      seatSelectionErrorCodes.validationError,
      'Seats response payload failed validation.',
      parsed.error.format(),
    );
  }

  return success(parsed.data);
};

export const holdSeats = async (
  client: SupabaseClient,
  concertId: string,
  seatIds: string[],
): Promise<
  HandlerResult<SeatHoldResponse, SeatSelectionServiceError, unknown>
> => {
  // 1. 좌석 수 제한 검증 (최대 10석)
  if (seatIds.length === 0) {
    return failure(400, seatSelectionErrorCodes.invalidSeatIds, '선택된 좌석이 없습니다.');
  }

  if (seatIds.length > 10) {
    return failure(400, seatSelectionErrorCodes.exceededMaxSeats, '최대 10석까지 선택할 수 있습니다.');
  }

  // 2. 낙관적 잠금 방식으로 좌석 선점 처리
  // 2-1. 현재 좌석 상태 확인
  const { data: currentSeats, error: fetchError } = await client
    .from(SEATS_TABLE)
    .select('id, status, hold_expires_at, label, seat_tier_id')
    .eq('concert_id', concertId)
    .in('id', seatIds)
    .is('deleted_at', null);

  if (fetchError) {
    return failure(500, seatSelectionErrorCodes.fetchFailed, fetchError.message);
  }

  if (!currentSeats || currentSeats.length !== seatIds.length) {
    return failure(400, seatSelectionErrorCodes.invalidSeatIds, '유효하지 않은 좌석이 포함되어 있습니다.');
  }

  // 2-2. 모든 좌석이 available 상태인지 확인
  const now = new Date();
  const unavailableSeats: string[] = [];

  for (const seat of currentSeats) {
    // 이미 예약된 좌석
    if (seat.status === 'reserved') {
      unavailableSeats.push(seat.id);
      continue;
    }

    // 다른 사용자가 선점한 좌석 (만료되지 않은 경우)
    if (seat.status === 'temporarily_held' && seat.hold_expires_at) {
      const expiresAt = new Date(seat.hold_expires_at);
      if (expiresAt > now) {
        unavailableSeats.push(seat.id);
        continue;
      }
    }
  }

  if (unavailableSeats.length > 0) {
    return failure(
      409,
      seatSelectionErrorCodes.seatsNotAvailable,
      '선택한 좌석 중 일부를 선점할 수 없습니다.',
      { unavailableSeats }
    );
  }

  // 2-3. 선점 처리 (5분 유효)
  const holdExpiresAt = new Date(Date.now() + HOLD_DURATION_MS).toISOString();

  // 업데이트 시도 - 각 좌석을 개별 업데이트하여 안정성 확보
  let successCount = 0;
  for (const seatId of seatIds) {
    const { error: seatUpdateError } = await client
      .from(SEATS_TABLE)
      .update({
        status: 'temporarily_held',
        hold_expires_at: holdExpiresAt,
      })
      .eq('id', seatId)
      .eq('concert_id', concertId)
      .eq('status', 'available');

    if (!seatUpdateError) {
      successCount += 1;
    }
  }

  // 일부 좌석만 업데이트되었다면 실패
  if (successCount !== seatIds.length) {
    return failure(
      409,
      seatSelectionErrorCodes.seatsNotAvailable,
      '선택한 좌석 중 일부를 선점할 수 없습니다.',
    );
  }

  // 3. 응답 데이터 구성 - 선점된 좌석 상세 정보 조회
  const seatTierIds = Array.from(
    new Set((currentSeats ?? []).map((seat) => seat.seat_tier_id)),
  );

  const { data: tierRows, error: tierFetchError } = await client
    .from(SEAT_TIERS_TABLE)
    .select('id, label, price')
    .in('id', seatTierIds.length > 0 ? seatTierIds : ['00000000-0000-0000-0000-000000000000']);

  if (tierFetchError) {
    return failure(500, seatSelectionErrorCodes.fetchFailed, tierFetchError.message);
  }

  const tierMap = new Map(
    (tierRows ?? []).map((tier) => [tier.id, { label: tier.label, price: Number(tier.price) }]),
  );

  // currentSeats는 이미 검증된 좌석들이므로, 이를 기반으로 응답 구성
  const heldSeats = (currentSeats ?? []).map((seat) => {
    const tier = tierMap.get(seat.seat_tier_id);
    return {
      seatId: seat.id,
      label: seat.label,
      seatTierLabel: tier?.label ?? '미지정',
      price: tier?.price ?? 0,
    };
  });

  const totalAmount = heldSeats.reduce((sum, seat) => sum + seat.price, 0);

  const response = {
    holdExpiresAt,
    heldSeats,
    totalAmount,
  };

  // 4. 스키마 검증
  const parsed = SeatHoldResponseSchema.safeParse(response);
  if (!parsed.success) {
    return failure(
      500,
      seatSelectionErrorCodes.validationError,
      'Seat hold response payload failed validation.',
      parsed.error.format(),
    );
  }

  return success(parsed.data);
};
