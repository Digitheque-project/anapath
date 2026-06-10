import type { NextConfig } from "next";
import path from "path";

const backendUrl =
  process.env.API_PROXY_TARGET?.replace(/\/$/, "") ||
  "https://anapath-backend-ar7u.onrender.com";

const nextConfig: NextConfig = {
  // Corrige la détection de racine quand un package-lock.json existe dans le dossier utilisateur
  outputFileTracingRoot: path.join(process.cwd(), ".."),
  // Proxy /api → backend Render : évite les erreurs CORS depuis localhost:3000
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
