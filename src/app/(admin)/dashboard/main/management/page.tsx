"use client";

import { Card, CardContent, Typography, Chip } from "@mui/material";
import Link from "next/link";
import TuneOutlinedIcon from "@mui/icons-material/TuneOutlined";
import PeopleOutlinedIcon from "@mui/icons-material/PeopleOutlined";
import BarChartOutlinedIcon from "@mui/icons-material/BarChartOutlined";
import VpnKeyOutlinedIcon from "@mui/icons-material/VpnKeyOutlined";
import WallpaperOutlinedIcon from "@mui/icons-material/WallpaperOutlined";

interface ManagementCardProps {
    href: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    features: string[];
    bgColor: string;
    iconColor: string;
    chipColor: "primary" | "success" | "info" | "warning" | "secondary";
}

const ManagementCard: React.FC<ManagementCardProps> = ({
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
                    {/* Icon */}
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

                    {/* Feature chips */}
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

const managementCards: ManagementCardProps[] = [
    {
        href: "management/config",
        title: "Global Configuration",
        description:
            "Control parameters and feature flags that change how the CMS behaves across the entire site.",
        icon: <TuneOutlinedIcon fontSize="inherit" />,
        features: ["Parameters", "Feature Flags", "JSON"],
        bgColor: "#e3f2fd",
        iconColor: "#1565c0",
        chipColor: "primary",
    },
    {
        href: "management/users",
        title: "User Management",
        description:
            "Create, update, and remove user accounts. Assign roles and control access permissions.",
        icon: <PeopleOutlinedIcon fontSize="inherit" />,
        features: ["Roles", "Permissions", "Accounts"],
        bgColor: "#e8f5e9",
        iconColor: "#2e7d32",
        chipColor: "success",
    },
    {
        href: "management/analytics",
        title: "Analytics",
        description:
            "Detailed site traffic, page views, and visitor insights to understand how your content is being consumed.",
        icon: <BarChartOutlinedIcon fontSize="inherit" />,
        features: ["Traffic", "Visitors", "Page Views"],
        bgColor: "#e0f2f1",
        iconColor: "#00796b",
        chipColor: "info",
    },
    {
        href: "management/api-keys",
        title: "API Keys",
        description:
            "Generate and revoke API keys for programmatic access to the v2 API from external services.",
        icon: <VpnKeyOutlinedIcon fontSize="inherit" />,
        features: ["Generate", "Revoke", "v2 API"],
        bgColor: "#fff8e1",
        iconColor: "#f57f17",
        chipColor: "warning",
    },
    {
        href: "management/gallery",
        title: "Gallery Configuration",
        description:
            "Customise the background and appearance of the public gallery page, including image backgrounds and overlays.",
        icon: <WallpaperOutlinedIcon fontSize="inherit" />,
        features: ["Background", "Image", "Overlay"],
        bgColor: "#f3e5f5",
        iconColor: "#6a1b9a",
        chipColor: "secondary",
    },
];

const ManagementPage = () => {
    return (
        <div className="w-full h-full bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b-2 border-gray-200 px-3 py-4 sm:px-4">
                <Typography
                    variant="h4"
                    className="font-black mb-1"
                    sx={{ color: "#0d1b2a" }}
                >
                    Management
                </Typography>
                <Typography
                    variant="body2"
                    className="mb-2 text-sm"
                    sx={{ color: "#5a6b77" }}
                >
                    Site-wide configuration, users, and administrative tools
                </Typography>
            </div>

            {/* Cards grid */}
            <div className="px-3 py-4 sm:px-4">
                <Typography
                    variant="subtitle1"
                    className="mb-3 font-bold text-base"
                    sx={{ color: "#0d1b2a" }}
                >
                    Available Tools
                </Typography>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4 auto-rows-max">
                    {managementCards.map((card, index) => (
                        <div key={index} className="w-full">
                            <ManagementCard {...card} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ManagementPage;
