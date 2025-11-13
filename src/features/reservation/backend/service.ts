import type { SupabaseClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import {
  failure,
  success,
  type HandlerResult,
} from '@/backend/http/response';
import {
  ReservationDetailResponseSchema,
  CreateReservationResponseSchema,
  ReservationLookupResponseSchema,
  type ReservationDetailResponse,
  type CreateReservationRequest,
  type CreateReservationResponse,
  type ReservationLookupRequest,
  type ReservationLookupResponse,
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
      return failure(404, reservationErrorCodes.RESERVATION_NOT_FOUND, '예약 정보를 찾을 수 없습니다.');
    }
    return failure(500, reservationErrorCodes.RESERVATION_DB_ERROR, reservationError.message);
  }

  if (!reservationData) {
    return failure(404, reservationErrorCodes.RESERVATION_NOT_FOUND, '예약 정보를 찾을 수 없습니다.');
  }

  // 2. 콘서트 정보 조회
  const { data: concertData, error: concertError } = await client
    .from(CONCERTS_TABLE)
    .select('id, title, concert_date, venue')
    .eq('id', reservationData.concert_id)
    .single();

  if (concertError) {
    return failure(500, reservationErrorCodes.RESERVATION_DB_ERROR, concertError.message);
  }

  if (!concertData) {
    return failure(500, reservationErrorCodes.RESERVATION_DB_ERROR, '콘서트 정보를 찾을 수 없습니다.');
  }

  // 3. 예약된 좌석 매핑 조회
  const { data: reservationSeats, error: reservationSeatsError } = await client
    .from(RESERVATION_SEATS_TABLE)
    .select('seat_id')
    .eq('reservation_id', reservationId);

  if (reservationSeatsError) {
    return failure(500, reservationErrorCodes.RESERVATION_DB_ERROR, reservationSeatsError.message);
  }

  if (!reservationSeats || reservationSeats.length === 0) {
    return failure(500, reservationErrorCodes.RESERVATION_DB_ERROR, '예약된 좌석 정보를 찾을 수 없습니다.');
  }

  const seatIds = reservationSeats.map((rs) => rs.seat_id);

  // 4. 좌석 상세 정보 조회 (좌석 + 등급 정보)
  const { data: seatsData, error: seatsError } = await client
    .from(SEATS_TABLE)
    .select('id, label, seat_tier_id')
    .in('id', seatIds);

  if (seatsError) {
    return failure(500, reservationErrorCodes.RESERVATION_DB_ERROR, seatsError.message);
  }

  if (!seatsData || seatsData.length === 0) {
    return failure(500, reservationErrorCodes.RESERVATION_DB_ERROR, '좌석 정보를 찾을 수 없습니다.');
  }

  // 5. 좌석 등급 정보 조회
  const tierIds = [...new Set(seatsData.map((seat) => seat.seat_tier_id))];
  const { data: tiersData, error: tiersError } = await client
    .from(CONCERT_SEAT_TIERS_TABLE)
    .select('id, label, price')
    .in('id', tierIds);

  if (tiersError) {
    return failure(500, reservationErrorCodes.RESERVATION_DB_ERROR, tiersError.message);
  }

  if (!tiersData || tiersData.length === 0) {
    return failure(500, reservationErrorCodes.RESERVATION_DB_ERROR, '좌석 등급 정보를 찾을 수 없습니다.');
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
      reservationErrorCodes.RESERVATION_DB_ERROR,
      '예약 상세 정보 검증에 실패했습니다.',
      parsed.error.format(),
    );
  }

  return success(parsed.data);
};

// 예약 생성 함수 (비밀번호 해싱 및 트랜잭션 처리)
export const createReservation = async (
  client: SupabaseClient,
  request: CreateReservationRequest,
): Promise<
  HandlerResult<CreateReservationResponse, ReservationServiceError, unknown>
> => {
  const { seatIds, customerName, phoneNumber, password } = request;

  // 1. 선점 유효성 재검증
  const { data: currentSeats, error: fetchError } = await client
    .from(SEATS_TABLE)
    .select('id, concert_id, seat_tier_id, status, hold_expires_at')
    .in('id', seatIds);

  if (fetchError) {
    return failure(500, reservationErrorCodes.RESERVATION_DB_ERROR, fetchError.message);
  }

  if (!currentSeats || currentSeats.length !== seatIds.length) {
    return failure(400, reservationErrorCodes.SEAT_NOT_HELD, '유효하지 않은 좌석이 포함되어 있습니다.');
  }

  const now = new Date();
  const expiredSeats: string[] = [];
  const notHeldSeats: string[] = [];
  let concertId: string | null = null;

  for (const seat of currentSeats) {
    // 콘서트 ID 추출 (모든 좌석이 같은 콘서트에 속함)
    if (!concertId) {
      concertId = seat.concert_id;
    }

    // 상태가 temporarily_held가 아닌 경우
    if (seat.status !== 'temporarily_held') {
      notHeldSeats.push(seat.id);
      continue;
    }

    // 선점 시간 만료 확인
    if (seat.hold_expires_at) {
      const expiresAt = new Date(seat.hold_expires_at);
      if (expiresAt <= now) {
        expiredSeats.push(seat.id);
      }
    }
  }

  if (notHeldSeats.length > 0) {
    return failure(
      409,
      reservationErrorCodes.SEAT_NOT_HELD,
      '선택하신 좌석이 유효하지 않습니다.',
      { notHeldSeats },
    );
  }

  if (expiredSeats.length > 0) {
    return failure(
      409,
      reservationErrorCodes.SEAT_HOLD_EXPIRED,
      '좌석 선점 시간이 만료되었습니다.',
      { expiredSeats },
    );
  }

  if (!concertId) {
    return failure(500, reservationErrorCodes.INVALID_CONCERT, '콘서트 정보를 찾을 수 없습니다.');
  }

  // 2. 콘서트 정보 조회
  const { data: concertData, error: concertError } = await client
    .from(CONCERTS_TABLE)
    .select('id, title')
    .eq('id', concertId)
    .single();

  if (concertError || !concertData) {
    return failure(500, reservationErrorCodes.INVALID_CONCERT, '콘서트 정보를 찾을 수 없습니다.');
  }

  // 3. 비밀번호 해싱 (bcrypt, salt rounds: 10)
  const passwordHash = await bcrypt.hash(password, 10);

  // 4. 트랜잭션 시작 (Supabase는 RPC 함수를 통해 트랜잭션 처리)
  // 여기서는 순차적으로 처리하고, 실패 시 에러 반환
  // 실제 프로덕션에서는 Postgres 함수로 트랜잭션 처리 권장

  // 4-1. 예약 레코드 INSERT
  const { data: reservationData, error: reservationError } = await client
    .from(RESERVATIONS_TABLE)
    .insert({
      concert_id: concertId,
      customer_name: customerName,
      phone_number: phoneNumber,
      password_hash: passwordHash,
      status: 'confirmed',
    })
    .select('id, created_at')
    .single();

  if (reservationError || !reservationData) {
    return failure(
      500,
      reservationErrorCodes.DB_TRANSACTION_FAILED,
      '예약 생성 중 오류가 발생했습니다.',
      reservationError,
    );
  }

  const reservationId = reservationData.id;
  const createdAt = reservationData.created_at;

  // 4-2. 예약-좌석 매핑 INSERT
  const reservationSeatsData = seatIds.map((seatId) => ({
    reservation_id: reservationId,
    seat_id: seatId,
  }));

  const { error: reservationSeatsError } = await client
    .from(RESERVATION_SEATS_TABLE)
    .insert(reservationSeatsData);

  if (reservationSeatsError) {
    // 롤백 시도 (예약 레코드 삭제)
    await client.from(RESERVATIONS_TABLE).delete().eq('id', reservationId);

    return failure(
      500,
      reservationErrorCodes.DB_TRANSACTION_FAILED,
      '예약-좌석 매핑 생성 중 오류가 발생했습니다.',
      reservationSeatsError,
    );
  }

  // 4-3. 좌석 상태 업데이트 (temporarily_held -> reserved, hold_expires_at = NULL)
  const { error: seatUpdateError } = await client
    .from(SEATS_TABLE)
    .update({
      status: 'reserved',
      hold_expires_at: null,
    })
    .in('id', seatIds);

  if (seatUpdateError) {
    // 롤백 시도 (예약-좌석 매핑 및 예약 레코드 삭제)
    await client.from(RESERVATION_SEATS_TABLE).delete().eq('reservation_id', reservationId);
    await client.from(RESERVATIONS_TABLE).delete().eq('id', reservationId);

    return failure(
      500,
      reservationErrorCodes.DB_TRANSACTION_FAILED,
      '좌석 상태 업데이트 중 오류가 발생했습니다.',
      seatUpdateError,
    );
  }

  // 5. 좌석 상세 정보 조회 (좌석 등급 포함)
  const { data: seatsData, error: seatsError } = await client
    .from(SEATS_TABLE)
    .select('id, label, seat_tier_id')
    .in('id', seatIds);

  if (seatsError || !seatsData || seatsData.length === 0) {
    return failure(
      500,
      reservationErrorCodes.RESERVATION_DB_ERROR,
      '좌석 정보를 조회할 수 없습니다.',
    );
  }

  // 6. 좌석 등급 정보 조회
  const tierIds = [...new Set(seatsData.map((seat) => seat.seat_tier_id))];
  const { data: tiersData, error: tiersError } = await client
    .from(CONCERT_SEAT_TIERS_TABLE)
    .select('id, label, price')
    .in('id', tierIds);

  if (tiersError || !tiersData || tiersData.length === 0) {
    return failure(
      500,
      reservationErrorCodes.RESERVATION_DB_ERROR,
      '좌석 등급 정보를 조회할 수 없습니다.',
    );
  }

  // 7. 좌석 등급 정보를 Map으로 변환
  const tierMap = new Map(
    tiersData.map((tier) => [tier.id, { label: tier.label, price: Number(tier.price) }])
  );

  // 8. 좌석 상세 정보 구성
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

  // 9. 총액 계산
  const totalAmount = seats.reduce((sum, seat) => sum + seat.price, 0);

  // 10. 예약 번호 생성
  const reservationNumber = generateReservationNumber(createdAt, reservationId);

  // 11. 응답 데이터 구성
  const response = {
    reservationId,
    reservationNumber,
    customerName,
    phoneNumber,
    concertId: concertData.id,
    concertTitle: concertData.title,
    seats,
    totalAmount,
    seatCount: seats.length,
    createdAt,
  };

  // 12. 스키마 검증
  const parsed = CreateReservationResponseSchema.safeParse(response);

  if (!parsed.success) {
    return failure(
      500,
      reservationErrorCodes.RESERVATION_DB_ERROR,
      '예약 응답 데이터 검증에 실패했습니다.',
      parsed.error.format(),
    );
  }

  return success(parsed.data);
};

// 예약 조회 함수 (휴대폰 번호 + 비밀번호로 예약 검색)
export const lookupReservation = async (
  client: SupabaseClient,
  request: ReservationLookupRequest,
): Promise<
  HandlerResult<ReservationLookupResponse, ReservationServiceError, unknown>
> => {
  const { phoneNumber, password } = request;

  // 1. 휴대폰 번호로 예약 검색 (confirmed 상태만)
  const { data: reservationData, error: searchError } = await client
    .from(RESERVATIONS_TABLE)
    .select('id, password_hash')
    .eq('phone_number', phoneNumber)
    .eq('status', 'confirmed')
    .single();

  // 예약이 없거나 에러 발생
  if (searchError) {
    if (searchError.code === 'PGRST116') {
      // 예약이 없는 경우 - 보안상 일반 메시지 반환
      return failure(
        401,
        reservationErrorCodes.INVALID_PASSWORD,
        '휴대폰 번호 또는 비밀번호가 일치하지 않습니다.',
      );
    }
    return failure(500, reservationErrorCodes.RESERVATION_DB_ERROR, searchError.message);
  }

  if (!reservationData) {
    // 예약이 없는 경우 - 보안상 일반 메시지 반환
    return failure(
      401,
      reservationErrorCodes.INVALID_PASSWORD,
      '휴대폰 번호 또는 비밀번호가 일치하지 않습니다.',
    );
  }

  // 2. 비밀번호 검증
  const isPasswordValid = await bcrypt.compare(password, reservationData.password_hash);

  if (!isPasswordValid) {
    // 보안상 예약 없음과 동일 메시지 반환
    return failure(
      401,
      reservationErrorCodes.INVALID_PASSWORD,
      '휴대폰 번호 또는 비밀번호가 일치하지 않습니다.',
    );
  }

  // 3. 성공 응답 (리다이렉트 URL 포함)
  const response = {
    reservationId: reservationData.id,
    redirectUrl: `/reservations/${reservationData.id}`,
  };

  // 4. 스키마 검증
  const parsed = ReservationLookupResponseSchema.safeParse(response);

  if (!parsed.success) {
    return failure(
      500,
      reservationErrorCodes.RESERVATION_DB_ERROR,
      '예약 조회 응답 검증에 실패했습니다.',
      parsed.error.format(),
    );
  }

  return success(parsed.data);
};
