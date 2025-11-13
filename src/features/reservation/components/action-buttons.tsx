"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Home, Search } from "lucide-react";

export const ActionButtons = () => {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
      <Button
        variant="outline"
        size="lg"
        onClick={() => router.push("/")}
        className="w-full sm:w-auto"
      >
        <Home className="mr-2 h-4 w-4" />
        홈으로 가기
      </Button>
      <Button
        variant="default"
        size="lg"
        onClick={() => router.push("/reservations/lookup")}
        className="w-full sm:w-auto"
      >
        <Search className="mr-2 h-4 w-4" />
        예약 조회하기
      </Button>
    </div>
  );
};
