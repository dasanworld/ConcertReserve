# 선점된 좌석 자동 정리 - 구현 완료

## 📝 구현 요약

**목표**: 5분 만료된 선점 좌석을 자동으로 `available` 상태로 복구하는 백그라운드 정리 시스템 구현

**상태**: ✅ 완료

---

## 🏗️ 구현된 컴포넌트

### 1. 백그라운드 정리 작업 로직
**파일**: `src/backend/jobs/cleanup-expired-holds.ts`

```typescript
export async function cleanupExpiredHolds()
```

**기능**:
- Supabase 서비스 클라이언트 초기화
- 만료된 선점 좌석 조회 (status='temporarily_held' AND hold_expires_at < now())
- 좌석 상태 업데이트 (temporarily_held → available)
- hold_expires_at NULL 처리
- 정리된 좌석 정보 반환

**에러 처리**: 안전한 try-catch로 예외 상황 처리

---

### 2. 작업 라우터 등록
**파일**: `src/backend/jobs/route.ts`

**엔드포인트**:
- `POST /api/jobs/cleanup-expired-holds` (개발/테스트용 수동 트리거)

**기능**:
- 로거를 통한 작업 로깅
- 작업 성공/실패 응답
- 상세 에러 정보 반환

---

### 3. Cron Job 핸들러
**파일**: `src/app/api/cron/cleanup-expired-holds/route.ts`

**특징**:
- Vercel Cron Jobs 자동 실행
- CRON_SECRET으로 Authorization 검증
- cleanupExpiredHolds 작업 트리거
- 결과 JSON 응답

**보안**: Authorization 헤더 검증으로 무단 접근 방지

---

### 4. Hono 앱 통합
**파일**: `src/backend/hono/app.ts`

**변경사항**:
```typescript
import { registerJobRoutes } from '@/backend/jobs/route';
// ...
registerJobRoutes(app);
```

---

### 5. Vercel 설정
**파일**: `vercel.json`

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

**특징**:
- 1분마다 자동 실행
- Vercel 배포 환경에서만 활성화

---

### 6. 데이터베이스 최적화
**파일**: `supabase/migrations/0011_create_cleanup_index.sql`

```sql
CREATE INDEX idx_seats_status_hold_expires_at
ON public.seats(status, hold_expires_at)
WHERE status = 'temporarily_held' AND deleted_at IS NULL;
```

**효과**:
- 조회 성능 향상
- 대량 데이터 환경에서 효율적인 쿼리 실행

---

### 7. 테스트 코드
**파일**: `src/backend/jobs/__tests__/cleanup-expired-holds.test.ts`

**테스트 항목**:
- 성공 케이스 (만료 좌석 없음)
- 응답 구조 검증
- 만료 좌석 정보 검증
- 에러 처리

---

### 8. 문서
**파일**: `docs/cleanup-system.md`

**포함 내용**:
- 시스템 아키텍처
- 구현 상세 설명
- 환경 변수 설정 방법
- 사용 방법 (프로덕션/개발)
- 모니터링 및 디버깅
- 주의사항 및 향후 개선사항

---

## 🚀 사용 방법

### 프로덕션 (Vercel 배포)

1. **환경 변수 설정**:
   ```
   CRON_SECRET=<your-secret-key>
   SUPABASE_URL=<your-supabase-url>
   SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
   ```

2. **자동 실행**:
   배포 후 매 1분마다 자동으로 정리 작업 실행

### 개발 환경 (로컬)

**수동 트리거**:
```bash
curl -X POST http://localhost:3000/api/jobs/cleanup-expired-holds
```

**응답**:
```json
{
  "ok": true,
  "data": {
    "message": "Successfully cleaned up X expired seat holds",
    "clearedCount": X,
    "expiredSeats": [...]
  }
}
```

---

## 🔄 작동 흐름

```
1분마다 (Vercel Cron)
        ↓
/api/cron/cleanup-expired-holds
        ↓
Authorization 검증
        ↓
cleanupExpiredHolds() 호출
        ↓
Supabase 조회
  - status = 'temporarily_held'
  - hold_expires_at < now()
        ↓
상태 업데이트
  - status → 'available'
  - hold_expires_at → NULL
        ↓
결과 반환 & 로깅
```

---

## ✅ 체크리스트

- [x] 백그라운드 작업 로직 구현
- [x] Hono 라우터 통합
- [x] Cron Job 핸들러 구현
- [x] Vercel 설정 파일 생성
- [x] 데이터베이스 인덱스 추가
- [x] 테스트 코드 작성
- [x] 문서 작성
- [x] 타입 안정성 검증 (ts 에러 없음)

---

## 📊 마이그레이션 적용

Supabase에 마이그레이션 파일 적용:

```sql
-- 0011_create_cleanup_index.sql
CREATE INDEX IF NOT EXISTS idx_seats_status_hold_expires_at
ON public.seats(status, hold_expires_at)
WHERE status = 'temporarily_held' AND deleted_at IS NULL;
```

---

## 🔍 모니터링

### 로그 확인 위치

- **로컬**: 터미널 콘솔 출력
- **Vercel**: Function Logs (Deployments → Logs)

### 쿼리 테스트

```sql
-- 현재 만료된 선점 좌석 확인
SELECT id, label, concert_id, hold_expires_at
FROM seats
WHERE status = 'temporarily_held'
  AND hold_expires_at < now()
  AND deleted_at IS NULL;
```

---

## 🎯 다음 단계

1. **Vercel 배포**: vercel.json 포함하여 배포
2. **환경 변수 설정**: Vercel 프로젝트 설정에서 CRON_SECRET 추가
3. **마이그레이션 적용**: Supabase 대시보드에서 마이그레이션 실행
4. **모니터링**: Function Logs에서 작업 실행 확인
5. **테스트**: 수동 API 호출로 기능 검증

---

## 📚 관련 문서

- `docs/cleanup-system.md` - 상세 시스템 문서
- `docs/002/spec.md` - 좌석 선택 및 임시 선점 명세
- `docs/database.md` - 데이터베이스 스키마
