'use client';

/**
 * 예약 조회 폼 헤더 컴포넌트
 * 페이지 제목 및 안내 메시지 표시
 */
export const LookupFormHeader = () => {
  return (
    <div className="mb-8 space-y-2">
      <h1 className="text-3xl font-bold tracking-tight">예약 조회</h1>
      <p className="text-gray-600">
        예약 시 입력하신 휴대폰 번호와 비밀번호를 입력해주세요.
      </p>
    </div>
  );
};

