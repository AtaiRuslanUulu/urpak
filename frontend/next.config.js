/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    domains: ["urpak.kg", "api.urpak.kg","urpak.s3.eu-central-1.amazonaws.com",],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.urpak.kg',
        pathname: '/media/**',
      },
    ],
  },
};

module.exports = {
  images: {
    domains: ['urpak.s3.eu-central-1.amazonaws.com'],
  },
}
