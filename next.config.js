/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    domains: ['nyc.cloud.appwrite.io'], // Add Appwrite domain
  },
  // experimental: {
  //   serverActions: {
  //     // Allow both localhost and your dev tunnel during development
  //     allowedOrigins: ["http://localhost:3000"],
  //     allowedForwardedHosts: ["tp425636-3000.inc1.devtunnels.ms"],
  //   },
  // },
};

const { withSentryConfig } = require("@sentry/nextjs");

module.exports = withSentryConfig(
  nextConfig, // Pass the nextConfig object to Sentry
  {
    org: "carepulse-n4",
    project: "javascript-nextjs",
    silent: !process.env.CI,
    widenClientFileUpload: true,
    disableLogger: true,
    automaticVercelMonitors: true,
  }
);