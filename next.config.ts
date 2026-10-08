import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets a phone on the same Wi-Fi open the dev server via this PC's IP
  // address (e.g. http://192.168.100.196:3000). Development only.
  allowedDevOrigins: ["192.168.*.*"],
  // Serve images as-is. Our mascot/logo files are already small, and skipping
  // on-demand optimization means they appear instantly during the demo.
  images: { unoptimized: true },
  // Hide the Next.js dev badge (bottom-left) so it doesn't cover the Demo button
  devIndicators: false,
};

export default nextConfig;
