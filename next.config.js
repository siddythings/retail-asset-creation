/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      }
    ],
    domains: [
      'aem.johnnywas.com', 
      'i.ibb.co', 
      'localhost', 
      '127.0.0.1',
      'storage.googleapis.com',
      'cdn.leonardo.ai',
      'replicate.delivery',
      'i.ibb.co'
    ],
  },
};

module.exports = nextConfig;
