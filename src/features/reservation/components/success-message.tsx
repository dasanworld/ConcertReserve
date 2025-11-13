"use client";

import { CheckCircle2 } from "lucide-react";

export const SuccessMessage = () => {
  return (
    <div className="flex flex-col items-center justify-center space-y-4 py-8">
      <div className="rounded-full bg-green-100 p-4">
        <CheckCircle2 className="h-12 w-12 text-green-600" />
      </div>
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">
          예약이 성공적으로 완료되었습니다!
        </h2>
        <p className="mt-2 text-gray-600">
          아래 예약 정보를 확인해주세요.
        </p>
      </div>
    </div>
  );
};
