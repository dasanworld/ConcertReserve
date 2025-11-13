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

## 2. 기능별 Context 설계

### 2.1 좌석 선택 (`SeatSelectionContext`)

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

---

### 2.2 예약 절차 (`ReservationProcessContext`)

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

---

### 2.3 예약 조회 및 취소 (`ReservationLookupContext`)

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

---

## 4. 공통 구현 주의사항

- 모든 Provider와 해당 하위 컴포넌트는 `"use client"`를 선언합니다.
- 모든 HTTP 요청은 `@/lib/remote/api-client` 경유 및 인터셉터(예: 인증 토큰) 규칙을 따릅니다.
- 클라이언트 컴포넌트에서는 `async/await` 사용을 피하고, React Query mutations 또는 `Promise.then().catch()`를 사용합니다.
- Context에서는 가능한 한 불변/원시 형태(예: `readonly string[]`, number, boolean)로 값을 노출합니다.
- 도메인 타입(`Seat`, `ReservationDetail`, 등)은 각 기능의 `src/features/[feature]/lib/dto.ts`에서 가져옵니다.

## 3. 결론

- **서버 상태**: `React Query`가 API 통신, 캐싱, 로딩/에러 상태를 관리합니다.
- **클라이언트 상태**: 위에서 설계한 기능별 `Context`와 `useReducer`가 복잡한 UI 상호작용과 비즈니스 로직을 담당합니다.
- **Provider 분리**: 각 주요 페이지/기능별로 Provider를 분리하여, 관련 없는 컴포넌트의 불필요한 리렌더링을 최소화하고 코드의 응집도를 높입니다.
- **단방향 데이터 흐름**: 모든 상태 변경은 `Action`을 통해 `Reducer`에서만 일어나므로, 데이터 흐름을 추적하기 쉽고 상태를 예측 가능하게 만듭니다.

이 설계는 `state-definition.md`의 요구사항을 충족하면서, 유지보수성과 확장성을 고려한 현대적인 React 상태 관리 패턴을 따릅니다.