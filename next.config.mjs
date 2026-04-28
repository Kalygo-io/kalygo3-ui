/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  serverExternalPackages: ["ws", "bufferutil", "utf-8-validate"],
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
