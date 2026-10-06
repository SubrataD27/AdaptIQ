import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Pin the project root so a stray lockfile higher up the disk is never picked instead.
  turbopack: { root: dirname(fileURLToPath(import.meta.url)) },
};

export default nextConfig;
