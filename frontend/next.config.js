/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    domains: ['api.urpak.kg'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.urpak.kg',
        pathname: '/media/**',
      },
    ],
  },
};

module.exports = nextConfig;
