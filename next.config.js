/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Allow external access for development and production
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
        ],
      },
      // PWA and mobile optimization headers
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
      // Cache static assets
      {
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  // MOST ROBUST CONFIGURATION:
  // - Apps load from Vercel server (always latest code)
  // - No standalone mode needed (Vercel uses serverless)
  // - API routes work perfectly (they're on the server)
  // - No need to rebuild native apps for code changes
  trailingSlash: false,
  // Don't use standalone mode - Vercel handles deployment
  // Apps connect to Vercel server, ensuring always latest code
  // PWA and mobile optimizations
  // experimental: {
  //   optimizeCss: true,
  // },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };
    return config;
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig

