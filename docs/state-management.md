# 상태 관리 설계: Context + useReducer

> 이 문서는 `state-definition.md`에서 정의된 상태 모델을 기반으로, React의 `Context`와 `useReducer`를 활용한 상태 관리 아키텍처를 설계합니다. 서버 상태는 `React Query`가 담당하고, 복잡한 UI 및 도메인 로컬 상태는 이 설계에 따라 관리됩니다.

---

## 1. 아키텍처 개요

### 1.1 설계 목표
- **관심사 분리**: 서버 상태(캐싱, 리페치)와 클라이언트 상태(UI 상호작용, 폼)를 명확히 분리합니다.
- **응집도**: 특정 기능(Feature) 또는 페이지와 강하게 결합된 상태 로직을 해당 영역으로 캡슐화합니다.
- **성능 최적화**: 불필요한 리렌더링을 방지하기 위해 Context를 기능 단위로 분할하고, `useReducer`의 `dispatch` 함수는 참조가 안정적임을 활용합니다.
- **예측 가능성**: `useReducer`를 통해 상태 변경 로직을 중앙에서 관리하여 예측 가능하고 디버깅이 용이한 구조를 만듭니다.

### 1.2 데이터 흐름 시각화 (Mermaid)

```mermaid
graph TD
    subgraph "Server State (React Query)"
        RQ[React Query Hooks<br/>useSeatMapQuery, useHoldSeatsMutation]
        API[Backend API]
        RQ <--> API
    end

    subgraph "Client State (Context + useReducer)"
        subgraph "View Components"
            VC1[SeatMap 컴포넌트]
            VC2[SelectionSummary 컴포넌트]
            VC3[HoldButton 컴포넌트]
        end

        subgraph "Context Provider"
            CP[SeatSelectionProvider]
            UR[useReducer<br/>(state, dispatch)]
            CP -- manages --> UR
        end

        subgraph "User Actions"
            UA1[좌석 클릭]
            UA2[예약하기 버튼 클릭]
        end
    end

    %% 데이터 흐름 연결
    RQ -- Server Data --> CP
    CP -- Context Value (state, actions) --> VC1
    CP -- Context Value (state, actions) --> VC2
    CP -- Context Value (state, actions) --> VC3

    UA1 -- onSeatClick --> VC1
    VC1 -- calls --> |actions.selectSeat(id)| CP
    
    UA2 -- onClick --> VC3
    VC3 -- calls --> |actions.holdSeats()| CP

    CP -- dispatches --> UR
    UR -- updates state --> CP
```

**흐름 설명:**
1.  **데이터 로드**: `SeatSelectionProvider`는 `React Query`를 사용해 좌석 데이터(`seatMap`)를 가져옵니다.
2.  **상태 초기화**: `useReducer`는 초기 상태와 `seatMap` 데이터를 결합하여 내부 상태를 관리합니다.
3.  **Context 제공**: Provider는 하위 컴포넌트에게 현재 상태(`selectedSeatIds` 등)와 상태 변경 함수(`selectSeat`, `holdSeats` 등)를 노출합니다.
4.  **사용자 상호작용**: 하위 컴포넌트(`SeatMap`, `HoldButton`)에서 사용자 이벤트가 발생하면 Context가 제공한 함수를 호출합니다.
5.  **상태 변경 요청**: Context의 함수는 내부적으로 `dispatch`를 호출하여 `reducer`에게 상태 변경을 요청합니다.
6.  **상태 업데이트 및 리렌더링**: `reducer`가 새로운 상태를 반환하면, Context Provider가 리렌더링되고, 변경된 상태를 사용하는 하위 컴포넌트들도 업데이트됩니다.

---

## 2. React Query 훅 인터페이스 설계

### 2.1 좌석 관련 Query/Mutation

```typescript
// src/features/concert/hooks/useSeatMapQuery.ts
interface UseSeatMapQueryOptions {
  concertId: string;
  enabled?: boolean;
  refetchInterval?: number | false; // 폴링 주기 (ms)
}

interface SeatMapQueryResult {
  seats: Seat[];
  lastUpdatedAt: string;
}

// Query Key Factory
const seatQueryKeys = {
  all: ['seats'] as const,
  map: (concertId: string) => [...seatQueryKeys.all, 'map', concertId] as const,
  tiers: (concertId: string) => [...seatQueryKeys.all, 'tiers', concertId] as const,
};

// Hook Interface
export function useSeatMapQuery(options: UseSeatMapQueryOptions): UseQueryResult<SeatMapQueryResult>;
```

```typescript
// src/features/concert/hooks/useHoldSeatsMutation.ts
interface HoldSeatsRequest {
  concertId: string;
  seatIds: string[];
}

interface HoldSeatsResponse {
  heldSeats: Array<{
    id: string;
    label: string;
    price: number;
    tierLabel: string;
  }>;
  holdExpiresAt: string; // ISO 8601
  totalAmount: number;
}

interface HoldSeatsError {
  message: string;
  unavailableSeats?: string[]; // 선점 실패한 좌석 ID
  errorCode: 'SEAT_UNAVAILABLE' | 'HOLD_LIMIT_EXCEEDED' | 'CONCERT_NOT_AVAILABLE';
}

export function useHoldSeatsMutation(): UseMutationResult<
  HoldSeatsResponse,
  HoldSeatsError,
  HoldSeatsRequest
>;
```

### 2.2 예약 관련 Query/Mutation

```typescript
// src/features/reservation/hooks/useCreateReservationMutation.ts
interface CreateReservationRequest {
  heldSeatIds: string[];
  customerName: string;
  phoneNumber: string;
  password: string;
}

interface CreateReservationResponse {
  reservationId: string;
  reservationNumber: string;
  createdAt: string;
}

interface CreateReservationError {
  message: string;
  fieldErrors?: Record<string, string>; // 필드별 검증 오류
  errorCode: 'HOLD_EXPIRED' | 'VALIDATION_FAILED' | 'SEATS_RELEASED';
}

export function useCreateReservationMutation(): UseMutationResult<
  CreateReservationResponse,
  CreateReservationError,
  CreateReservationRequest
>;
```

```typescript
// src/features/reservation/hooks/useReservationDetailQuery.ts
interface ReservationDetail {
  id: string;
  reservationNumber: string;
  status: 'confirmed' | 'cancelled';
  customerName: string;
  phoneNumber: string;
  totalAmount: number;
  createdAt: string;
  cancelledAt: string | null;
  concert: {
    id: string;
    title: string;
    performanceDate: string;
    venue: string;
  };
  seats: Array<{
    id: string;
    label: string;
    tierLabel: string;
    price: number;
  }>;
}

export function useReservationDetailQuery(
  reservationId: string
): UseQueryResult<ReservationDetail>;
```

### 2.3 Polling 전략 인터페이스

```typescript
// src/features/concert/hooks/useSeatPolling.ts
interface SeatPollingConfig {
  /** 기본 폴링 주기 (밀리초) */
  defaultInterval: 5000;
  /** 선점 임박 시 단축 주기 (밀리초) */
  urgentInterval: 2000;
  /** 임박 임계값 (초) - 이 시간 이하면 urgentInterval 적용 */
  urgentThreshold: 60;
}

interface UseSeatPollingOptions {
  concertId: string;
  /** 폴링 활성화 여부 */
  enabled: boolean;
  /** 선점 만료 시각 (ISO) - 제공 시 동적 주기 조정 */
  holdExpiresAt?: string | null;
}

interface SeatPollingState {
  /** 현재 적용 중인 폴링 주기 */
  currentInterval: number;
  /** 폴링 활성 여부 */
  isActive: boolean;
  /** 마지막 동기화 시각 */
  lastSyncedAt: string | null;
}

/**
 * 좌석 상태 실시간 동기화를 위한 폴링 훅
 * - 페이지 진입 시 자동 시작, 이탈 시 자동 정지
 * - holdExpiresAt 제공 시 남은 시간에 따라 폴링 주기 동적 조정
 */
export function useSeatPolling(
  options: UseSeatPollingOptions
): SeatPollingState;
```

---

## 3. 기능별 Context 설계

### 3.1 좌석 선택 (`SeatSelectionContext`)

- **역할**: 좌석 선택 페이지(`concerts/[id]/seats`)의 모든 UI 상태와 상호작용을 관리합니다.
- **범위**: 좌석 선택, 선택 현황 요약, 좌석 임시 선점(hold) API 호출까지의 로직을 캡슐화합니다.

#### **State 인터페이스 (`SeatSelectionState`)**
```typescript
interface SeatSelectionState {
  /** 원본 서버 데이터 (Provider가 props로 받음) */
  seatMap: Seat[];
  
  /** 현재 선택된 좌석 ID 집합 */
  selectedSeatIds: Set<string>;
  
  /** 좌석 선택 관련 에러 메시지 (예: 최대 선택 초과) */
  selectionError: string | null;
  
  /** 좌석 선점 API 호출 진행 여부 */
  isHolding: boolean;
  
  /** 선점 API 실패 시 에러 정보 */
  holdError: { message: string; unavailableSeats?: string[] } | null;
}
```

#### **Action 인터페이스 (`SeatSelectionAction`)**
```typescript
type SeatSelectionAction =
  | { type: 'SELECT_SEAT'; payload: { seatId: string; seatStatus: SeatStatus } }
  | { type: 'DESELECT_SEAT'; payload: { seatId: string } }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'SET_SELECTION_ERROR'; payload: string }
  | { type: 'START_HOLD' }
  | { type: 'HOLD_SUCCESS' } // 성공 시 선택 초기화
  | { type: 'HOLD_FAILURE'; payload: { message: string; unavailableSeats?: string[] } };
```

#### **Provider가 노출할 값 (`SeatSelectionContextValue`)**
```typescript
interface SeatSelectionContextValue {
  // 상태 (State)
  selectedSeatIds: readonly string[]; // 외부 노출은 불변 배열로 제공 (내부는 Set 유지)
  selectionError: string | null;
  isHolding: boolean;
  holdError: { message: string; unavailableSeats?: string[] } | null;

  // 파생 상태 (Derived State)
  selectedSeats: Seat[]; // 선택된 좌석 객체 배열
  totalAmount: number;   // 총 선택 금액
  selectionLimit: number; // 최대 선택 가능 좌석 수 (예: 4)
  remainingSelectable: number; // 남은 선택 가능 좌석 수
  canSubmitHold: boolean; // '예약하기' 버튼 활성화 조건

  // 액션 함수 (Action Functions)
  selectSeat: (seatId: string) => void;
  deselectSeat: (seatId: string) => void;
  clearSelection: () => void;
  holdSeats: () => Promise<void>; // 비동기 액션
}
```

#### 구현 규칙
- Provider 및 소비 컴포넌트는 모두 `"use client"` 지시문을 사용합니다.
- HTTP 요청은 반드시 `@/lib/remote/api-client`를 경유합니다.
- 클라이언트 컴포넌트에서는 `async/await`를 지양하고, React Query mutation 또는 `Promise.then().catch()` 체인을 사용합니다.
- 외부에는 `readonly string[]`를 노출하고, 내부에서는 `Set<string>`으로 효율적 포함/제거 연산을 수행합니다.

#### 비동기 액션 처리 패턴
```typescript
// Reducer는 순수 함수로 유지하고, 비동기 로직은 Provider 내부 함수로 분리
const SeatSelectionProvider = ({ children }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const holdMutation = useHoldSeatsMutation();
  
  // 비동기 액션은 별도 함수로 정의
  const holdSeats = useCallback(() => {
    dispatch({ type: 'START_HOLD' });
    
    return holdMutation.mutateAsync({
      concertId: state.concertId,
      seatIds: Array.from(state.selectedSeatIds),
    })
      .then((result) => {
        dispatch({ type: 'HOLD_SUCCESS', payload: result });
        return result;
      })
      .catch((error) => {
        dispatch({ type: 'HOLD_FAILURE', payload: error });
        throw error;
      });
  }, [state.selectedSeatIds, holdMutation]);
  
  // Context에 dispatch와 비동기 액션 함수 모두 제공
  const value = {
    ...state,
    selectSeat: (id: string) => dispatch({ type: 'SELECT_SEAT', payload: { seatId: id } }),
    deselectSeat: (id: string) => dispatch({ type: 'DESELECT_SEAT', payload: { seatId: id } }),
    clearSelection: () => dispatch({ type: 'CLEAR_SELECTION' }),
    holdSeats, // Promise 반환
  };
  
  return <Context.Provider value={value}>{children}</Context.Provider>;
};
```

#### 타입 의존성
```typescript
// src/features/concert/lib/dto.ts
export type { Seat, SeatStatus, SeatTier } from '../backend/schema';

// Context에서 import
import type { Seat } from '@/features/concert/lib/dto';
```

---

### 3.2 예약 절차 (`ReservationProcessContext`)

- **역할**: 좌석 선점 성공 후부터 예약 완료까지의 상태를 관리합니다. 타이머, 예약 폼 입력, 최종 제출 로직을 포함합니다.
- **범위**: 예약 정보 입력 페이지(`/book`) 전체.

#### **State 인터페이스 (`ReservationProcessState`)**
```typescript
interface ReservationProcessState {
  /** 선점된 좌석 정보 (Provider가 props로 받음) */
  heldSeats: Seat[];
  holdExpiresAt: string;

  /** 남은 선점 시간(초) */
  countdownSeconds: number;
  
  /** 타이머 활성 여부 */
  isTimerActive: boolean;

  /** 예약자 정보 폼 상태 */
  form: {
    customerName: string;
    phoneNumber: string;
    password: string;
  };
  
  /** 폼 필드별 유효성 검사 오류 */
  formErrors: Partial<Record<keyof ReservationProcessState['form'], string>>;

  /** 예약 생성 API 호출 진행 여부 */
  isSubmitting: boolean;
  
  /** 예약 생성 API 실패 시 에러 메시지 */
  submissionError: string | null;
}
```

#### **Action 인터페이스 (`ReservationProcessAction`)**
```typescript
type ReservationProcessAction =
  | { type: 'START_TIMER'; payload: { expiresAt: string } }
  | { type: 'TICK_COUNTDOWN' }
  | { type: 'EXPIRE_HOLD' }
  | { type: 'UPDATE_FORM_FIELD'; payload: { field: keyof ReservationProcessState['form']; value: string } }
  | { type: 'SET_FORM_ERRORS'; payload: Partial<Record<keyof ReservationProcessState['form'], string>> }
  | { type: 'START_SUBMISSION' }
  | { type: 'SUBMISSION_SUCCESS' }
  | { type: 'SUBMISSION_FAILURE'; payload: string };
```

#### **Provider가 노출할 값 (`ReservationProcessContextValue`)**
```typescript
interface ReservationProcessContextValue {
  // 상태 (State)
  countdownSeconds: number;
  isTimerActive: boolean;
  isHoldExpired: boolean; // 파생 상태
  form: ReservationProcessState['form'];
  formErrors: ReservationProcessState['formErrors'];
  isSubmitting: boolean;
  submissionError: string | null;

  // 파생 상태 (Derived State)
  totalAmount: number;
  canSubmitReservation: boolean;

  // 액션 함수 (Action Functions)
  updateFormField: (field: keyof ReservationProcessState['form'], value: string) => void;
  submitReservation: () => Promise<void>;
  expireHoldAndCleanup: () => void; // 만료 시 선택/폼/타이머 정리 및 알림 트리거
}
```

#### 구현 규칙
- 만료 타이머는 Provider 내부 `useEffect`에서 `setInterval`로 tick을 관리하고, 언마운트 시 정리합니다.
- 시간 비교는 ISO 문자열을 `Date.parse`로 처리합니다.
- HTTP 요청은 `@/lib/remote/api-client`를 경유하며, 클라이언트에서는 `async/await` 대신 Promise 체인을 사용합니다.
- `datetime-local` 값은 `${value}:00Z` 형태로 ISO 문자열을 구성합니다.

#### 만료 처리 상세 설계
```typescript
interface ExpireHandlerConfig {
  /** 만료 시 실행할 정리 작업 */
  onExpire: () => void;
  /** 만료 전 경고 임계값 (초) */
  warningThreshold: 60;
  /** 경고 시 실행할 콜백 */
  onWarning?: () => void;
}

// expireHoldAndCleanup 상세 동작
const expireHoldAndCleanup = () => {
  // 1. 상태 초기화
  dispatch({ type: 'EXPIRE_HOLD' });
  
  // 2. 타이머 정리 (useEffect cleanup에서도 처리되지만 명시적 호출)
  clearInterval(timerRef.current);
  
  // 3. 선점 좌석 해제 알림 (서버는 자동 해제, 클라이언트는 UI 피드백만)
  toast.warning('선점 시간이 만료되었습니다. 좌석 선택 페이지로 이동합니다.');
  
  // 4. 폼 입력 값 보존 여부 결정 (UX 정책에 따라)
  // Option A: 전체 초기화
  dispatch({ type: 'RESET_FORM' });
  
  // Option B: 입력 값 유지, 에러만 초기화
  // dispatch({ type: 'CLEAR_FORM_ERRORS' });
  
  // 5. 좌석 선택 페이지로 리다이렉트
  router.push(`/concerts/${concertId}/seats`);
};

// 경고 임계값 처리
useEffect(() => {
  if (countdownSeconds === 60 && countdownSeconds > 0) {
    toast.info('선점 시간이 1분 남았습니다.');
  }
}, [countdownSeconds]);
```

#### 타입 의존성
```typescript
// src/features/reservation/lib/dto.ts
export type { 
  ReservationFormData,
  ReservationCreateRequest,
  ReservationCreateResponse 
} from '../backend/schema';

// Context에서 import
import type { ReservationFormData } from '@/features/reservation/lib/dto';
import type { Seat } from '@/features/concert/lib/dto';
```

---

### 3.3 예약 조회 및 취소 (`ReservationLookupContext`)

- **역할**: 예약 조회 폼 입력부터 상세 정보 표시, 취소까지의 흐름을 관리합니다.
- **범위**: 예약 조회 페이지(`/reservations/lookup`) 및 예약 상세 페이지(`/reservations/[id]`).

#### **State 인터페이스 (`ReservationLookupState`)**
```typescript
interface ReservationLookupState {
  /** 조회 폼 입력 값 */
  lookupForm: {
    phoneNumber: string;
    password: string;
  };
  
  /** 조회 API 호출 진행 여부 */
  isLookingUp: boolean;
  
  /** 조회 실패 에러 메시지 */
  lookupError: string | null;

  /** 조회 성공 후 받아온 예약 상세 정보 */
  reservationDetail: ReservationDetail | null;
  
  /** 취소 확인 모달 표시 여부 */
  isCancelModalOpen: boolean;
  
  /** 취소 API 호출 진행 여부 */
  isCancelling: boolean;
  
  /** 취소 실패 에러 메시지 */
  cancelError: string | null;
}
```

#### **Action 인터페이스 (`ReservationLookupAction`)**
```typescript
type ReservationLookupAction =
  | { type: 'UPDATE_LOOKUP_FORM'; payload: { field: keyof ReservationLookupState['lookupForm']; value: string } }
  | { type: 'LOOKUP_START' }
  | { type: 'LOOKUP_SUCCESS'; payload: ReservationDetail }
  | { type: 'LOOKUP_FAILURE'; payload: string }
  | { type: 'OPEN_CANCEL_MODAL' }
  | { type: 'CLOSE_CANCEL_MODAL' }
  | { type: 'CANCEL_START' }
  | { type: 'CANCEL_SUCCESS' }
  | { type: 'CANCEL_FAILURE'; payload: string }
  | { type: 'RESET_STATE' };
```

#### **Provider가 노출할 값 (`ReservationLookupContextValue`)**
```typescript
interface ReservationLookupContextValue {
  // 상태 (State)
  lookupForm: ReservationLookupState['lookupForm'];
  isLookingUp: boolean;
  lookupError: string | null;
  reservationDetail: ReservationDetail | null;
  isCancelModalOpen: boolean;
  isCancelling: boolean;
  cancelError: string | null;

  // 파생 상태 (Derived State)
  canCancel: boolean; // 취소 가능 조건(상태, 시간 등) 충족 여부

  // 액션 함수 (Action Functions)
  updateLookupFormField: (field: keyof ReservationLookupState['lookupForm'], value: string) => void;
  lookupReservation: () => Promise<void>;
  showCancelModal: () => void;
  hideCancelModal: () => void;
  confirmCancellation: () => Promise<void>;
  reset: () => void;
}
```

#### 구현 규칙
- 조회/취소 요청은 `@/lib/remote/api-client`를 통해 수행합니다.
- `canCancel`는 예약 상태 및 시간 제약(정책)에 기반하여 계산합니다.
- 클라이언트에서는 `async/await` 대신 Promise 체인을 사용하거나, React Query mutation을 사용합니다.
- 타입은 `src/features/*/lib/dto`에서 재노출된 DTO를 참조합니다.

#### 취소 가능 조건 계산 로직
```typescript
interface CancellationPolicy {
  /** 공연 시작 전 취소 가능 시간 (시간 단위) */
  hoursBeforePerformance: 24;
  /** 취소 가능 상태 목록 */
  allowedStatuses: ['confirmed'];
}

// canCancel 파생 상태 계산
const canCancel = useMemo(() => {
  if (!reservationDetail) return false;
  
  // 1. 상태 검증
  if (reservationDetail.status !== 'confirmed') return false;
  
  // 2. 시간 제약 검증 (향후 정책)
  const performanceDate = new Date(reservationDetail.concert.performanceDate);
  const now = new Date();
  const hoursUntilPerformance = (performanceDate.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  if (hoursUntilPerformance < 24) return false;
  
  return true;
}, [reservationDetail]);
```

#### 타입 의존성
```typescript
// src/features/reservation/lib/dto.ts
export type { 
  ReservationDetail,
  ReservationLookupRequest,
  ReservationCancelResponse 
} from '../backend/schema';

// Context에서 import
import type { ReservationDetail } from '@/features/reservation/lib/dto';
```

---

## 4. 공통 구현 주의사항

### 4.1 기본 규칙
- 모든 Provider와 해당 하위 컴포넌트는 `"use client"`를 선언합니다.
- 모든 HTTP 요청은 `@/lib/remote/api-client` 경유 및 인터셉터(예: 인증 토큰) 규칙을 따릅니다.
- 클라이언트 컴포넌트에서는 `async/await` 사용을 피하고, React Query mutations 또는 `Promise.then().catch()`를 사용합니다.
- Context에서는 가능한 한 불변/원시 형태(예: `readonly string[]`, number, boolean)로 값을 노출합니다.
- 도메인 타입(`Seat`, `ReservationDetail`, 등)은 각 기능의 `src/features/[feature]/lib/dto.ts`에서 가져옵니다.

### 4.2 에러 처리 전략

#### Error Boundary 계층 구조
```typescript
// src/components/error/ErrorBoundary.tsx
interface ErrorBoundaryProps {
  /** 에러 발생 시 표시할 Fallback UI */
  fallback?: React.ComponentType<{ error: Error; reset: () => void }>;
  /** 에러 로깅 콜백 */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

// 사용 예시: 페이지 레벨
<ErrorBoundary fallback={PageErrorFallback}>
  <SeatSelectionProvider>
    <SeatSelectionPage />
  </SeatSelectionProvider>
</ErrorBoundary>
```

#### Toast 알림 통합
```typescript
// src/features/feedback/hooks/useToast.ts
interface ToastOptions {
  id?: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number; // ms, 기본 3000
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface UseToastReturn {
  toast: (options: Omit<ToastOptions, 'id'>) => string; // 생성된 toast ID 반환
  dismiss: (toastId: string) => void;
  dismissAll: () => void;
}

// Context에서 toast 사용 예시
const { toast } = useToast();

holdMutation.mutateAsync(request)
  .then((result) => {
    toast({ type: 'success', message: '좌석 선점에 성공했습니다.' });
  })
  .catch((error) => {
    toast({ 
      type: 'error', 
      message: error.message,
      action: {
        label: '다시 시도',
        onClick: () => holdMutation.mutate(request),
      },
    });
  });
```

#### API 에러 타입 표준화
```typescript
// src/lib/remote/types.ts
export interface ApiError {
  /** HTTP 상태 코드 */
  status: number;
  /** 에러 코드 (비즈니스 로직) */
  errorCode: string;
  /** 사용자 표시용 메시지 */
  message: string;
  /** 개발자용 상세 정보 */
  details?: unknown;
  /** 필드별 검증 오류 (폼 에러) */
  fieldErrors?: Record<string, string>;
}

// Context에서 에러 처리 예시
catch ((error: ApiError) => {
  if (error.status === 400 && error.fieldErrors) {
    // 폼 검증 오류
    Object.entries(error.fieldErrors).forEach(([field, message]) => {
      dispatch({ type: 'SET_FORM_ERROR', payload: { field, message } });
    });
  } else if (error.errorCode === 'HOLD_EXPIRED') {
    // 특정 에러 코드에 대한 처리
    dispatch({ type: 'EXPIRE_HOLD' });
    toast({ type: 'warning', message: error.message });
    router.push(`/concerts/${concertId}/seats`);
  } else {
    // 일반 에러
    toast({ type: 'error', message: error.message });
  }
})
```

### 4.3 성능 최적화 가이드

#### Context 분할 원칙
```typescript
// ❌ 잘못된 예: 모든 상태를 하나의 Context에
const AppContext = createContext({
  selectedSeats,
  holdTimer,
  reservationForm,
  // ... 모든 상태
});

// ✅ 올바른 예: 기능/페이지 단위로 분할
const SeatSelectionContext = createContext({ selectedSeats, ... });
const ReservationProcessContext = createContext({ holdTimer, form, ... });
const ReservationLookupContext = createContext({ lookupForm, detail, ... });
```

#### 파생 상태 메모이제이션
```typescript
// Provider 내부에서 파생 상태 계산 시 useMemo 활용
const selectedSeats = useMemo(
  () => seatMap.filter(s => selectedSeatIds.has(s.id)),
  [seatMap, selectedSeatIds]
);

const totalAmount = useMemo(
  () => selectedSeats.reduce((sum, seat) => sum + seat.price, 0),
  [selectedSeats]
);

const remainingSelectable = useMemo(
  () => Math.max(0, SELECTION_LIMIT - selectedSeatIds.size),
  [selectedSeatIds.size]
);
```

#### React Query 캐시 최적화
```typescript
// Optimistic Update 패턴
const holdMutation = useMutationMutation({
  mutationFn: holdSeatsApi,
  onMutate: async (request) => {
    // 낙관적 업데이트: 즉시 UI 반영
    await queryClient.cancelQueries({ queryKey: seatQueryKeys.map(request.concertId) });
    const previousSeats = queryClient.getQueryData(seatQueryKeys.map(request.concertId));
    
    queryClient.setQueryData(seatQueryKeys.map(request.concertId), (old) => ({
      ...old,
      seats: old.seats.map(s => 
        request.seatIds.includes(s.id) 
          ? { ...s, status: 'temporarily_held' } 
          : s
      ),
    }));
    
    return { previousSeats };
  },
  onError: (err, variables, context) => {
    // 실패 시 롤백
    if (context?.previousSeats) {
      queryClient.setQueryData(
        seatQueryKeys.map(variables.concertId),
        context.previousSeats
      );
    }
  },
  onSettled: (data, error, variables) => {
    // 성공/실패 후 최신 데이터로 재조회
    queryClient.invalidateQueries({ queryKey: seatQueryKeys.map(variables.concertId) });
  },
});
```

---

## 5. 결론

### 5.1 아키텍처 요약
- **서버 상태**: `React Query`가 API 통신, 캐싱, 로딩/에러 상태를 관리합니다.
- **클라이언트 상태**: 위에서 설계한 기능별 `Context`와 `useReducer`가 복잡한 UI 상호작용과 비즈니스 로직을 담당합니다.
- **Provider 분리**: 각 주요 페이지/기능별로 Provider를 분리하여, 관련 없는 컴포넌트의 불필요한 리렌더링을 최소화하고 코드의 응집도를 높입니다.
- **단방향 데이터 흐름**: 모든 상태 변경은 `Action`을 통해 `Reducer`에서만 일어나므로, 데이터 흐름을 추적하기 쉽고 상태를 예측 가능하게 만듭니다.

### 5.2 구현 우선순위
1. **Phase 1: 기초 인프라**
   - React Query 훅 인터페이스 구현 (`useSeatMapQuery`, `useHoldSeatsMutation` 등)
   - 기본 타입 정의 (`src/features/*/lib/dto.ts`)
   - API 클라이언트 에러 핸들링 표준화

2. **Phase 2: 핵심 Context**
   - `SeatSelectionContext`: Reducer + Provider 구현
   - `ReservationProcessContext`: 타이머 로직 포함
   - Toast/Modal 공통 피드백 시스템

3. **Phase 3: 확장 기능**
   - `ReservationLookupContext`: 조회/취소 흐름
   - 좌석 폴링 (`useSeatPolling`) 구현
   - Error Boundary 및 Fallback UI

4. **Phase 4: 최적화**
   - Optimistic Update 적용
   - Context 분할 최적화
   - 파생 상태 메모이제이션 검토

### 5.3 검증 체크리스트
- [ ] 모든 Context Provider는 `"use client"` 선언
- [ ] 비동기 로직은 Reducer 외부에서 처리
- [ ] 타입은 `src/features/*/lib/dto`에서 일관되게 import
- [ ] API 에러는 표준 `ApiError` 타입으로 처리
- [ ] 폴링은 페이지 이탈 시 자동 정리
- [ ] 만료 처리 시 사용자 입력 보존 정책 결정
- [ ] Toast 알림은 중복 방지 로직 포함
- [ ] React Query 캐시 키는 일관된 Factory 패턴 사용

이 설계는 `state-definition.md`의 요구사항을 충족하면서, 유지보수성과 확장성을 고려한 현대적인 React 상태 관리 패턴을 따릅니다.