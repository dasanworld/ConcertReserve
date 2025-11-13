네, 알겠습니다. 앞서 논의된 개선 사항들을 모두 반영하여 요청하신 양식에 맞춰 최종 상태 관리 설계 문서를 작성해 드리겠습니다.

---

# **상태 관리 설계: Context + Custom Hooks**

> 이 문서는 `state-definition.md`에서 정의된 상태 모델을 기반으로, React의 `Context`, `useReducer`, 그리고 `React Query`를 활용한 최종 상태 관리 아키텍처를 설계합니다. 특히, **Custom Hook 패턴**을 도입하여 Provider의 비대화를 막고 로직을 캡슐화하며, **Zustand**를 통해 페이지 전환 시의 상태 전파 문제를 해결합니다.

---

## 1. 아키텍처 개요

### 1.1 설계 목표
-   **관심사 분리**: 서버 상태(`React Query`)와 클라이언트 UI 상태(`useReducer`)를 명확히 분리하고, 비동기 작업의 진행 상태는 `React Query`를 단일 진실 공급원으로 사용합니다.
-   **로직 캡슐화**: 기능별 **Custom Hook**을 통해 비즈니스 로직, 파생 상태 계산, API 호출 로직을 캡슐화하여 테스트 용이성과 재사용성을 높입니다.
-   **Provider 경량화**: `Context Provider`는 상태 관리 로직을 직접 포함하지 않고, Custom Hook이 반환하는 값을 하위 컴포넌트에 주입하는 **얇은 래퍼(Thin Wrapper)** 역할만 수행합니다.
-   **명확한 상태 전파**: 페이지 전환 시 필요한 임시 데이터는 **Zustand 기반의 단기 세션 스토어**를 통해 명시적으로 전달 및 폐기하여 URL 오염과 전역 상태 남용을 방지합니다.

### 1.2 데이터 흐름 시각화 (Mermaid)
```mermaid
graph TD
    subgraph "Server State (React Query)"
        RQ[React Query Hooks<br/>useSeatMapQuery, useHoldSeatsMutation]
        API[Backend API]
        RQ <--> API
    end

    subgraph "Client State Management"
        subgraph "View Components"
            VC1[SeatMap 컴포넌트]
            VC2[HoldButton 컴포넌트]
        end

        subgraph "Logic & State"
            CH[<b>Custom Hook (e.g., useSeatSelection)</b><br/>- 비동기 로직<br/>- 파생 상태 계산<br/>- 액션 함수 정의]
            CP[Context Provider<br/>(Thin Wrapper)]
            UR[useReducer<br/>(Pure Sync State)]
        end

        subgraph "User Actions"
            UA1[좌석 클릭]
            UA2[예약하기 버튼 클릭]
        end
    end
    
    %% 데이터 흐름 연결
    RQ -- Server Data --> CH
    CH -- Manages --> UR
    CH -- Provides Logic & State --> CP
    CP -- Context Value --> VC1 & VC2

    UA1 -- onSeatClick --> VC1
    VC1 -- calls --> |actions.selectSeat(id)| CH
    
    UA2 -- onClick --> VC2
    VC2 -- calls --> |actions.holdSeats()| CH
    
    CH -- Triggers --> RQ```

**개선된 흐름 설명:**
1.  **Custom Hook 중심**: `useSeatSelection`과 같은 Custom Hook이 상태 관리의 중심이 되어, 내부적으로 `useReducer`와 `React Query`를 조합하여 로직을 처리합니다.
2.  **Provider의 역할 축소**: `SeatSelectionProvider`는 Custom Hook이 반환하는 상태와 함수들을 하위 컴포넌트에 전달하는 역할만 수행합니다.
3.  **컴포넌트의 상호작용**: 컴포넌트는 Context로부터 받은 액션 함수를 호출합니다. 이 함수는 Custom Hook 내에 캡슐화되어 있습니다.
4.  **상태 업데이트**: Custom Hook 내의 액션 함수가 `React Query`의 `mutate`를 호출하거나 `dispatch`를 실행하면, 상태가 변경되고 Context를 통해 컴포넌트에 전파됩니다.

---

### 1.3 공통 상수/타입

```typescript
// src/features/constants/selection.ts
export const SELECTION_LIMIT = 4 as const;
export const HOLD_WARNING_THRESHOLD_SEC = 60 as const;
export const POLL_INTERVAL = { default: 5000 as const, urgent: 2000 as const };

// src/lib/remote/types.ts
export interface ApiError {
  status: number;
  errorCode: string;
  message: string;
  details?: unknown;
  fieldErrors?: Record<string, string>;
}

// 기능별 에러 코드 (literal union)
export type HoldErrorCode =
  | 'SEAT_UNAVAILABLE'
  | 'HOLD_LIMIT_EXCEEDED'
  | 'CONCERT_NOT_AVAILABLE'
  | 'HOLD_EXPIRED';

export interface HoldSeatsError extends ApiError {
  errorCode: HoldErrorCode;
  unavailableSeats?: string[];
}

// 좌석(시각화용 보강)
export interface EnhancedSeat {
  id: string;
  label: string;
  tierLabel: string;
  price: number;
  status: SeatStatus; // 'available' | 'temporarily_held' | 'reserved'
  ephemeralStatus?: 'unavailable_on_hold' | 'recently_released';
}
```

---

## 2. 서버 상태 인터페이스 (React Query Hooks)

### 2.1 좌석 관련 훅
```typescript
// Query Key Factory
const seatQueryKeys = {
  all: ['seats'] as const,
  map: (concertId: string) => [...seatQueryKeys.all, 'map', concertId] as const,
};

// useSeatMapQuery
interface SeatMapQueryResult {
  seats: Seat[];
  lastUpdatedAt: string; // ISO 8601
}
export function useSeatMapQuery(concertId: string): UseQueryResult<SeatMapQueryResult, ApiError>;

// useHoldSeatsMutation
interface MutationRequestBase { clientRequestId: string }

interface HoldSeatsRequest extends MutationRequestBase {
  concertId: string;
  seatIds: string[];
}
interface HoldSeatsResponse {
  heldSeats: HeldSeatSummary[];
  holdExpiresAt: string; // ISO 8601
  totalAmount: number;
}
interface HoldSeatsError extends ApiError {
  errorCode: HoldErrorCode;
  unavailableSeats?: string[]; // 선점 실패 좌석 ID (UI 피드백용)
}
export function useHoldSeatsMutation(): UseMutationResult<HoldSeatsResponse, HoldSeatsError, HoldSeatsRequest>;
```

### 2.2 예약 관련 훅
```typescript
// useCreateReservationMutation
interface CreateReservationRequest extends MutationRequestBase {
  heldSeatIds: string[];
  customerName: string;
  phoneNumber: string;
  password: string;
}
interface CreateReservationResponse {
  reservationId: string;
  reservationNumber: string;
  createdAt: string; // ISO 8601
}
interface CreateReservationError extends ApiError {
  fieldErrors?: Record<string, string>; // 필드별 서버 유효성 검사 오류
}
export function useCreateReservationMutation(): UseMutationResult<CreateReservationResponse, CreateReservationError, CreateReservationRequest>;

// useReservationDetailQuery
// ... (기존과 동일)
```

---

## 3. 기능별 클라이언트 상태 설계

### 3.1 좌석 선택 기능 (`SeatSelection`)

-   **역할**: 좌석 선택 페이지의 모든 UI 상태와 상호작용 로직을 캡슐화합니다.
-   **핵심 패턴**: `useSeatSelection` Custom Hook이 로직을 담당하고, `SeatSelectionProvider`가 이를 주입합니다.

#### **Reducer 상태 및 액션 (`SeatSelectionState`, `SeatSelectionAction`)**
-   `useReducer`는 비동기 진행 상태를 제외한 순수 동기적 UI 상태만 관리합니다.
```typescript
// Reducer가 관리할 상태
interface SeatSelectionState {
  selectedSeatIds: Set<string>;
  selectionError: string | null;
}

// Reducer가 처리할 액션
type SeatSelectionAction =
  | { type: 'SELECT_SEAT'; payload: { seatId: string } }
  | { type: 'DESELECT_SEAT'; payload: { seatId: string } }
  | { type: 'CLEAR_SELECTION' } // 선점 성공 후 선택 초기화
  | { type: 'SET_SELECTION_ERROR'; payload: { message: string } }
  | { type: 'MARK_UNAVAILABLE'; payload: { seatIds: string[] } }; // 실패 좌석 시각화 트리거
```

#### **Custom Hook & Context가 노출할 값 (`SeatSelectionContextValue`)**
-   `useSeatSelection` 훅의 반환 값이자, Provider가 하위 컴포넌트에 노출할 값의 명세입니다.

```typescript
interface SeatSelectionContextValue {
  // 상태 (State)
  /** 
   * [파생 상태] 렌더링용 좌석 배열.
   * 선점 실패 시 특정 좌석에 'unavailable_on_hold' 같은 임시 상태를 부여.
   */
  enhancedSeatMap: EnhancedSeat[];
  /** 현재 선택된 좌석 ID 목록 */
  selectedSeatIds: readonly string[];
  /** 좌석 선택 UI 에러 */
  selectionError: string | null;

  // 비동기 상태 (From React Query)
  /** 좌석 선점 API 호출 진행 여부 */
  isHolding: boolean;
  /** 선점 API 실패 시 에러 정보 */
  holdError: HoldSeatsError | null;

  // 파생 상태 (Derived State)
  /** 선택된 좌석의 상세 객체 배열 */
  selectedSeats: Seat[];
  /** 총 선택 금액 */
  totalAmount: number;
  /** 최대 선택 가능 좌석 수 (예: 4) */
  selectionLimit: number;
  /** 남은 선택 가능 좌석 수 */
  remainingSelectable: number;
  /** '예약하기' 버튼 활성화 조건 */
  canSubmitHold: boolean;

  // 액션 함수 (Action Functions)
  selectSeat: (seatId: string) => void;
  deselectSeat: (seatId: string) => void;
  holdSeats: () => Promise<void>;
  clearSelection: () => void;
  /** 실패 좌석을 일시적으로 강조 처리 */
  markUnavailable: (seatIds: string[]) => void;
}
```

#### Provider Value 안정성 규칙
- Context Value는 `useMemo`로 고정하고, 액션 함수는 `useCallback`으로 고정합니다.
- 선택 수/총액 등 잦은 갱신 값은 별도 Context로 분리하여 리렌더 범위를 최소화합니다.

---

### 3.2 예약 절차 기능 (`ReservationProcess`)

-   **역할**: 좌석 선점 성공 후부터 예약 완료까지의 상태(타이머, 폼 등)를 관리합니다.
-   **핵심 패턴**: `useReservationProcess` Custom Hook이 로직을 담당하고, `ReservationProcessProvider`가 이를 주입합니다.

#### **Reducer 상태 및 액션 (`ReservationProcessState`, `ReservationProcessAction`)**

```typescript
// Reducer가 관리할 상태
interface ReservationProcessState {
  isInitialized: boolean;
  heldSeats: HeldSeatSummary[];
  holdExpiresAt: string | null;
  countdownSeconds: number;
  form: ReservationForm;
  formErrors: Partial<Record<keyof ReservationForm, string>>;
}

// Reducer가 처리할 액션
type ReservationProcessAction =
  | { type: 'INITIALIZE_WITH_HELD_INFO'; payload: HoldSeatsResponse }
  | { type: 'TICK_COUNTDOWN' }
  | { type: 'EXPIRE_HOLD' }
  | { type: 'UPDATE_FORM_FIELD'; payload: { field: keyof ReservationForm; value: string } };```

#### **Custom Hook & Context가 노출할 값 (`ReservationProcessContextValue`)**

```typescript
interface ReservationProcessContextValue {
  // 상태 (State)
  heldSeats: readonly HeldSeatSummary[];
  countdownSeconds: number;
  form: ReservationForm;
  formErrors: Partial<Record<keyof ReservationForm, string>>;

  // 비동기 상태 (From React Query)
  isSubmitting: boolean;
  submissionError: CreateReservationError | null;

  // 파생 상태 (Derived State)
  isHoldExpired: boolean;
  totalAmount: number;
  canSubmitReservation: boolean;

  // 액션 함수 (Action Functions)
  updateFormField: (field: keyof ReservationForm, value: string) => void;
  submitReservation: () => Promise<void>;
  expirePolicy: { warningThresholdSec: number };
}
```
---

### 3.3 예약 조회 기능 (`ReservationLookup`)

```typescript
export interface CancellationPolicy {
  hoursBeforePerformance: number; // e.g., 24
  allowedStatuses: ReadonlyArray<'confirmed'>;
}

export interface ReservationLookupState {
  lookupForm: { phoneNumber: string; password: string };
  isLookingUp: boolean;
  lookupError: string | null;
  reservationDetail: ReservationDetail | null;
  isCancelModalOpen: boolean;
  isCancelling: boolean;
  cancelError: string | null;
}

export type ReservationLookupAction =
  | { type: 'UPDATE_LOOKUP_FORM'; payload: { field: keyof ReservationLookupState['lookupForm']; value: string } }
  | { type: 'LOOKUP_START' | 'LOOKUP_SUCCESS' | 'LOOKUP_FAILURE'; payload?: unknown }
  | { type: 'OPEN_CANCEL_MODAL' | 'CLOSE_CANCEL_MODAL' }
  | { type: 'CANCEL_START' | 'CANCEL_SUCCESS' | 'CANCEL_FAILURE'; payload?: unknown }
  | { type: 'RESET_STATE' };

export interface ReservationLookupContextValue {
  // 상태
  lookupForm: ReservationLookupState['lookupForm'];
  isLookingUp: boolean;
  lookupError: string | null;
  reservationDetail: ReservationDetail | null;
  isCancelModalOpen: boolean;
  isCancelling: boolean;
  cancelError: string | null;

  // 파생 상태
  canCancel: boolean;

  // 액션
  updateLookupFormField: (field: keyof ReservationLookupState['lookupForm'], value: string) => void;
  lookupReservation: () => Promise<void>;
  showCancelModal: () => void;
  hideCancelModal: () => void;
  confirmCancellation: () => Promise<void>;
  reset: () => void;

  // 정책
  cancellationPolicy: CancellationPolicy;
}
```

---

## 4. 페이지 전환 상태 전파

-   **역할**: 페이지 간 일시적으로 상태를 전달하기 위한 단기 세션 스토어의 인터페이스를 정의합니다.
-   **구현 기술**: `Zustand`

```typescript
// stores/useReservationSession.ts
interface ReservationSession {
  /** 
   * 좌석 선점 성공 후 전달될 데이터.
   * 다음 페이지에서 소비된 후 즉시 null로 초기화되어야 함.
   */
  heldInfo: HoldSeatsResponse | null;

  /** 선점 정보를 세션에 저장하는 함수 */
  setHeldInfo: (info: HoldSeatsResponse) => void;
  /** 세션 정보를 초기화하는 함수 */
  clearHeldInfo: () => void;
  /** 읽는 순간 비우는 get-and-clear */
  consumeHeldInfo: () => HoldSeatsResponse | null;
}
```

---

## 5. 공통 구현 보강

### 5.1 Provider Value 안정성
- Value는 `useMemo`로, 액션은 `useCallback`으로 고정합니다.
- 큰 값(예: 좌석 지도)과 잦은 값(예: 카운트/총액)을 분리 Context로 노출해 리렌더를 최소화합니다.

### 5.2 비동기 액션 표준 인터페이스
```typescript
export interface WithAsyncDispatchOptions<TReq, TRes, TErr extends ApiError> {
  start: () => void;                // START_* dispatch
  effect: (req: TReq) => Promise<TRes>; // mutate/mutateAsync
  onSuccess: (res: TRes) => void;   // *_SUCCESS dispatch + 후처리
  onFailure: (err: TErr) => void;   // *_FAILURE dispatch + 후처리
  finally?: () => void;             // 정합성 복구
}

export interface MutationRequestBase { clientRequestId: string }
```

### 5.3 좌석 폴링 인터페이스
```typescript
export interface SeatPollingState {
  currentInterval: number;
  isActive: boolean;
  lastSyncedAt: string | null;
  isWindowFocused: boolean;
}

export interface SeatPollingConfig {
  defaultInterval: number;  // ms
  urgentInterval: number;   // ms
  urgentThreshold: number;  // sec
}

export interface UseSeatPollingOptions {
  concertId: string;
  enabled: boolean;
  holdExpiresAt?: string | null;
}
```

### 5.4 파생 셀렉터 인터페이스
```typescript
export interface SeatSelectionSelectors {
  getSelectedSeats: (seatMap: Seat[], selectedIds: ReadonlyArray<string>) => Seat[];
  getTotalAmount: (seats: ReadonlyArray<Seat>) => number;
  canSubmitHold: (selectedCount: number, isHolding: boolean, limit: number) => boolean;
}
```

---

## 6. 결론

### 5.1 아키텍처 요약
-   **서버 상태**: `React Query`가 API 통신 및 비동기 작업의 진행 상태까지 전담하여 단일 진실 공급원 역할을 수행합니다.
-   **클라이언트 상태**: 기능별 **Custom Hook**이 `useReducer`와 비즈니스 로직을 캡슐화하며, **Context Provider**는 이 훅이 제공하는 상태와 함수를 전달하는 얇은 계층의 역할에 집중합니다.
-   **상태 전파**: 페이지 전환 시 필요한 일시적인 상태는 **Zustand 기반의 단기 세션 스토어**를 통해 명확하고 안전하게 전달됩니다.
-   **단방향 데이터 흐름**: 사용자 액션 → Custom Hook 내 액션 함수 호출 → (`React Query Mutate` or `Reducer Dispatch`) → 상태 변경 → UI 업데이트 흐름을 유지하여 예측 가능성을 보장합니다.

### 6.2 검증 체크리스트
-   [ ] Provider는 상태/로직을 직접 구현하지 않고 Custom Hook을 통해 제공하는가?
-   [ ] 비동기 로직 및 파생 상태 계산은 Custom Hook 내에 캡슐화되었는가?
-   [ ] Reducer는 순수 동기적 상태 변경에만 집중하는가?
-   [ ] 페이지 전환 상태는 단기 세션 스토어를 통해 안전하게 전달되고 사용 후 정리되는가?
-   [ ] API 에러 발생 시, 파생 상태를 통해 사용자에게 명확한 시각적 피드백을 제공하는가?
-   [ ] `React Query`의 `isPending`, `error` 상태가 비동기 UI 상태의 단일 진실 공급원으로 사용되는가?

이 설계는 초기 안의 장점을 유지하면서, 잠재적 이슈들을 해결하여 **더욱 견고하고 확장 가능하며 테스트가 용이한 아키텍처**를 제시합니다.