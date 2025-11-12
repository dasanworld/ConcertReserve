# 콘서트 좌석 예약 시스템

비회원 기반의 콘서트 좌석 예약 시스템입니다. 동시 접속 환경에서 좌석 중복 예약을 방지하는 안정적인 선점 처리 로직과 직관적인 UI/UX를 제공합니다.

## 📋 목차

- [주요 기능](#주요-기능)
- [기술 스택](#기술-스택)
- [프로젝트 구조](#프로젝트-구조)
- [시작하기](#시작하기)
- [환경 변수 설정](#환경-변수-설정)
- [데이터베이스 설정](#데이터베이스-설정)
- [개발 가이드](#개발-가이드)
- [주요 기능 설명](#주요-기능-설명)

## 🎯 주요 기능

### 예매자 기능
- **콘서트 탐색**: 예약 가능한 콘서트 목록 조회
- **좌석 선택**: 실시간 좌석 현황 확인 및 선택
- **임시 선점**: 좌석 선택 시 5분간 임시 선점 (다른 사용자 선택 불가)
- **예약 확정**: 예약자 정보 입력 후 예약 완료
- **예약 조회**: 휴대폰 번호와 비밀번호로 예약 내역 조회
- **예약 취소**: 예약 내역 취소

### 핵심 정책
- **좌석 선점 시스템**: 좌석 선택 시 5분간 임시 선점 상태로 변경
- **중복 예약 방지**: 트랜잭션 기반 안전한 좌석 예약 처리
- **실시간 좌석 현황**: 잔여 좌석 수 실시간 업데이트
- **비회원 예약**: 별도 회원가입 없이 빠른 예약 가능

## 🛠 기술 스택

### Frontend
- **Next.js 15** - React 프레임워크 (App Router)
- **TypeScript** - 타입 안정성
- **React 19** - UI 라이브러리
- **Tailwind CSS 4** - 유틸리티 기반 CSS
- **Shadcn UI** - 접근성 높은 UI 컴포넌트
- **Lucide React** - 아이콘 라이브러리

### State Management
- **@tanstack/react-query** - 서버 상태 관리
- **Zustand** - 클라이언트 전역 상태 관리
- **React Hook Form** - 폼 상태 관리

### Backend
- **Hono** - 빠르고 가벼운 웹 프레임워크
- **Supabase** - 백엔드 as a Service (PostgreSQL)
- **Zod** - 스키마 검증

### Utilities
- **date-fns** - 날짜/시간 처리
- **ts-pattern** - 패턴 매칭
- **es-toolkit** - 유틸리티 함수
- **axios** - HTTP 클라이언트

## 📁 프로젝트 구조

```
02_01ConcertReserve/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (protected)/        # 인증 필요 페이지
│   │   ├── api/                 # API 라우트
│   │   │   └── [[...hono]]/    # Hono 엔트리포인트
│   │   ├── login/               # 로그인 페이지
│   │   ├── signup/              # 회원가입 페이지
│   │   └── page.tsx             # 홈 페이지
│   │
│   ├── backend/                # 백엔드 레이어
│   │   ├── hono/               # Hono 앱 설정
│   │   ├── middleware/         # 공통 미들웨어
│   │   ├── http/               # HTTP 응답 헬퍼
│   │   ├── supabase/            # Supabase 클라이언트
│   │   └── config/              # 환경 변수 설정
│   │
│   ├── features/               # 기능별 모듈
│   │   ├── auth/               # 인증 기능
│   │   └── [feature]/          # 각 기능 모듈
│   │       ├── backend/        # 백엔드 로직
│   │       │   ├── route.ts    # Hono 라우터
│   │       │   ├── service.ts  # 비즈니스 로직
│   │       │   ├── schema.ts  # Zod 스키마
│   │       │   └── error.ts    # 에러 코드
│   │       ├── components/     # React 컴포넌트
│   │       ├── hooks/          # React Query 훅
│   │       └── lib/            # DTO 재노출
│   │
│   ├── components/              # 공통 컴포넌트
│   │   └── ui/                 # Shadcn UI 컴포넌트
│   │
│   ├── lib/                    # 유틸리티
│   │   ├── remote/             # API 클라이언트
│   │   └── supabase/           # Supabase 클라이언트
│   │
│   └── constants/              # 상수 정의
│
├── supabase/
│   └── migrations/             # Supabase 마이그레이션 파일
│
├── docs/                       # 문서
│   ├── prd.md                 # 제품 요구사항
│   └── userflow.md            # 사용자 플로우
│
└── public/                     # 정적 파일
```

## 🚀 시작하기

### 사전 요구사항

- Node.js 20 이상
- npm, yarn, pnpm 중 하나
- Supabase 계정 및 프로젝트

### 설치

1. **저장소 클론**

```bash
git clone <repository-url>
cd 02_01ConcertReserve
```

2. **의존성 설치**

```bash
npm install
# 또는
yarn install
# 또는
pnpm install
```

3. **환경 변수 설정**

`.env.local` 파일을 생성하고 필요한 환경 변수를 설정합니다. (자세한 내용은 [환경 변수 설정](#환경-변수-설정) 참조)

4. **개발 서버 실행**

```bash
npm run dev
# 또는
yarn dev
# 또는
pnpm dev
```

개발 서버가 실행되면 [http://localhost:3000](http://localhost:3000)에서 애플리케이션을 확인할 수 있습니다.

### 빌드

```bash
npm run build
npm run start
```

### 린트

```bash
npm run lint
```

## ⚙️ 환경 변수 설정

`.env.local` 파일을 프로젝트 루트에 생성하고 다음 변수들을 설정하세요:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 환경 변수 설명

- `NEXT_PUBLIC_SUPABASE_URL`: Supabase 프로젝트 URL (클라이언트에서 사용)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase Anon Key (클라이언트에서 사용)
- `SUPABASE_URL`: Supabase 프로젝트 URL (서버에서 사용)
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase Service Role Key (서버 전용, 절대 클라이언트에 노출 금지)

> ⚠️ **보안 주의**: `SUPABASE_SERVICE_ROLE_KEY`는 서버 환경에서만 사용되며, 클라이언트 코드에 포함되면 안 됩니다.

## 🗄 데이터베이스 설정

### Supabase 마이그레이션 적용

1. Supabase 대시보드에 접속
2. SQL Editor로 이동
3. `supabase/migrations/` 디렉토리의 SQL 파일들을 순서대로 실행

예시:

```sql
-- supabase/migrations/0001_create_example_table.sql
-- 파일 내용을 Supabase SQL Editor에 붙여넣고 실행
```

### 마이그레이션 파일 작성 가이드

- 각 마이그레이션 파일은 고유한 번호 접두사를 가져야 합니다 (예: `0001_`, `0002_`)
- `CREATE TABLE IF NOT EXISTS` 사용으로 멱등성 보장
- 모든 테이블에 `updated_at` 컬럼 추가 및 자동 업데이트 트리거 설정
- RLS(Row Level Security)는 비활성화 (프로젝트 정책에 따라)

자세한 내용은 `.ruler/supabase.md`를 참조하세요.

## 💻 개발 가이드

### 백엔드 개발 (Hono)

#### 라우터 추가

새로운 기능의 라우터를 추가하려면:

1. `src/features/[feature]/backend/route.ts`에 라우터 정의
2. `src/features/[feature]/backend/schema.ts`에 Zod 스키마 정의
3. `src/features/[feature]/backend/service.ts`에 비즈니스 로직 구현
4. `src/backend/hono/app.ts`에서 라우터 등록

예시:

```typescript
// src/features/concert/backend/route.ts
import { Hono } from 'hono';
import type { AppEnv } from '@/backend/hono/context';
import { registerConcertRoutes } from './route';

export function registerConcertRoutes(app: Hono<AppEnv>) {
  app.get('/api/concerts', async (c) => {
    // 라우터 로직
  });
}
```

#### 공통 응답 패턴

모든 API는 `src/backend/http/response.ts`의 헬퍼 함수를 사용합니다:

```typescript
import { success, failure, respond } from '@/backend/http/response';

// 성공 응답
return respond(c, success(data));

// 실패 응답
return respond(c, failure(400, 'ERROR_CODE', '에러 메시지'));
```

### 프론트엔드 개발

#### React Query 훅 사용

서버 상태 관리는 React Query를 통해 수행합니다:

```typescript
// src/features/concert/hooks/useConcertQuery.ts
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';

export function useConcertQuery(concertId: string) {
  return useQuery({
    queryKey: ['concert', concertId],
    queryFn: () => apiClient.get(`/api/concerts/${concertId}`),
  });
}
```

#### 컴포넌트 작성 규칙

- 모든 컴포넌트는 Client Component (`"use client"`)로 작성
- Shadcn UI 컴포넌트를 우선 사용
- Tailwind CSS로 스타일링

### 코드 스타일

- TypeScript 타입 안정성 최우선
- 함수형 프로그래밍 패러다임
- Early return 패턴 사용
- 명확한 변수명과 함수명
- 불필요한 주석 최소화 (코드 자체가 설명)

## 📖 주요 기능 설명

### 좌석 선점 시스템

사용자가 좌석을 선택하면:

1. 좌석 상태가 `available` → `temporarily_held`로 변경
2. `hold_expires_at` 필드에 현재 시각 + 5분 기록
3. 5분 내 예약 완료하지 않으면 자동으로 `available`로 복귀
4. 다른 사용자는 `temporarily_held` 또는 `reserved` 상태의 좌석 선택 불가

### 예약 프로세스

1. **좌석 선택**: 좌석 배치도에서 좌석 선택
2. **임시 선점**: 선택한 좌석이 5분간 선점됨
3. **예약 정보 입력**: 예약자 정보(이름, 휴대폰, 비밀번호) 입력
4. **예약 확정**: 트랜잭션으로 예약 생성 및 좌석 상태 변경
5. **예약 완료**: 예약 번호 발급 및 완료 페이지 표시

### 예약 조회 및 취소

- 휴대폰 번호와 비밀번호로 예약 내역 조회
- 예약 취소 시 연결된 좌석들이 `available` 상태로 복귀
- 소프트 삭제 방식으로 예약 내역 보존

## 📚 추가 문서

- [PRD (제품 요구사항)](docs/prd.md)
- [Userflow (사용자 플로우)](docs/userflow.md)
- [Database Schema](docs/database.md)

## 🤝 기여

이 프로젝트는 학습 및 포트폴리오 목적으로 개발되었습니다.

## 📄 라이선스

이 프로젝트는 개인 프로젝트입니다.

---

**Made with ❤️ using Next.js, Supabase, and Hono**
