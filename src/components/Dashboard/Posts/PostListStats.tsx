"use client";

import React from "react";
import { Box, Typography, Paper } from "@mui/material";

interface PostStats {
    total: number;
    published: number;
    draft: number;
    trash: number;
}

interface PostListStatsProps {
    stats: PostStats;
}

const PostListStats: React.FC<PostListStatsProps> = ({ stats }) => {
    const statItems = [
        {
            label: "Total Posts",
            value: stats.total,
            color: "primary",
        },
        {
            label: "Published",
            value: stats.published,
            color: "success",
        },
        {
            label: "Drafts",
            value: stats.draft,
            color: "warning",
        },
        {
            label: "Trash",
            value: stats.trash,
            color: "error",
        },
    ];

    return (
        <Box
            sx={{
                display: "grid",
                gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2, 1fr)",
                    md: "repeat(4, 1fr)",
                },
                gap: 2,
            }}
        >
            {statItems.map((item) => (
                <Paper
                    key={item.label}
                    elevation={0}
                    sx={{
                        p: 2,
                        textAlign: "center",
                        backgroundColor: "transparent",
                        border: "1px solid",
                        borderColor: "divider",
                        borderRadius: 1,
                    }}
                >
                    <Typography
                        variant="h4"
                        sx={{
                            color: `${item.color}.main`,
                            fontWeight: "bold",
                            mb: 0.5,
                        }}
                    >
                        {item.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {item.label}
                    </Typography>
                </Paper>
            ))}
        </Box>
    );
};

export default PostListStats;
