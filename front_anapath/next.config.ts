import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Corrige la détection de racine quand un package-lock.json existe dans le dossier utilisateur
  outputFileTracingRoot: path.join(process.cwd(), ".."),
};

export default nextConfig;
