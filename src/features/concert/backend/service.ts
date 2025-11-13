import type { SupabaseClient } from '@supabase/supabase-js';
import {
  failure,
  success,
  type HandlerResult,
} from '@/backend/http/response';
import {
  ConcertListResponseSchema,
  ConcertTableRowSchema,
  ConcertDetailResponseSchema,
  type ConcertListResponse,
  type ConcertRow,
  type ConcertDetailResponse,
} from '@/features/concert/backend/schema';
import {
  concertErrorCodes,
  type ConcertServiceError,
} from '@/features/concert/backend/error';

const CONCERT_TABLE = 'concerts';

const fallbackThumbnail = (id: string) =>
  `https://picsum.photos/seed/${encodeURIComponent(id)}/400/300`;

export const getConcertList = async (
  client: SupabaseClient,
): Promise<
  HandlerResult<ConcertListResponse, ConcertServiceError, unknown>
> => {
  const { data, error } = await client
    .from(CONCERT_TABLE)
    .select('id, title, thumbnail_url, concert_date, venue, status, deleted_at, created_at, updated_at')
    .eq('status', 'published')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) {
    return failure(500, concertErrorCodes.fetchFailed, error.message);
  }

  if (!data) {
    return success([]);
  }

  const validatedRows: ConcertRow[] = [];

  for (const row of data) {
    const rowParse = ConcertTableRowSchema.safeParse(row);

    if (!rowParse.success) {
      return failure(
        500,
        concertErrorCodes.validationError,
        'Concert row failed validation.',
        rowParse.error.format(),
      );
    }

    validatedRows.push(rowParse.data);
  }

  const mapped = validatedRows.map((row) => ({
    id: row.id,
    title: row.title,
    thumbnailUrl: row.thumbnail_url ?? fallbackThumbnail(row.id),
    concertDate: row.concert_date,
    venue: row.venue,
  }));

  const parsed = ConcertListResponseSchema.safeParse(mapped);

  if (!parsed.success) {
    return failure(
      500,
      concertErrorCodes.validationError,
      'Concert list payload failed validation.',
      parsed.error.format(),
    );
  }

  return success(parsed.data);
};

export const getConcertDetail = async (
  client: SupabaseClient,
  concertId: string,
): Promise<
  HandlerResult<ConcertDetailResponse, ConcertServiceError, unknown>
> => {
  // 1. 콘서트 기본 정보 조회 (published 상태만)
  const { data: concertData, error: concertError } = await client
    .from(CONCERT_TABLE)
    .select('id, title, thumbnail_url, concert_date, venue, status, deleted_at')
    .eq('id', concertId)
    .eq('status', 'published')
    .is('deleted_at', null)
    .single();

  if (concertError) {
    if (concertError.code === 'PGRST116') {
      return failure(404, concertErrorCodes.notFound, '콘서트를 찾을 수 없습니다.');
    }
    return failure(500, concertErrorCodes.fetchFailed, concertError.message);
  }

  if (!concertData) {
    return failure(404, concertErrorCodes.notFound, '콘서트를 찾을 수 없습니다.');
  }

  // 2. 좌석 등급 정보 조회
  const { data: tierData, error: tierError } = await client
    .from('concert_seat_tiers')
    .select('id, label, price')
    .eq('concert_id', concertId)
    .is('deleted_at', null);

  if (tierError) {
    return failure(500, concertErrorCodes.fetchFailed, tierError.message);
  }

  const tiers = tierData || [];

  // 3. 모든 좌석 정보 조회 (상태별)
  const { data: seatsData, error: seatsError } = await client
    .from('seats')
    .select('seat_tier_id, status')
    .eq('concert_id', concertId)
    .is('deleted_at', null);

  if (seatsError) {
    return failure(500, concertErrorCodes.fetchFailed, seatsError.message);
  }

  const seats = seatsData || [];

  // 4. 등급별 좌석 수 계산
  const tierStats = tiers.map((tier) => {
    const tierSeats = seats.filter((seat) => seat.seat_tier_id === tier.id);
    const totalSeats = tierSeats.length;
    const availableSeats = tierSeats.filter((s) => s.status === 'available').length;
    const temporarilyHeldSeats = tierSeats.filter((s) => s.status === 'temporarily_held').length;
    const reservedSeats = tierSeats.filter((s) => s.status === 'reserved').length;

    return {
      id: tier.id,
      label: tier.label,
      price: Number(tier.price),
      totalSeats,
      availableSeats,
      temporarilyHeldSeats,
      reservedSeats,
    };
  });

  // 5. 전체 좌석 통계 계산
  const totalSeats = seats.length;
  const availableSeats = seats.filter((s) => s.status === 'available').length;
  const temporarilyHeldSeats = seats.filter((s) => s.status === 'temporarily_held').length;
  const reservedSeats = seats.filter((s) => s.status === 'reserved').length;

  // 6. 응답 데이터 구성
  const response = {
    id: concertData.id,
    title: concertData.title,
    thumbnailUrl: concertData.thumbnail_url ?? fallbackThumbnail(concertData.id),
    concertDate: concertData.concert_date,
    venue: concertData.venue,
    seatTiers: tierStats,
    totalSeats,
    availableSeats,
    temporarilyHeldSeats,
    reservedSeats,
  };

  // 7. 스키마 검증
  const parsed = ConcertDetailResponseSchema.safeParse(response);

  if (!parsed.success) {
    return failure(
      500,
      concertErrorCodes.validationError,
      'Concert detail payload failed validation.',
      parsed.error.format(),
    );
  }

  return success(parsed.data);
};
