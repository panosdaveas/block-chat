
/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.fallback = {
      fs: false,
      path: false,
      stream: false,
      constants: false,
    };
    return config;
  },
};

export default nextConfig;
