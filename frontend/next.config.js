/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["127.0.0.1", "localhost", "urpak.kg"], // Add production domain
  },
  output: "standalone", // ✅ Needed for standalone Next.js deployment
  reactStrictMode: true,
};

module.exports = nextConfig;
