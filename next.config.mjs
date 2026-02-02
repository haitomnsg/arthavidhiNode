/** @type {import('next').NextConfig} */
const nextConfig = {
  /* Production optimizations for cPanel deployment */
  
  // Output as standalone for easier cPanel deployment
  output: 'standalone',
  
  // Disable powered-by header for security
  poweredByHeader: false,
  
  // Generate ETags for caching
  generateEtags: true,
  
  // Compress responses
  compress: true,
  
  // Production source maps (disable to reduce build size and memory)
  productionBrowserSourceMaps: false,
  
  typescript: {
    // Keep this during migration, but consider removing for strict type safety
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  images: {
    // Disable image optimization for cPanel (no native sharp support)
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  
  // Experimental features for better performance
  experimental: {
    // Enable optimized package imports to reduce bundle size
    optimizePackageImports: ['lucide-react', 'date-fns', 'recharts'],
    // Server external packages that should not be bundled (Next.js 14 syntax)
    serverComponentsExternalPackages: ['mysql2', 'bcryptjs'],
  },
  
  // Webpack configuration for production
  webpack: (config, { isServer }) => {
    // Handle node modules that may cause issues in serverless
    if (isServer) {
      config.externals.push({
        'mysql2': 'commonjs mysql2',
      });
    }
    
    // Reduce memory usage during build
    config.optimization = {
      ...config.optimization,
      minimize: true,
    };
    
    // Suppress certain warnings
    config.ignoreWarnings = [
      { module: /node_modules\/node-fetch/ },
      { module: /node_modules\/punycode/ },
    ];
    
    return config;
  },
  
  // Environment variables to expose to the client (only non-sensitive ones)
  env: {
    APP_NAME: 'ArthaVidhi',
    APP_VERSION: process.env.npm_package_version || '0.1.0',
  },
  
  // Headers for security and caching
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
      {
        // Cache static assets
        source: '/uploads/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
