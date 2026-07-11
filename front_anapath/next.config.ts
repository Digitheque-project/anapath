import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Corrige la détection de racine quand un package-lock.json existe dans le dossier utilisateur
  outputFileTracingRoot: path.join(process.cwd(), ".."),
  // Note: /api/* est géré par app/api/[...path]/route.ts (proxy qui injecte le
  // token d'auth depuis le cookie httpOnly), pas par un rewrites() Next.js qui
  // ne peut pas ajouter de headers.
};

export default nextConfig;
