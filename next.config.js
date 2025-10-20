/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Server components optimization
    serverComponentsExternalPackages: [
      "@anthropic-ai/sdk",
      "openai",
      "puppeteer",
      "cheerio",
      "pdf-parse",
      "mammoth",
    ],
  },

  // Image optimization for job logos and profile pictures
  images: {
    domains: [
      "via.placeholder.com",
      "images.unsplash.com",
      "lh3.googleusercontent.com",
      "media.licdn.com",
      "logo.clearbit.com",
    ],
    formats: ["image/webp", "image/avif"],
  },

  // Netlify deployment optimization
  output: "standalone",

  // Security headers
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
        ],
      },
    ];
  },

  // Disable x-powered-by header for security
  poweredByHeader: false,

  // Enable compression
  compress: true,

  // Optimize bundle size for AI libraries
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't bundle server-only packages in client
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        path: false,
        os: false,
        stream: false,
        child_process: false,
      };
    }

    // Optimize AI SDK bundles
    config.externals = config.externals || [];
    if (isServer) {
      config.externals.push("@anthropic-ai/sdk", "openai");
    }

    return config;
  },
};

module.exports = nextConfig;
