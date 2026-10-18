import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Mastra (AI summary, specs/product-reviews.md) runs as plain Node.js modules
  serverExternalPackages: ["@mastra/*"],
  images: {
    // Product images imported from Amazon deals (specs/product.md)
    remotePatterns: [
      {
        protocol: "https",
        hostname: "m.media-amazon.com",
        pathname: "/images/**",
      },
    ],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    if (process.env.NODE_ENV !== "production") return [];
    // Vercel already serves HTTPS and redirects HTTP; HSTS makes browsers never use plain HTTP
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
