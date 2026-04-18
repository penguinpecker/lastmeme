/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.externals = [
      ...(config.externals || []),
      "pino-pretty",
      "@react-native-async-storage/async-storage",
    ];
    return config;
  },
};

module.exports = nextConfig;
