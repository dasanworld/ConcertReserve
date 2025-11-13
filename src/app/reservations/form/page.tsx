'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ReservationFormPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/book');
  }, [router]);

  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-2xl px-4 text-center text-gray-600">
        예약 정보 페이지가 이동되었습니다. 잠시 후 새로운 페이지로 이동합니다.
      </div>
    </main>
  );
}
