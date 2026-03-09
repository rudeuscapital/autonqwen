/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  serverExternalPackages: ["better-sqlite3", "xlsx"],
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
