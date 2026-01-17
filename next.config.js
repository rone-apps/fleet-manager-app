/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Increase timeout for API routes (default is 60 seconds)
  experimental: {
    proxyTimeout: 300000, // 5 minutes in milliseconds
  },
  // Increase body size limit for file uploads
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
    responseLimit: false,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.NEXT_PUBLIC_API_BASE_URL 
          ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/:path*`
          : 'http://localhost:8080/api/:path*',
      },
    ];
  },
  // Increase HTTP agent keepalive timeout
  httpAgentOptions: {
    keepAlive: true,
  },
};

module.exports = nextConfig;
