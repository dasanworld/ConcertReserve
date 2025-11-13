import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Vercel serverless deployment - NOT static export
  output: 'standalone',
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
};

export default nextConfig;
