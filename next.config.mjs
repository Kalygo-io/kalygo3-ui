/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  // Externalize ws and its native dependencies to avoid webpack bundling issues
  serverExternalPackages: ["ws", "bufferutil", "utf-8-validate"],
};

export default nextConfig;
