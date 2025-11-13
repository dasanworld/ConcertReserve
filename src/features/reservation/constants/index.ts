// 예약 관련 상수 정의

// 선점 유효 시간 (분)
export const HOLD_DURATION_MINUTES = 5;

// 비밀번호 길이 제한
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 20;

// 휴대폰 번호 형식 (010-XXXX-XXXX)
export const PHONE_NUMBER_REGEX = /^010-\d{4}-\d{4}$/;

// 예약 가능한 최소/최대 좌석 수
export const MIN_SEAT_COUNT = 1;
export const MAX_SEAT_COUNT = 4;

// 예약자 이름 길이 제한
export const CUSTOMER_NAME_MIN_LENGTH = 2;
export const CUSTOMER_NAME_MAX_LENGTH = 50;
