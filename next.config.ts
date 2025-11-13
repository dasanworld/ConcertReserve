import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        hostname: '**',
      },
    ],
  },
  // API 라우트 지원 (Vercel에서 serverless function으로 배포)
  // 이 설정이 없으면 정적 내보내기가 되어 API 라우트가 작동하지 않음
  typescript: {
    // API 라우트가 있으므로 정적 내보내기 비활성화
  },
};

export default nextConfig;
