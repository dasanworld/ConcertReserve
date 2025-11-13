# 선점된 좌석 자동 정리 시스템

## 개요

선점된 좌석이 5분 만료 후 자동으로 `available` 상태로 복구되는 자동 정리 시스템입니다.

## 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Vercel Cron Job (1분마다 자동 실행)                       │
│    /api/cron/cleanup-expired-holds                          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Cron Handler (src/app/api/cron/...)                      │
│    - Authorization 검증                                      │
│    - 백그라운드 작업 트리거                                   │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Cleanup Job (src/backend/jobs/...)                       │
│    - 만료된 선점 조회                                         │
│    - 좌석 상태 복구 (temporarily_held → available)           │
│    - 결과 반환                                               │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Supabase DB                                              │
│    UPDATE seats SET status = 'available'                    │
│    WHERE status = 'temporarily_held' AND hold_expires_at < now()
└─────────────────────────────────────────────────────────────┘
```

## 구현 구성

### 1. 백그라운드 작업 로직
`src/backend/jobs/cleanup-expired-holds.ts`

```typescript
cleanupExpiredHolds(): Promise<{
  success: boolean;
  message: string;
  clearedCount: number;
  expiredSeats: Array<{ id: string; label: string; concertId: string; }>;
}>
```

**기능:**
- 만료된 선점 좌석(hold_expires_at < now) 조회
- status를 `available`로 변경
- hold_expires_at를 NULL로 초기화
- 정리된 좌석 수 반환

### 2. 라우터 등록
`src/backend/jobs/route.ts`

Hono 라우터에 다음 엔드포인트 등록:

```
POST /api/jobs/cleanup-expired-holds
```

**사용:**
- 개발/테스트용 수동 트리거
- 로컬 환경에서 테스트할 때 사용

### 3. Cron Job Handler
`src/app/api/cron/cleanup-expired-holds/route.ts`

**특징:**
- Vercel에서 자동으로 1분마다 호출
- Authorization 헤더 검증 (CRON_SECRET)
- cleanupExpiredHolds 작업 실행

### 4. Vercel 설정
`vercel.json`

```json
{
  "crons": [
    {
      "path": "/api/cron/cleanup-expired-holds",
      "schedule": "*/1 * * * *"
    }
  ]
}
```

## 환경 변수 설정

Vercel 배포 시 필요한 환경 변수:

```
CRON_SECRET=your-secret-key
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### CRON_SECRET 생성 방법

```bash
openssl rand -hex 32
```

## 사용 방법

### 프로덕션 (Vercel)

Vercel 배포 후 자동으로 1분마다 실행됩니다.

### 개발/테스트 환경

#### 수동 트리거 (API)

```bash
curl -X POST http://localhost:3000/api/jobs/cleanup-expired-holds
```

#### 응답 예시 (성공)

```json
{
  "ok": true,
  "data": {
    "message": "Successfully cleaned up 5 expired seat holds",
    "clearedCount": 5,
    "expiredSeats": [
      {
        "id": "seat-id-1",
        "label": "A1-001",
        "concertId": "concert-id"
      }
    ]
  }
}
```

#### 응답 예시 (실패)

```json
{
  "ok": false,
  "error": {
    "code": "CLEANUP_FAILED",
    "message": "Failed to update expired holds: ..."
  }
}
```

## 데이터베이스 조건

좌석 정리 조건:
- `status = 'temporarily_held'`
- `hold_expires_at < now()`
- `deleted_at IS NULL`

업데이트 항목:
- `status` → `'available'`
- `hold_expires_at` → `NULL`
- `updated_at` → `now()`

## 모니터링 및 디버깅

### 로그 확인

#### 로컬 환경
터미널에서 `/api/jobs/cleanup-expired-holds` 호출 시 로그 출력

#### Vercel 배포
Vercel Dashboard → Function Logs에서 확인

### 만료된 좌석 조회 쿼리

```sql
SELECT id, label, concert_id, hold_expires_at
FROM seats
WHERE status = 'temporarily_held'
  AND hold_expires_at < now()
  AND deleted_at IS NULL;
```

## 주의사항

1. **Vercel 배포 필수**: 로컬 환경에서는 Cron Job이 자동으로 실행되지 않음
2. **CRON_SECRET 관리**: 환경 변수로 안전하게 관리해야 함
3. **Supabase 권한**: service-role 키로 작업하므로 권한 관리 필수
4. **데이터베이스 성능**: 대량 좌석 데이터가 있을 경우 인덱스 추가 권장

```sql
CREATE INDEX IF NOT EXISTS idx_seats_status_hold_expires_at
ON seats(status, hold_expires_at)
WHERE status = 'temporarily_held' AND deleted_at IS NULL;
```

## 향후 개선사항

- [ ] 정리 결과 메트릭 수집 (CloudWatch, Datadog 등)
- [ ] Slack/이메일 알림 (대량 정리 또는 실패 시)
- [ ] 정리 히스토리 기록 (audit log)
- [ ] 정리 빈도 조정 가능한 설정
