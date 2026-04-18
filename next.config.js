/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    // MetaMask SDK and WalletConnect's logger both reference optional deps
    // we never use in a browser build. Stub them out so they don't log.
    config.externals = [
      ...(config.externals || []),
      "pino-pretty",
      "@react-native-async-storage/async-storage",
    ];
    return config;
  },
};

module.exports = nextConfig;
