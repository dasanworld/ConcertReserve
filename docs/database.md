
# **데이터플로우 개요**

## 1. 콘서트 탐색 및 상세 노출
- `concerts`에서 `status = 'published'`인 행만 조회해 홈 카드와 상세 페이지에 노출한다. (Userflow 1 정책)
- 상세 페이지 진입 시 `seats`에서 `status = 'reserved'` 좌석 수와 전체 좌석 수를 계산해 잔여 좌석 현황을 보여준다. (Userflow 1 처리/출력)
- `concert_seat_tiers`를 함께 조회해 등급별 가격 정보를 카드 형태로 반환한다. (Userflow 1 출력)

## 2. 좌석 선택 및 임시 선점
- 좌석 클릭마다 `seats`의 현재 `status`를 확인하고 `available`일 때만 선택을 허용한다. **이때 경쟁 상태(Race Condition)를 방지하기 위해 `SELECT ... FOR UPDATE`와 같은 비관적 잠금(Pessimistic Lock)을 활용한다.** (Userflow 2 정책)
- **사용자가 선택한 N개의 모든 좌석에 대한 선점 처리는 단일 트랜잭션으로 실행되어 원자성(Atomicity)을 보장한다.** 하나라도 선점 불가능한 좌석이 포함된 경우, 트랜잭션 전체를 롤백하고 사용자에게 알린다.
- 선점 성공 시 트랜잭션 내에서 `status`를 `temporarily_held`로 변경하고 `hold_expires_at = now() + interval '5 minutes'`를 기록한다. (Userflow 2 임시 선점)
- 별도 스케줄러가 `hold_expires_at`이 지난 좌석을 주기적으로 찾아 `available`로 되돌린다. (Userflow 2 선점 자동 해제)

## 3. 예약 정보 입력 및 확정
- 예약 정보 제출 전, 사용자가 잡아둔 좌석의 `hold_expires_at`을 재검증한다. (Userflow 3 선점 유효성)
- **(MVP 범위)** 별도의 결제 과정 없이, 단일 트랜잭션으로 `reservations`에 예약자 정보를 INSERT하고, 연결된 좌석들을 `reservation_seats`에 기록한 뒤 `seats.status`를 `reserved`로 갱신하여 예약을 확정한다.
- 실패 시 전체 트랜잭션을 롤백해 좌석을 다시 `available` 상태로 유지한다. (Userflow 3 정책)

## 4. 예약 조회 및 취소
- `reservations`에서 `phone_number`와 `password_hash`가 일치하는 행을 찾고, 조인된 `reservation_seats`/`seats`로 상세 좌석 정보를 반환한다. (Userflow 4 처리)
- 취소 시 트랜잭션으로 `reservations.status`를 `cancelled`로 바꾸고 `reservation_seats`가 참조하는 좌석들의 `status`를 `available`로 되돌린다. (Userflow 4 취소 정책)

## 5. 운영
- 운영자는 DB에서 직접 `concerts.status`를 `draft → published → archived`로 조정하고, 모든 주요 테이블은 `deleted_at`을 통해 소프트 삭제만 허용한다. (Userflow 5 정책)

---

# **주요 흐름별 에러 정책 (Error Policies by Flow)**

### 1. 좌석 임시 선점 실패 시
*   **원인**: 다중 좌석 선택 후 '예약하기' 버튼을 누르는 순간, 일부 좌석이 다른 사용자에 의해 먼저 선점/예약된 경우 (경쟁 상태 발생)
*   **시스템 처리**: 좌석 선점을 위한 트랜잭션 전체를 **롤백(ROLLBACK)**한다. 사용자가 선택하려던 어떤 좌석도 `temporarily_held` 상태로 변경되지 않는다.
*   **사용자 피드백**: "선택하신 좌석 중 일부가 방금 판매되었습니다. 좌석을 다시 선택해주세요." 메시지를 노출하고, 최신 좌석 상태가 반영된 UI를 다시 보여준다.

### 2. 예약 확정 실패 시
*   **원인 1**: 5분의 선점 시간이 만료된 후 '예약 완료' 버튼을 클릭한 경우.
*   **시스템 처리**: 예약 생성 트랜잭션 실행 전, 선점 유효성을 먼저 검증하여 요청을 거절한다. 서버 스케줄러에 의해 해당 좌석은 이미 `available` 상태로 변경되었거나 변경될 예정이다.
*   **사용자 피드백**: "좌석 선점 시간이 만료되었습니다. 죄송하지만 좌석 선택 단계로 다시 진행해주세요." 메시지를 노출하고, 좌석 선택 페이지로 **리다이렉트**한다.

*   **원인 2**: 데이터베이스 오류 등 예기치 않은 문제로 예약 생성 트랜잭션이 실패한 경우.
*   **시스템 처리**: 트랜잭션 전체를 **롤백(ROLLBACK)**한다. `reservations` 레코드가 생성되지 않으며, `seats`의 상태는 변경되지 않고 `temporarily_held`로 유지된다 (이후 스케줄러가 자동 해제 처리).
*   **사용자 피드백**: "예약 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요." 메시지를 노출하고, 현재 페이지(예약 정보 입력)에 머무르게 한다.

### 3. 예약 조회 실패 시
*   **원인**: 입력된 정보(휴대폰 번호, 비밀번호)와 일치하는 예약 내역이 없는 경우.
*   **시스템 처리**: 데이터 조회 결과가 없음을 확인하고, 사용자에게 '데이터 없음' 상태를 반환한다.
*   **사용자 피드백**: "일치하는 예약 정보가 없습니다." 메시지를 입력 폼 하단에 표시한다.

### 4. 예약 취소 실패 시
*   **원인**: 데이터베이스 오류 등으로 예약 취소 트랜잭션이 실패한 경우.
*   **시스템 처리**: 트랜잭션 전체를 **롤백(ROLLBACK)**한다. `reservations`와 `seats`의 상태는 취소 시도 이전 상태로 완전히 복구된다.
*   **사용자 피드백**: "예약 취소 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요." 메시지를 노출한다.

---

# **데이터베이스 스키마 (PostgreSQL)**

## 1. ENUM 정의
- `concert_status`: `draft`, `published`, `archived`
- `seat_status`: `available`, `temporarily_held`, `reserved`
- `reservation_status`: `confirmed`, `cancelled`

## 2. 테이블 상세

### concerts
| 컬럼 | 타입 | 속성 | 설명 |
| --- | --- | --- | --- |
| id | uuid | PK, default gen_random_uuid() | 콘서트 식별자 |
| title | text | NOT NULL | 콘서트 제목 |
| status | concert_status | NOT NULL, default 'draft' | `published` 상태만 노출 |
| created_at | timestamptz | NOT NULL, default now() | 생성 시각 |
| updated_at | timestamptz | NOT NULL, default now() | 수정 시각 |
| deleted_at | timestamptz | NULL | 소프트 삭제 시각 |

**인덱스/제약**
- `CREATE INDEX idx_concerts_status_published ON concerts (status) WHERE status = 'published';`
- `CHECK (deleted_at IS NULL OR deleted_at >= created_at)`

### concert_seat_tiers
| 컬럼 | 타입 | 속성 | 설명 |
| --- | --- | --- | --- |
| id | uuid | PK, default gen_random_uuid() | 좌석 등급 식별자 |
| concert_id | uuid | FK → concerts(id) ON UPDATE CASCADE | 해당 콘서트 참조 |
| label | text | NOT NULL | 등급 명칭 (예: 스페셜, R석) |
| price | numeric(12,0) | NOT NULL | 등급별 가격 정보 |
| created_at | timestamptz | NOT NULL, default now() | 생성 시각 |
| updated_at | timestamptz | NOT NULL, default now() | 수정 시각 |
| deleted_at | timestamptz | NULL | 소프트 삭제 |

**인덱스/제약**
- `UNIQUE (concert_id, label)` 등급명 중복 방지

### seats
| 컬럼 | 타입 | 속성 | 설명 |
| --- | --- | --- | --- |
| id | uuid | PK, default gen_random_uuid() | 좌석 식별자 |
| concert_id | uuid | FK → concerts(id) | 좌석이 속한 콘서트 |
| seat_tier_id | uuid | FK → concert_seat_tiers(id) | 좌석 등급/가격 매핑 |
| label | text | NOT NULL | 좌석 표기 (행/번호 등) |
| section_label | text | NULL | 좌석 구역/블록(예: SP1, PR3) |
| row_label | text | NULL | 행 라벨 (예: A, B, C) |
| row_number | int | NULL | 행 정렬을 위한 숫자 값 |
| seat_number | int | NULL | 행 내 좌석 번호 |
| status | seat_status | NOT NULL, default 'available' | 좌석 상태 |
| hold_expires_at | timestamptz | NULL | 임시 선점 만료 시각 |
| created_at | timestamptz | NOT NULL, default now() | 생성 시각 |
| updated_at | timestamptz | NOT NULL, default now() | 수정 시각 |
| deleted_at | timestamptz | NULL | 소프트 삭제 |

**인덱스/제약**
- `UNIQUE (concert_id, label)` 좌석 중복 방지
- `CREATE INDEX idx_seats_hold_cleanup ON seats (hold_expires_at) WHERE status = 'temporarily_held';`
- `CHECK ((status = 'temporarily_held' AND hold_expires_at IS NOT NULL) OR (status <> 'temporarily_held'))`
- `section_label`, `row_label`, `row_number`, `seat_number` 조합으로 좌석 배치도(UI)의 구역/행/열 정보를 제공한다.

### reservations
| 컬럼 | 타입 | 속성 | 설명 |
| --- | --- | --- | --- |
| id | uuid | PK, default gen_random_uuid() | 예약 식별자 |
| concert_id | uuid | FK → concerts(id) | 어떤 콘서트 예약인지 |
| customer_name | text | NOT NULL | 예약자 이름 |
| phone_number | text | NOT NULL | 휴대폰 번호 |
| password_hash | text | NOT NULL | 해시된 비밀번호 |
| status | reservation_status | NOT NULL, default 'confirmed' | 예약 상태 |
| cancelled_at | timestamptz | NULL | 취소 완료 시각 |
| created_at | timestamptz | NOT NULL, default now() | 예약 완료 시각 |
| updated_at | timestamptz | NOT NULL, default now() | 수정 시각 |
| deleted_at | timestamptz | NULL | 소프트 삭제 |

**인덱스/제약**
- `CREATE INDEX idx_reservations_phone ON reservations (phone_number);`

### reservation_seats
| 컬럼 | 타입 | 속성 | 설명 |
| --- | --- | --- | --- |
| reservation_id | uuid | PK(FK) → reservations(id) ON DELETE CASCADE | 예약 참조 |
| seat_id | uuid | PK(FK) → seats(id) ON UPDATE CASCADE | 예약된 좌석 |
| created_at | timestamptz | NOT NULL, default now() | 매핑 생성 시각 |

**인덱스/제약**
- `PRIMARY KEY (reservation_id, seat_id)`
