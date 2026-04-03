/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  allowedDevOrigins: ['*.replit.dev', '*.replit.app', '*.worf.replit.dev'],
}

module.exports = nextConfig
