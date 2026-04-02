/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  // Moved from experimental.serverComponentsExternalPackages in Next.js 15
  serverExternalPackages: ["ws", "bufferutil", "utf-8-validate"],
  skipTrailingSlashRedirect: true,
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://us.i.posthog.com/:path*",
      },
    ];
  },
};

export default nextConfig;
