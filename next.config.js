/** @type {import('next').NextConfig} */
const nextConfig = {
  // 1. تجاوز أخطاء ESLint و TypeScript أثناء الـ Build على Vercel
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },

  // 2. إعدادات الصور
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },

  // 3. دعم الحزم الخارجية مثل puppeteer
  serverExternalPackages: ['puppeteer'],

  // 4. إعدادات الـ Headers الأمنية
  async headers() {
    return [{
      source: '/(.*)',
      headers: [
        { key: 'X-Content-Type-Options',         value: 'nosniff' },
        { key: 'X-Frame-Options',                 value: 'SAMEORIGIN' },
        { key: 'X-XSS-Protection',               value: '1; mode=block' },
        { key: 'Referrer-Policy',                 value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy',              value: 'camera=(), microphone=(), geolocation=()' },
        { key: 'Strict-Transport-Security',       value: 'max-age=63072000; includeSubDomains; preload' },
      ],
    }];
  },
};

module.exports = nextConfig;
