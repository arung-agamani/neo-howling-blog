"use client";

import { Card, CardContent, Typography, Chip } from "@mui/material";
import Link from "next/link";
import {
    ImageOutlined,
    FolderOutlined,
    ImageSearchOutlined,
} from "@mui/icons-material";

interface AssetCardProps {
    href: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    features: string[];
    bgColor: string;
    iconColor: string;
    chipColor: "primary" | "success" | "info";
}

const AssetCard: React.FC<AssetCardProps> = ({
    href,
    title,
    description,
    icon,
    features,
    bgColor,
    iconColor,
    chipColor,
}) => {
    return (
        <Link href={href} className="no-underline">
            <Card
                sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    border: "1px solid #e0e0e0",
                    backgroundColor: "#ffffff",
                    "&:hover": {
                        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
                        transform: "translateY(-6px)",
                        backgroundColor: "#f8f9fa",
                    },
                }}
            >
                <CardContent className="flex flex-col flex-1 pb-0">
                    {/* Icon Section */}
                    <div
                        className="flex items-center justify-center w-[70px] h-[70px] rounded-xl mb-2.5"
                        style={{ backgroundColor: bgColor }}
                    >
                        <div
                            className="flex text-4xl"
                            style={{ color: iconColor }}
                        >
                            {icon}
                        </div>
                    </div>

                    {/* Title */}
                    <Typography
                        variant="h6"
                        className="font-bold mb-1 text-lg"
                        sx={{ color: "#0d1b2a" }}
                    >
                        {title}
                    </Typography>

                    {/* Description */}
                    <Typography
                        variant="body2"
                        className="mb-2.5 leading-relaxed text-sm"
                        sx={{ color: "#3e4f5c" }}
                    >
                        {description}
                    </Typography>

                    <div className="flex-grow" />

                    {/* Features */}
                    <div className="flex gap-2 flex-wrap my-2">
                        {features.map((feature, index) => (
                            <Chip
                                key={index}
                                label={feature}
                                size="small"
                                color={chipColor}
                                variant="filled"
                                sx={{
                                    height: 28,
                                    fontSize: "0.75rem",
                                    fontWeight: 600,
                                    color: "#ffffff",
                                }}
                            />
                        ))}
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
};

const AssetsPage = () => {
    const assetCards: AssetCardProps[] = [
        {
            href: "assets/media",
            title: "Media Library",
            description:
                "Comprehensive media management system for storing, organizing, and accessing all your digital assets in one place.",
            icon: <ImageOutlined />,
            features: ["Images", "Videos", "Documents"],
            bgColor: "#e3f2fd",
            iconColor: "#1565c0",
            chipColor: "primary",
        },
        {
            href: "assets/browser",
            title: "Asset Browser",
            description:
                "Intuitive file manager for browsing, uploading, renaming, and managing your assets with ease.",
            icon: <FolderOutlined />,
            features: ["Upload", "Rename", "Delete"],
            bgColor: "#e8f5e9",
            iconColor: "#2e7d32",
            chipColor: "success",
        },
        {
            href: "assets/ogimage",
            title: "OG Image Generator",
            description:
                "Automatically generate optimized OpenGraph images for social media sharing and post headers.",
            icon: <ImageSearchOutlined />,
            features: ["Auto-Generate", "Social Media", "Custom"],
            bgColor: "#e0f2f1",
            iconColor: "#00796b",
            chipColor: "info",
        },
    ];

    return (
        <div className="w-full h-full bg-gray-50">
            {/* Header Section */}
            <div className="bg-white border-b-2 border-gray-200 px-3 py-4 sm:px-4">
                <Typography
                    variant="h4"
                    className="font-black mb-1"
                    sx={{ color: "#0d1b2a" }}
                >
                    Assets Management
                </Typography>
                <Typography
                    variant="body2"
                    className="mb-2 text-sm"
                    sx={{ color: "#5a6b77" }}
                >
                    Manage and organize your media, files, and visual content
                </Typography>
            </div>

            {/* Cards Grid Section */}
            <div className="px-3 py-4 sm:px-4">
                <Typography
                    variant="subtitle1"
                    className="mb-3 font-bold text-base"
                    sx={{ color: "#0d1b2a" }}
                >
                    Available Tools
                </Typography>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4 auto-rows-max">
                    {assetCards.map((card, index) => (
                        <div key={index} className="w-full">
                            <AssetCard {...card} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AssetsPage;
