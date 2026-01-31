"use client";

import React from "react";
import { Box, Paper, Typography, Skeleton, Chip } from "@mui/material";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";

interface TagStatsBarProps {
    total: number;
    active: number;
    orphaned: number;
    topTags?: { name: string; count: number }[];
    isLoading?: boolean;
    onOrphanedClick?: () => void;
}

interface StatCardProps {
    icon: React.ReactNode;
    label: string;
    value: number;
    color: string;
    onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({
    icon,
    label,
    value,
    color,
    onClick,
}) => (
    <Paper
        elevation={0}
        onClick={onClick}
        sx={{
            p: 2,
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            bgcolor: `${color}15`,
            border: `1px solid ${color}30`,
            borderRadius: 2,
            minWidth: 140,
            cursor: onClick ? "pointer" : "default",
            transition: "all 0.2s ease",
            "&:hover": onClick
                ? {
                      bgcolor: `${color}25`,
                      transform: "translateY(-1px)",
                  }
                : {},
        }}
    >
        <Box
            sx={{
                color: color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
            }}
        >
            {icon}
        </Box>
        <Box>
            <Typography
                variant="h6"
                fontWeight="bold"
                sx={{ color: color, lineHeight: 1.2 }}
            >
                {value}
            </Typography>
            <Typography
                variant="caption"
                color="text.secondary"
                sx={{ lineHeight: 1 }}
            >
                {label}
            </Typography>
        </Box>
    </Paper>
);

const TagStatsBar: React.FC<TagStatsBarProps> = ({
    total,
    active,
    orphaned,
    topTags = [],
    isLoading = false,
    onOrphanedClick,
}) => {
    if (isLoading) {
        return (
            <Box
                sx={{
                    display: "flex",
                    gap: 2,
                    flexWrap: "wrap",
                    mb: 3,
                }}
            >
                {[1, 2, 3].map((i) => (
                    <Skeleton
                        key={i}
                        variant="rounded"
                        width={160}
                        height={72}
                        sx={{ borderRadius: 2 }}
                    />
                ))}
            </Box>
        );
    }

    return (
        <Box sx={{ mb: 3 }}>
            {/* Stats Cards */}
            <Box
                sx={{
                    display: "flex",
                    gap: 2,
                    flexWrap: "wrap",
                    mb: 2,
                }}
            >
                <StatCard
                    icon={<LocalOfferIcon />}
                    label="Total Tags"
                    value={total}
                    color="#1976d2"
                />
                <StatCard
                    icon={<CheckCircleIcon />}
                    label="Active Tags"
                    value={active}
                    color="#2e7d32"
                />
                <StatCard
                    icon={<ErrorOutlineIcon />}
                    label="Orphaned Tags"
                    value={orphaned}
                    color={orphaned > 0 ? "#ed6c02" : "#757575"}
                    onClick={orphaned > 0 ? onOrphanedClick : undefined}
                />
            </Box>

            {/* Top Tags Quick View */}
            {topTags.length > 0 && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mr: 1 }}>
                        <TrendingUpIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                            Top:
                        </Typography>
                    </Box>
                    {topTags.slice(0, 8).map((tag) => (
                        <Chip
                            key={tag.name}
                            label={`${tag.name} (${tag.count})`}
                            size="small"
                            variant="outlined"
                            sx={{
                                fontSize: "0.75rem",
                                height: 24,
                            }}
                        />
                    ))}
                </Box>
            )}
        </Box>
    );
};

export default TagStatsBar;
