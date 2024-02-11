const withBundleAnalyzer = require("@next/bundle-analyzer")({
    enabled: process.env.ANALYZE === "true",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "files.howlingmoon.dev",
                port: "",
                pathname: "/blog/**",
            },
        ],
    },
};

module.exports = withBundleAnalyzer(nextConfig);
