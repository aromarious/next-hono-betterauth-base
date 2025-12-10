await import("./env.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@packages/ui"],
};

export default nextConfig;
