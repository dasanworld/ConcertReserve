다음은 제공된 `plan.md`의 핵심 내용을 유지하며 더 간결하게 요약한 버전입니다.

---

# 좌석 선택 페이지 모듈화 설계 (요약)

## 개요 (Overview)

| 모듈 | 위치 | 설명 |
|---|---|---|
| **SeatSelectionPage** | `.../seats/page.tsx` | 좌석 선택 페이지의 진입점. 하위 컴포넌트들을 조합. |
| **SeatMapViewer** | `.../components/seat-map-viewer.tsx` | 좌석 배치도를 시각화하고 선택 이벤트를 처리. |
| **SeatTierInfo** | `.../components/seat-tier-info.tsx` | 등급별 가격 및 잔여 좌석 정보를 표시. |
| **SelectedSeatsPanel** | `.../components/selected-seats-panel.tsx` | 사용자가 선택한 좌석 목록과 총액을 표시. |
| **SeatHoldButton** | `.../components/seat-hold-button.tsx` | 좌석 선점을 최종 요청하는 버튼. |
| **useSeatSelection** | `.../hooks/use-seat-selection.ts` | 좌석 선택 상태(선택, 해제, 제한)를 관리하는 로직 훅. |
| **useSeatsQuery** | `.../hooks/use-seats-query.ts` | React Query를 사용해 좌석 데이터를 조회하는 훅. |
| **useSeatHoldMutation** | `.../hooks/use-seat-hold-mutation.ts` | React Query를 사용해 좌석 임시 선점을 요청하는 훅. |
| **seatSelectionRoute** | `.../backend/route.ts` | 좌석 조회 및 선점 API 엔드포인트를 제공하는 Hono 라우터. |
| **seatSelectionService** | `.../backend/service.ts` | 트랜잭션을 포함한 핵심 비즈니스 로직 (조회, 선점). |
| **seatSelectionSchema** | `.../backend/schema.ts` | Zod를 사용한 API 요청/응답 데이터 스키마 정의. |
| **dto** | `.../lib/dto.ts` | 백엔드 스키마를 프론트엔드에서 재사용하도록 노출. |
| **constants** | `.../constants/index.ts` | 좌석 상태, 색상, 선점 제한 등 공유 상수. |
| **SeatCleanupScheduler** | `.../scheduler/seat-cleanup.ts` | 만료된 선점 좌석을 해제하는 백그라운드 스케줄러 (선택 사항). |

---

## Diagram: 모듈 간 관계 (Mermaid)

```mermaid
graph TB
    subgraph Frontend["Frontend Layer"]
        PageRoute["SeatSelectionPage"]
        SeatMapViewer["SeatMapViewer"]
        SeatTierInfo["SeatTierInfo"]
        SelectedSeatsPanel["SelectedSeatsPanel"]
        SeatHoldButton["SeatHoldButton"]
        useSeatSelection["useSeatSelection"]
        useSeatsQuery["useSeatsQuery"]
        useSeatHoldMutation["useSeatHoldMutation"]
    end
    
    subgraph Backend["Backend Layer (Hono)"]
        Route["seatSelectionRoute"]
        Service["seatSelectionService"]
        Schema["seatSelectionSchema"]
    end
    
    subgraph Shared["Shared Layer"]
        DTO["dto.ts"]
        Constants["constants"]
    end
    
    subgraph Database["Database"]
        DB[(Supabase)]
    end
    
    PageRoute --> SeatMapViewer & SeatTierInfo & SelectedSeatsPanel & SeatHoldButton
    SeatMapViewer & SelectedSeatsPanel & SeatHoldButton --> useSeatSelection
    useSeatSelection --> useSeatsQuery & useSeatHoldMutation
    useSeatsQuery & useSeatHoldMutation --> Route
    Route --> Service --> DB
    Route -- Validation --> Schema
    Frontend -- Types --> DTO
    Backend -- Types --> Schema```

---

## Implementation Plan

### 1. Backend Layer

#### **1.1. Schema (`schema.ts`)**
- **구현**: Zod를 사용하여 좌석, 등급 정보 및 API(조회/선점) 요청/응답 DTO를 정의.
- **Unit Test**:
  - ✅ 유효한 UUID 및 데이터 형식 파싱 성공.
  - ❌ 잘못된 형식, 범위를 벗어난 배열 길이 등 거부.

#### **1.2. Service (`service.ts`)**
- **구현**:
  - `getSeatsByConcertId`: 특정 콘서트의 모든 좌석 및 등급별 잔여석 정보를 조회.
  - `holdSeats`: **트랜잭션**과 **비관적 잠금(`SELECT ... FOR UPDATE`)**을 사용하여 Race Condition을 방지하며 좌석을 5분간 선점.
- **Unit Test**:
  - ✅ 성공: 유효한 ID로 좌석 정보 조회.
  - ✅ 성공: 모든 좌석이 'available'일 때 선점 성공 및 `hold_expires_at` 설정.
  - ❌ 실패: 존재하지 않는 콘서트 조회 시 에러 반환.
  - ❌ 실패: 이미 선점된 좌석이 포함된 경우 롤백 및 에러 반환.

#### **1.3. Route (`route.ts`)**
- **구현**: Service 로직을 호출하는 Hono API 엔드포인트 정의.
  - `GET /api/concerts/:concertId/seats`: 좌석 정보 조회.
  - `POST /api/seats/hold`: 좌석 선점 요청.
- **Unit Test (통합)**:
  - ✅ 유효한 요청에 대해 200 응답.
  - ❌ 유효하지 않은 파라미터(UUID 형식 등)에 대해 400 응답.
  - ❌ 동시성 충돌(이미 선점된 좌석) 시 409 응답.

### 2. Frontend Layer

#### **2.1. Hooks (`useSeatsQuery`, `useSeatHoldMutation`, `useSeatSelection`)**
- **구현**:
  - `useSeatsQuery`: React Query로 좌석 데이터를 비동기 조회 및 캐싱.
  - `useSeatHoldMutation`: 좌석 선점 API를 호출하는 Mutation 훅.
  - `useSeatSelection`: 클라이언트의 좌석 선택 상태(선택 목록, 개수 제한, 총액)를 관리.
- **QA Sheet**:
  - ✅ 데이터 로딩, 성공, 에러 상태를 올바르게 처리하는가?
  - ✅ 좌석 선택/해제 로직이 최대/최소 선택 개수 제한에 맞게 동작하는가?
  - ✅ API 호출 성공/실패 시 UI 피드백(토스트 메시지 등)이 적절히 표시되는가?

#### **2.2. Components (`SeatMapViewer`, `SeatTierInfo`, `SelectedSeatsPanel`, `SeatHoldButton`)**
- **구현**:
  - `SeatMapViewer`: 좌석 데이터를 받아 시각적으로 렌더링. 좌석 상태(선택 가능, 불가능, 선택됨)에 따라 다른 스타일을 적용.
  - `SeatTierInfo`, `SelectedSeatsPanel`: 등급 정보, 선택된 좌석 목록 및 총액을 사용자에게 표시.
  - `SeatHoldButton`: 선택된 좌석 수에 따라 버튼 텍스트가 변경되고, 조건에 따라 활성/비활성 상태가 관리됨.
- **QA Sheet**:
  - ✅ 좌석 상태(available, held, selected 등)에 따라 시각적 구분이 명확한가?
  - ✅ 좌석 클릭 시 선택/해제 동작이 `useSeatSelection` 훅과 올바르게 연동되는가?
  - ✅ 선택된 좌석 정보와 총액이 실시간으로 정확히 반영되는가?

#### **2.3. Page (`SeatSelectionPage`)**
- **구현**: 모든 관련 훅과 컴포넌트를 조합하여 전체 좌석 선택 페이지를 구성. 데이터 조회, 상태 관리, 사용자 인터랙션 처리를 총괄.
- **QA Sheet**:
  - ✅ 페이지 진입 시 데이터 로딩 상태가 표시되고, 조회 완료 시 좌석 배치도가 정상적으로 나타나는가?
  - ✅ 좌석 선택부터 '예약하기' 버튼 클릭 후 다음 페이지로 이동(성공 시) 또는 에러 메시지(실패 시)까지의 전체 흐름이 매끄럽게 동작하는가?