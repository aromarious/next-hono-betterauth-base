/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@packages/ui", "@packages/db", "api"],
};

export default nextConfig;
