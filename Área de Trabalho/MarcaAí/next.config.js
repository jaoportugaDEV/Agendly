/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'mmgeywupyemloqdojhcs.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  experimental: {
    turbo: {
      root: process.cwd(),
    },
  },
}

module.exports = nextConfig
