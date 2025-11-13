# 상태 정의 (ConcertReserve UI & 도메인 상태 모델)

> 문서 출처: `/docs/prd.md`, `/docs/userflow.md`, `/docs/database.md`, `/docs/001/spec.md`~`/docs/005/spec.md` 종합 분석 결과
> 목적: 클라이언트/서버/파생 상태를 명확히 구분하여 구현 범위와 캐싱, React Query / Zustand 설계를 체계화

---
## 1. 관리해야 할 상태 데이터 목록 (분류별)

### 1.1 서버 상태 (Server State: 원본/쿼리 결과)
- `publishedConcertList`: 공개(`published`) 콘서트 목록
- `concertDetail`: 단일 콘서트 상세 (총좌석, 예약좌석, 등급별 좌석 집계 포함)
- `seatTiers`: 좌석 등급 리스트 (가격/총좌석/예약좌석)
- `seatMap`: 개별 좌석 배열 (id, label, status, holdExpiresAt)
- `heldSeatsSnapshot`: 선점 성공 직후 좌석 요약 (id, label, price, tierLabel)
- `reservationCreationResult`: 예약 생성 성공 응답 (reservationId, number 등)
- `lookupReservationAuthResult`: 조회 인증 결과(성공 시 리다이렉트용)
- `lookupReservationDetail`: 예약 상세 (좌석/콘서트/금액/상태)
- `cancellationResult`: 예약 취소 성공 결과 (releasedSeats, cancelledAt)

### 1.2 클라이언트 UI 로컬 상태 (Local/UI State)
- `selectedSeatIds`: 사용자가 현재 선택한 좌석 ID 집합 (Set<string>)
- `selectionError`: 좌석 선택 실패 메시지(경쟁/제한 등)
- `holdCountdownSeconds`: 선점 만료까지 남은 시간(초, interval 기반 갱신)
- `formCustomerName`, `formPhoneNumber`, `formPassword`: 예약 정보 입력 값
- `formErrors`: 예약 폼 필드별 검증 오류 객체
- `isSubmittingReservation`, `isLoadingConcerts`, `isLoadingSeats`, `isHoldingSeats`, `isCancellingReservation`: 주요 비동기 진행 플래그
- `showCancellationConfirmModal`: 취소 확인 모달 열림 여부
- `toastQueue`: 토스트 메시지 큐 (id, message, type)[]

### 1.3 파생 상태 (Derived/Computed – 저장 불필요, 필요 시 memo)
- `selectedSeatObjects`: 선택된 좌석 상세 = `seatMap.filter(s => selectedSeatIds.has(s.id))`
- `totalSelectedSeats` = `selectedSeatIds.size`
- `totalSelectedAmount` = Σ(selectedSeatObjects 가격)
- `maxSeatSelectionReached` = `totalSelectedSeats >= 4`
- `remainingSeats` = `concertDetail.totalSeats - concertDetail.reservedSeats`
- `tierRemainingSeats[]` = 각 티어 (`totalSeats - reservedSeats`)
- `canSubmitHold` = `totalSelectedSeats >= 1 && totalSelectedSeats <= 4 && !isHoldingSeats`
- `canSubmitReservation` = `모든 폼 유효 && !isSubmittingReservation && !holdExpired`
- `reservationExpired` = 예약 시점에 선점 만료 여부
- `holdExpired` = `now >= holdExpiresAt`
- `isSoldOut` = `remainingSeats == 0`
- `isArchiveHidden` = `concertDetail.status === 'archived'`
- `holdCountdownActive` = `holdExpiresAt && now < holdExpiresAt`
- `holdRemainingRatio` = `(holdExpiresAt - now) / 300` (5분 = 300초 기준)
- `reservationAlreadyCancelled` = `lookupReservationDetail.status === 'cancelled'`
- `canCancelReservation` = `status === 'confirmed' && 비즈니스 규칙 충족`
- `reservationCancelable` = (향후: 공연 시작 24시간 이전 조건)
- `autoRedirectTriggered` = 리다이렉트 1회 실행 완료 플래그

### 1.4 세션/흐름 상태 (Ephemeral Flow Context)
- `currentConcertId`: 현재 뷰 콘서트 식별자
- `heldSeatIds`: 선점 성공 좌석 ID 리스트 (예약 페이지 전달)
- `holdExpiresAt`: 선점 만료 시각 (ISO)
- `reservationIdAfterCreate`: 예약 성공 후 식별자
- `pendingRedirectUrl`: 성공/만료 후 이동 예정 경로
- `lookupPhoneInput`, `lookupPasswordInput`: 예약 조회 입력 값
- `lookupErrors`: 조회 폼 검증/서버 오류 집합

### 1.5 에러 상태 (Error State)
- `apiErrorSeatsHold`, `apiErrorSeatsLoad`, `apiErrorReservationCreate`, `apiErrorReservationLookup`, `apiErrorReservationCancel`: API별 실패 정보

### 1.6 동시성/검증 상태 (Concurrency/Validation)
- `revalidatedSeatStatuses`: hold 직전 재검증 결과
- `invalidSeatsOnHoldAttempt[]`: 선점 불가 좌석 ID 목록
- `expiredSeatsOnReservation[]`: 예약 확정 시 만료된 좌석 ID 목록

### 1.7 타이머/스케줄 상태
- `seatPollingInterval`: 좌석 상태 폴링 활성화 여부 (좌석 선택 페이지 진입 시)
- `pollingFrequency`: 폴링 주기 (기본 5초, 선점 임박 시 단축 가능)

---
## 2. 표시되지만 별도 상태로 관리하지 않아도 되는 데이터 (즉시 계산/상수)
- 좌석 색상 매핑: `status → {available: 회색, temporarily_held: 노랑, reserved: 빨강}` (고정 상수)
- 등급 배지 스타일 / 가격 포맷: `Intl.NumberFormat` 즉시 변환
- 텍스트 상수: “예약하기”, “매진”, “선점 시간 만료”… 등 메시지 템플릿
- 잔여 좌석 문구: `잔여 ${remainingSeats}석 / 전체 ${concertDetail.totalSeats}석` (파생)
- 예약 완료 페이지 총액 표기 (파생 금액 변환)
- 날짜/시간 표시 포맷 (ISO → 로컬) 즉시 변환
- 예약 번호 (서버 응답 그대로 표시, 캐싱 불필요)
- 등급별 퍼센트: `(availableSeats / totalSeats) * 100` 즉시 계산
- 취소됨 배지: `lookupReservationDetail.status === 'cancelled'` 조건식 결과
- 라우트 경로 문자열: `/reservations/complete`, `/concerts/[id]/seats` 등 상수

선정 기준:
1. 다른 상태(원본 + 파생)로 즉시 계산 가능
2. 불변 하드코딩 값 또는 단순 포매팅 결과
3. 별도 저장 시 정합성 리스크 증가 (예: 잔여 좌석 중복 저장)

---
## 3. 상태 변경 조건 및 UI 영향 표

| 상태 | 유형 | 변경(트리거) 조건 | UI 영향 |
|------|------|------------------|---------|
| publishedConcertList | 서버 | 홈 진입 / 새로고침 / 예약·취소 후 재조회 | 카드 그리드 재렌더, "예약 가능한 콘서트 없음" 메시지 토글 |
| hasAnyPublishedConcert | 파생 | `publishedConcertList.length > 0` | 빈 상태 vs 목록 표시 |
| concertDetail | 서버 | 상세 페이지 진입 / hold·예약·취소 후 재조회 | 공연 정보/잔여 좌석/버튼 활성화 재계산 |
| seatTiers | 서버 | 좌석 페이지 진입 / hold·예약·취소 후 재조회 | 등급 카드 잔여 좌석, 가격 갱신 |
| seatMap | 서버 | 좌석 페이지 진입 / 폴링 / hold 실패 후 재조회 | 좌석 배치도 색상 및 클릭 가능 여부 반영 |
| revalidatedSeatStatuses | 동시성 | hold 시도 직전 재검증 완료 | 실패 좌석 시각적 강조 해제 & 토스트 표시 |
| selectedSeatIds | UI | 좌석 클릭/해제 / 재검증에서 제거 / hold 성공 후 초기화 | 선택 강조 / 버튼 카운트 변경 |
| selectedSeatObjects | 파생 | `selectedSeatIds` 변경 시 seatMap 필터링 재계산 | 선택 좌석 리스트 / 총액 갱신 |
| totalSelectedSeats | 파생 | `selectedSeatIds` 크기 변화 | 버튼 라벨 업데이트 |
| totalSelectedAmount | 파생 | `selectedSeatObjects` 가격 합계 재계산 | 총액 표시 영역 변경 |
| maxSeatSelectionReached | 파생 | `totalSelectedSeats >= 4` | 추가 좌석 클릭 차단 / 경고 토스트 |
| canSubmitHold | 파생 | 최소 1석 && 최대 4석 && !`isHoldingSeats` | "예약하기(N석)" 버튼 활성/비활성 |
| isHoldingSeats | UI | hold API 호출 시작/종료 | 로딩 스피너 / 중복 제출 방지 |
| heldSeatIds | 세션 | hold 성공 응답 수신 | `/book` 로 전달될 좌석 요약 렌더 |
| holdExpiresAt | 세션 | hold 성공 시 설정 | 타이머 시작 / 만료 시 UX 전환 |
| holdCountdownSeconds | UI | 1초 간격 감소, 0 도달 | 남은 시간 표시 / 만료 핸들링 |
| holdCountdownActive | 파생 | `now < holdExpiresAt` | 타이머 컴포넌트 표시 여부 결정 |
| holdRemainingRatio | 파생 | 진행율 재계산 | ProgressBar 색상 등 동적 강조 |
| holdExpired | 파생 | `now >= holdExpiresAt` | 만료 토스트, 좌석 선택 페이지 리다이렉트 |
| formCustomerName / formPhoneNumber / formPassword | UI | onChange 입력 | 실시간/submit 검증 메세지 갱신 |
| formErrors | UI | blur/submit 검증 실패 | 인라인 오류 / submit 차단 |
| canSubmitReservation | 파생 | 폼 유효 && !`isSubmittingReservation` && !`holdExpired` | "예약 완료" 버튼 상태 |
| isSubmittingReservation | UI | 예약 API 호출 시작/종료 | 버튼 로딩 / 중복 제출 방지 |
| reservationCreationResult | 서버 | 예약 API 성공 | 완료 페이지 리다이렉트 & 상세 표시 |
| reservationExpired | 파생 | holdExpired && 예약 전 | 강제 리다이렉트 처리 |
| apiErrorSeatsHold | 에러 | hold 실패 응답 수신 | 에러 토스트 / 재선택 유도 |
| invalidSeatsOnHoldAttempt[] | 동시성 | hold 중 일부 좌석 불가 | 좌석 강조 해제 / 실패 메시지 |
| expiredSeatsOnReservation[] | 동시성 | 예약 재검증 시 만료 | 경고 표시 / 좌석 페이지 이동 |
| lookupPhoneInput / lookupPasswordInput | UI | 사용자 입력 변경 | 인라인 형식/길이 피드백 |
| lookupErrors | UI | 조회 submit 후 검증/서버 에러 | 폼 하단 에러 블록 표시 |
| lookupReservationAuthResult | 서버 | 조회 성공 | 상세 페이지 리다이렉트 트리거 |
| lookupReservationDetail | 서버 | 상세 접근 / 취소 후 재조회 | 공연/좌석/상태 배지 업데이트 |
| reservationAlreadyCancelled | 파생 | `status === 'cancelled'` | "취소됨" 배지 + 취소 버튼 비활성 |
| canCancelReservation | 파생 | `status === 'confirmed' && 규칙 충족` | 취소 버튼 활성/비활성 |
| reservationCancelable | 파생 | (향후 시간 정책 적용) | 취소 불가 안내 메시지 표시 |
| showCancellationConfirmModal | UI | 버튼 클릭 / 확인 / 닫기 | 모달 열림/닫힘 |
| isCancellingReservation | UI | 취소 API 호출 진행 | 모달 내부 로딩 표시 |
| cancellationResult | 서버 | 취소 성공 | 성공 토스트 / 홈 리다이렉트 |
| apiErrorReservationCancel | 에러 | 취소 실패 | 오류 토스트 / 재시도 허용 |
| apiErrorReservationLookup | 에러 | 조회 실패 | "일치하는 예약 정보 없음" 안내 |
| apiErrorReservationCreate | 에러 | 예약 생성 실패 | 폼 오류 표시 / 입력 유지 |
| apiErrorSeatsLoad | 에러 | 좌석 초기 로드 실패 | 전체 에러 스테이트 컴포넌트 노출 |
| isLoadingConcerts | UI | 콘서트 fetch 진행 | 카드 스켈레톤 표시 |
| isLoadingSeats | UI | 좌석 fetch 진행 | 좌석 배치 스켈레톤/스피너 |
| seatPollingInterval | 타이머 | 좌석 페이지 진입 시 활성화, 이탈 시 중단 | 주기적 좌석 상태 동기화 |
| pollingFrequency | 타이머 | 기본 5초, 선점 임박(1분 이하) 시 2초로 단축 | 폴링 주기 조정 |
| toastQueue | UI | push/pop 이벤트 | 토스트 메시지 등장/자동 제거 |
| pendingRedirectUrl | 세션 | 성공/만료 이벤트 설정 | useEffect 네비게이션 실행 |
| autoRedirectTriggered | 파생 | 리다이렉트 1회 완료 | 중복 이동 방지 플래그 |
| isSoldOut | 파생 | `remainingSeats == 0` | "매진" 배지 / 예약 버튼 비활성 |
| remainingSeats | 파생 | 집계 재계산 | 잔여석 숫자/경고 색상 업데이트 |
| tierRemainingSeats[] | 파생 | 티어별 집계 재계산 | 티어 카드 잔여 좌석 수 갱신 |
| isArchiveHidden | 파생 | `concertDetail.status === 'archived'` | 접근 차단 메시지 표시 |
| reservationIdAfterCreate | 세션 | 예약 성공 응답 | 완료 페이지 경로 구성 (query/path) |

---
## 4. 분류 원칙 요약
| 분류 | 기준 | 저장 여부 |
|------|------|-----------|
| 서버 상태 | API 원본 데이터 | React Query 캐시/리페치 |
| UI 로컬 상태 | 사용자 즉시 상호작용 값 | Zustand/컴포넌트 state |
| 파생 상태 | 단순 계산 가능 | 메모만, 별도 저장 지양 |
| 세션/흐름 | 페이지 간 전달/일시적 | 라우터 state 또는 store |
| 에러 상태 | 명확한 분기/표시 필요 | 독립 필드 유지 |
| 동시성/검증 | 경쟁조건 결과/구체 피드백 | 단기 캐시 후 재설정 |
| 타이머 | 시간 기반 변화 | interval 기반 재계산 |

---
## 5. 확장 고려사항
- **실시간(WebSocket) 도입 시**: `seatMap` 업데이트 push 기반 전환 → 폴링 제거, 서버 이벤트로 좌석 상태 갱신
- **필터/검색 추가 시**: `concertFilters` (genre, date range), `paginationCursor`, `searchQuery` 서버 상태 추가
- **취소 정책 강화**: 공연 시작 시각(`concert.performanceDate`) 포함한 `reservationCancelable` 계산 로직 확장
- **재시도 전략**: API 오류 유형별 `retryBackoff`, `nextRetryAt`, `retryCount` 상태 도입
- **다중 언어**: `locale`, `translations` 상태 추가 시 React Query 캐시 키에 locale 포함
- **성능 최적화**: Virtual scrolling 도입 시 `visibleSeatRange` 상태로 렌더링 제한

---
## 6. 구현 제안 (간략)

### React Query Keys 구조
```typescript
// 콘서트 관련
['concerts', 'published'] // 공개 목록
['concert', 'detail', concertId] // 상세
['concert', 'seats', concertId] // 좌석 배치도
['concert', 'tiers', concertId] // 등급 정보

// 예약 관련
['reservation', 'detail', reservationId] // 예약 상세
['reservation', 'lookup', phoneNumber] // 조회 캐시 (민감정보 주의)
```

### Zustand Store Slices
```typescript
// selectionSlice
interface SelectionSlice {
  selectedSeatIds: Set<string>;
  selectSeat: (id: string) => void;
  deselectSeat: (id: string) => void;
  clearSelection: () => void;
  // selectors
  getTotalAmount: (seatMap: Seat[]) => number;
  getSelectedSeats: (seatMap: Seat[]) => Seat[];
}

// holdSlice
interface HoldSlice {
  heldSeatIds: string[];
  holdExpiresAt: string | null;
  holdCountdownSeconds: number;
  setHoldData: (data: HoldResult) => void;
  startCountdown: () => void;
  clearHold: () => void;
}

// reservationFormSlice
interface ReservationFormSlice {
  customerName: string;
  phoneNumber: string;
  password: string;
  errors: Record<string, string>;
  setField: (field: string, value: string) => void;
  validateAll: () => boolean;
  reset: () => void;
}

// feedbackSlice
interface FeedbackSlice {
  toasts: Toast[];
  showModal: string | null;
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  openModal: (modalId: string) => void;
  closeModal: () => void;
}
```

### 파생 계산 헬퍼
```typescript
// 컴포넌트 또는 selector에서 사용
const useSelectedSeatsInfo = (selectedIds: Set<string>, seatMap: Seat[]) => {
  return useMemo(() => {
    const seats = seatMap.filter(s => selectedIds.has(s.id));
    const total = seats.reduce((sum, s) => sum + s.price, 0);
    return { seats, total, count: seats.length };
  }, [selectedIds, seatMap]);
};
```

---
## 7. 제외 사유 예시 (왜 상태로 두지 않는가)
- 잔여 좌석 문구: 원본 수치 2개(총/예약)로 즉시 포맷 가능 → 이중 관리 위험
- 좌석 색상: 디자인 토큰/상수 → 비즈니스 로직 아님
- 예약 번호 포맷: 서버 생성 단일 값, 추가 변환 없음 → 캐싱 불필요

---
## 8. 검증 체크리스트 (문서 기반)

### 필수 비즈니스 로직 포함 확인
- ✅ 좌석 상태 3가지 (`available`, `temporarily_held`, `reserved`) 모두 반영
- ✅ 콘서트 상태 3가지 (`draft`, `published`, `archived`) 처리
- ✅ 예약 상태 2가지 (`confirmed`, `cancelled`) 구분
- ✅ 5분 선점 타이머 관리 (holdExpiresAt, holdCountdownSeconds)
- ✅ 최대 4석 선택 제한 (maxSeatSelectionReached)
- ✅ 동시성 처리 (revalidatedSeatStatuses, invalidSeatsOnHoldAttempt)
- ✅ 에러 상태별 분리 (좌석/예약/취소/조회)
- ✅ 폴링 관리 (seatPollingInterval, pollingFrequency)

### 파생 상태 적절성
- ✅ `selectedSeatObjects`: seatMap 필터링으로 계산 가능 → 파생
- ✅ `totalSelectedSeats`, `totalSelectedAmount`: 단순 집계 → 파생
- ✅ `remainingSeats`, `tierRemainingSeats`: DB 집계값 기반 계산 → 파생
- ✅ `canSubmitHold`, `canSubmitReservation`: 조건식 → 파생
- ✅ `holdExpired`, `holdCountdownActive`: 시간 비교 → 파생

### 중복 제거 확인
- ✅ `holdCountdownActive`, `holdRemainingRatio`: 1.3 파생으로 통합, 1.7 별도 제거
- ✅ `selectedSeatObjects`: 1.2 UI에서 1.3 파생으로 이동
- ✅ `maxSeatSelectionReached`: 1.2 UI에서 1.3 파생으로 이동

### 누락 항목 보완
- ✅ 좌석 폴링 주기 상태 추가
- ✅ Set<string> 타입 명시 (selectedSeatIds)
- ✅ hold 성공 후 selectedSeatIds 초기화 조건 추가
- ✅ 예약 성공 후 리페치 트리거 명시

---
## 9. 결론
이 문서는 좌석 예약 시스템의 복잡한 경쟁/만료/트랜잭션 흐름을 React Query + Zustand로 안정적으로 표현하기 위한 최소/충분 상태 집합을 정의한다. 파생 가능한 값은 저장을 피함으로써 정합성 및 유지보수성을 높이며, 동시성 민감 구간(좌석 선점, 예약 확정)에서만 별도 검증/에러 상태를 유지해 UX 피드백을 정교화한다.

필요 시 후속 단계로 key 설계 세부 정의 또는 실제 코드 스캐폴딩을 진행할 수 있다.
