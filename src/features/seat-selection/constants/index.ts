// 좌석 상태 상수
export const SEAT_STATUS = {
  AVAILABLE: 'available',
  TEMPORARILY_HELD: 'temporarily_held',
  RESERVED: 'reserved',
} as const;

// 클라이언트 측 좌석 상태 (UI 전용)
export const CLIENT_SEAT_STATUS = {
  ...SEAT_STATUS,
  SELECTED: 'selected', // 현재 사용자가 선택한 상태
} as const;

// 좌석 상태별 색상 (Tailwind CSS 클래스)
export const SEAT_STATUS_COLORS = {
  available: 'bg-gray-200 hover:bg-gray-300 cursor-pointer',
  temporarily_held: 'bg-orange-400 cursor-not-allowed',
  reserved: 'bg-red-500 cursor-not-allowed',
  selected: 'bg-blue-500 hover:bg-blue-600 cursor-pointer',
} as const;

// 좌석 상태별 텍스트 색상
export const SEAT_STATUS_TEXT_COLORS = {
  available: 'text-gray-700',
  temporarily_held: 'text-white',
  reserved: 'text-white',
  selected: 'text-white',
} as const;

// 좌석 선택 제한
export const SEAT_SELECTION_LIMITS = {
  MIN: 1,
  MAX: 4,
} as const;

// 선점 시간 (밀리초)
export const HOLD_DURATION_MS = 5 * 60 * 1000; // 5분

// 좌석 상태 레이블
export const SEAT_STATUS_LABELS = {
  available: '예약 가능',
  temporarily_held: '임시 선점',
  reserved: '예약 완료',
  selected: '선택됨',
} as const;
