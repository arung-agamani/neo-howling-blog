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

module.exports = nextConfig;
