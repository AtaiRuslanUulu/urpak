/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    domains: ["urpak.kg", "api.urpak.kg"],
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
