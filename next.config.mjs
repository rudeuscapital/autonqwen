/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  serverExternalPackages: ["better-sqlite3", "xlsx"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "pbs.twimg.com" },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "12mb",
      allowedOrigins: [
        "localhost:3000",
        process.env.DOMAIN || "",
      ].filter(Boolean),
    },
  },
};

export default nextConfig;
