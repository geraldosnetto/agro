import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable standalone output for Docker production
  output: "standalone",

  // Image optimization - restricted to known news sources
  images: {
    remotePatterns: [
      // Canal Rural
      { protocol: "https", hostname: "www.canalrural.com.br" },
      { protocol: "https", hostname: "*.canalrural.com.br" },
      // Agrolink
      { protocol: "https", hostname: "www.agrolink.com.br" },
      { protocol: "https", hostname: "*.agrolink.com.br" },
      // Globo Rural
      { protocol: "https", hostname: "*.globo.com" },
      { protocol: "https", hostname: "*.glbimg.com" },
      // Common CDNs used by news sites
      { protocol: "https", hostname: "*.cloudfront.net" },
      { protocol: "https", hostname: "*.amazonaws.com" },
      { protocol: "https", hostname: "*.googleusercontent.com" },
      // Placeholder images
      { protocol: "https", hostname: "placehold.co" },
      { protocol: "https", hostname: "via.placeholder.com" },
    ],
  },
};

export default nextConfig;
