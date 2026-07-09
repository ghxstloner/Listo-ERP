import type { NextConfig } from "next";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
const apiUrlObj = new URL(apiUrl);

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: apiUrlObj.protocol.replace(":", "") as "http" | "https",
        hostname: apiUrlObj.hostname,
        port: apiUrlObj.port || "",
        pathname: "/uploads/**",
      },
    ],
  },
};

export default nextConfig;
