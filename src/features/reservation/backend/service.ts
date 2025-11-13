import type { SupabaseClient } from '@supabase/supabase-js';
import {
  failure,
  success,
  type HandlerResult,
} from '@/backend/http/response';
import {
  ReservationDetailResponseSchema,
  type ReservationDetailResponse,
} from '@/features/reservation/backend/schema';
import {
  reservationErrorCodes,
  type ReservationServiceError,
} from '@/features/reservation/backend/error';
import { format } from 'date-fns';

const RESERVATIONS_TABLE = 'reservations';
const RESERVATION_SEATS_TABLE = 'reservation_seats';
const SEATS_TABLE = 'seats';
const CONCERTS_TABLE = 'concerts';
const CONCERT_SEAT_TIERS_TABLE = 'concert_seat_tiers';

// 예약 번호 생성 함수 (RES{YYYYMMDD}{일련번호})
const generateReservationNumber = (createdAt: string, id: string): string => {
  const date = new Date(createdAt);
  const dateStr = format(date, 'yyyyMMdd');
  // ID의 앞 3자리를 일련번호로 사용
  const serial = id.replace(/-/g, '').substring(0, 3).toUpperCase();
  return `RES${dateStr}${serial}`;
};

export const getReservationDetail = async (
  client: SupabaseClient,
  reservationId: string,
): Promise<
  HandlerResult<ReservationDetailResponse, ReservationServiceError, unknown>
> => {
  // 1. 예약 기본 정보 조회
  const { data: reservationData, error: reservationError } = await client
    .from(RESERVATIONS_TABLE)
    .select('id, concert_id, customer_name, phone_number, status, created_at')
    .eq('id', reservationId)
    .single();

  if (reservationError) {
    if (reservationError.code === 'PGRST116') {
      return failure(404, reservationErrorCodes.notFound, '예약 정보를 찾을 수 없습니다.');
    }
    return failure(500, reservationErrorCodes.dbError, reservationError.message);
  }

  if (!reservationData) {
    return failure(404, reservationErrorCodes.notFound, '예약 정보를 찾을 수 없습니다.');
  }

  // 2. 콘서트 정보 조회
  const { data: concertData, error: concertError } = await client
    .from(CONCERTS_TABLE)
    .select('id, title, concert_date, venue')
    .eq('id', reservationData.concert_id)
    .single();

  if (concertError) {
    return failure(500, reservationErrorCodes.dbError, concertError.message);
  }

  if (!concertData) {
    return failure(500, reservationErrorCodes.dbError, '콘서트 정보를 찾을 수 없습니다.');
  }

  // 3. 예약된 좌석 매핑 조회
  const { data: reservationSeats, error: reservationSeatsError } = await client
    .from(RESERVATION_SEATS_TABLE)
    .select('seat_id')
    .eq('reservation_id', reservationId);

  if (reservationSeatsError) {
    return failure(500, reservationErrorCodes.dbError, reservationSeatsError.message);
  }

  if (!reservationSeats || reservationSeats.length === 0) {
    return failure(500, reservationErrorCodes.dbError, '예약된 좌석 정보를 찾을 수 없습니다.');
  }

  const seatIds = reservationSeats.map((rs) => rs.seat_id);

  // 4. 좌석 상세 정보 조회 (좌석 + 등급 정보)
  const { data: seatsData, error: seatsError } = await client
    .from(SEATS_TABLE)
    .select('id, label, seat_tier_id')
    .in('id', seatIds);

  if (seatsError) {
    return failure(500, reservationErrorCodes.dbError, seatsError.message);
  }

  if (!seatsData || seatsData.length === 0) {
    return failure(500, reservationErrorCodes.dbError, '좌석 정보를 찾을 수 없습니다.');
  }

  // 5. 좌석 등급 정보 조회
  const tierIds = [...new Set(seatsData.map((seat) => seat.seat_tier_id))];
  const { data: tiersData, error: tiersError } = await client
    .from(CONCERT_SEAT_TIERS_TABLE)
    .select('id, label, price')
    .in('id', tierIds);

  if (tiersError) {
    return failure(500, reservationErrorCodes.dbError, tiersError.message);
  }

  if (!tiersData || tiersData.length === 0) {
    return failure(500, reservationErrorCodes.dbError, '좌석 등급 정보를 찾을 수 없습니다.');
  }

  // 6. 좌석 등급 정보를 Map으로 변환
  const tierMap = new Map(
    tiersData.map((tier) => [tier.id, { label: tier.label, price: Number(tier.price) }])
  );

  // 7. 좌석 상세 정보 구성
  const seats = seatsData.map((seat) => {
    const tier = tierMap.get(seat.seat_tier_id);
    if (!tier) {
      throw new Error(`좌석 등급 정보를 찾을 수 없습니다: ${seat.seat_tier_id}`);
    }
    return {
      seatId: seat.id,
      label: seat.label,
      tierLabel: tier.label,
      price: tier.price,
    };
  });

  // 8. 총액 계산
  const totalAmount = seats.reduce((sum, seat) => sum + seat.price, 0);

  // 9. 예약 번호 생성
  const reservationNumber = generateReservationNumber(
    reservationData.created_at,
    reservationData.id
  );

  // 10. 응답 데이터 구성
  const response = {
    reservationId: reservationData.id,
    reservationNumber,
    customerName: reservationData.customer_name,
    phoneNumber: reservationData.phone_number,
    status: reservationData.status as 'confirmed' | 'cancelled',
    concertId: concertData.id,
    concertTitle: concertData.title,
    concertDate: concertData.concert_date,
    concertVenue: concertData.venue,
    seats,
    totalAmount,
    seatCount: seats.length,
    createdAt: reservationData.created_at,
  };

  // 11. 스키마 검증
  const parsed = ReservationDetailResponseSchema.safeParse(response);

  if (!parsed.success) {
    return failure(
      500,
      reservationErrorCodes.dbError,
      '예약 상세 정보 검증에 실패했습니다.',
      parsed.error.format(),
    );
  }

  return success(parsed.data);
};
