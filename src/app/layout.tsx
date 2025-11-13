import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";
import { loadCurrentUser } from "@/features/auth/server/load-current-user";
import { CurrentUserProvider } from "@/features/auth/context/current-user-context";
import { GlobalNav } from "@/components/global-nav";

// Force dynamic rendering for entire app
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: "콘서트 예약 시스템",
  description: "좌석 선택을 통한 콘서트 예약 시스템",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const currentUser = await loadCurrentUser();

  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="antialiased font-sans bg-gray-50 text-gray-900">
        <Providers>
          <CurrentUserProvider initialState={currentUser}>
            <GlobalNav />
            {children}
          </CurrentUserProvider>
        </Providers>
      </body>
    </html>
  );
}
