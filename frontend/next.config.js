/** @type {import('next').NextConfig} */
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone", // Required for correct Docker deployment
  images: {
    domains: ["urpak.kg"], // Add your domain here!
  },
};

module.exports = nextConfig;
