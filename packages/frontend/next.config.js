/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@compliant/shared'],
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
  async rewrites() {
    return {
      fallback: [
        {
          source: '/api/:path*',
          destination: process.env.API_BASE_URL ? `${process.env.API_BASE_URL}/api/:path*` : 'http://localhost:3001/api/:path*',
        },
      ],
    };
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'X-API-Version',
            value: '1',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
