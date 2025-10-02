// eslint-disable-next-line @typescript-eslint/no-var-requires
const withBundleAnalyzer = require("@next/bundle-analyzer")({
    enabled: process.env.ANALYZE === "true",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
    experimental: {
        optimizePackageImports: ["@mui/material", "@mui/icons-material"],
    },
    // webpack: (config) => {
    //     config.optimization.splitChunks.chunks = "all";
    //     return config;
    // },
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "files.howlingmoon.dev",
                port: "",
                pathname: "/blog/**",
            },
            {
                protocol: "https",
                hostname: "avatars.githubusercontent.com",
                port: "",
            },
        ],
    },
};

module.exports = withBundleAnalyzer(nextConfig);
