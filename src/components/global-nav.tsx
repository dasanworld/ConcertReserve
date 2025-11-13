"use client";

import { useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Music, Search } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";

export function GlobalNav() {
  const { user, isAuthenticated, isLoading } = useCurrentUser();
  const router = useRouter();

  const handleSignOut = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.refresh();
  }, [router]);

  const navContent = useMemo(() => {
    return (
      <div className="flex items-center gap-6">
        {/* 콘서트 링크 */}
        <Link
          href="/"
          className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
        >
          <Music className="h-4 w-4" />
          콘서트
        </Link>

        {/* 예약조회 링크 */}
        <Link
          href="/reservations/lookup"
          className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
        >
          <Search className="h-4 w-4" />
          예약조회
        </Link>

        {/* 로그인 정보 */}
        <div className="h-6 w-px bg-gray-300" />

        {isLoading ? (
          <span className="text-sm text-gray-500">로딩 중...</span>
        ) : isAuthenticated && user ? (
          <div className="flex items-center gap-3">
            <span className="truncate text-sm text-gray-600">
              {user.email ?? "사용자"}
            </span>
            <button
              type="button"
              onClick={handleSignOut}
              className="flex items-center gap-1 rounded-lg bg-red-50 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-100"
            >
              <LogOut className="h-4 w-4" />
              로그아웃
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-100"
            >
              로그인
            </Link>
            <Link
              href="/signup"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              회원가입
            </Link>
          </div>
        )}
      </div>
    );
  }, [handleSignOut, isAuthenticated, isLoading, user]);

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur-sm shadow-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        {/* 로고 */}
        <Link
          href="/"
          className="text-lg font-bold text-blue-600 transition hover:text-blue-700"
        >
          🎵 콘서트 예약
        </Link>

        {/* 네비게이션 아이템 */}
        {navContent}
      </div>
    </nav>
  );
}
