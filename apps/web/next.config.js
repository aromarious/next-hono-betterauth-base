/** @type {import('next').NextConfig} */
const nextConfig = {
  // E2E用に別のビルドディレクトリを使用
  distDir: process.env.NEXT_E2E === "true" ? ".next-e2e" : ".next",
  serverExternalPackages: ["postgres"],
  transpilePackages: ["@packages/ui", "@packages/db"],
}

export default nextConfig
