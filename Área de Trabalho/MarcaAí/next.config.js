/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    turbo: {
      root: process.cwd(),
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'mmgeywupyemloqdojhcs.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
}

module.exports = nextConfig
