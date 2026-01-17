import React from "react";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Skeleton from "@mui/material/Skeleton";
import ArticleIcon from "@mui/icons-material/Article";
import CodeIcon from "@mui/icons-material/Code";
import ImageIcon from "@mui/icons-material/Image";
import { useQuery } from "@tanstack/react-query";
import axios from "@/utils/axios";

interface StatCardProps {
    title: string;
    value: number;
    icon: React.ReactNode;
    color: string;
    isLoading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({
    title,
    value,
    icon,
    color,
    isLoading,
}) => {
    return (
        <Paper
            elevation={0}
            sx={{
                p: 3,
                borderRadius: 2,
                border: "1px solid",
                borderColor: "grey.200",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                transition: "all 0.2s ease-in-out",
                "&:hover": {
                    borderColor: color,
                    boxShadow: `0 4px 12px ${color}20`,
                },
            }}
        >
            <Box
                sx={{
                    width: 56,
                    height: 56,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: `${color}15`,
                    color: color,
                    mb: 2,
                }}
            >
                {icon}
            </Box>
            {isLoading ? (
                <Skeleton variant="text" width={60} height={40} />
            ) : (
                <Typography
                    variant="h4"
                    fontWeight={700}
                    sx={{ color: "text.primary" }}
                >
                    {value}
                </Typography>
            )}
            <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.5 }}
            >
                {title}
            </Typography>
        </Paper>
    );
};

interface UserStatsProps {
    userId: string;
}

interface UserStatsData {
    postsCount: number;
    snippetsCount: number;
    assetsCount: number;
}

const UserStats: React.FC<UserStatsProps> = ({ userId }) => {
    const { data: stats, isLoading } = useQuery<UserStatsData>({
        queryKey: ["userStats", userId],
        queryFn: async () => {
            try {
                // Fetch counts from various endpoints
                const [postsRes, snippetsRes, assetsRes] = await Promise.all([
                    axios.get("/api/v1/posts").catch(() => ({ data: { data: [] } })),
                    axios.get("/api/v1/snippets").catch(() => ({ data: { data: [] } })),
                    axios.get("/api/v1/assets").catch(() => ({ data: { assets: [] } })),
                ]);

                // For now, count all items (in a real app, you'd filter by userId)
                const postsCount = postsRes.data?.data?.length || 0;
                const snippetsCount = snippetsRes.data?.data?.length || 0;
                const assetsCount = assetsRes.data?.assets?.length || 0;

                return {
                    postsCount,
                    snippetsCount,
                    assetsCount,
                };
            } catch (error) {
                console.error("Error fetching user stats:", error);
                return {
                    postsCount: 0,
                    snippetsCount: 0,
                    assetsCount: 0,
                };
            }
        },
        refetchOnWindowFocus: false,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    return (
        <Box>
            <Grid container spacing={3}>
                <Grid item xs={12} sm={4}>
                    <StatCard
                        title="Posts"
                        value={stats?.postsCount || 0}
                        icon={<ArticleIcon sx={{ fontSize: 28 }} />}
                        color="#2196f3"
                        isLoading={isLoading}
                    />
                </Grid>
                <Grid item xs={12} sm={4}>
                    <StatCard
                        title="Snippets"
                        value={stats?.snippetsCount || 0}
                        icon={<CodeIcon sx={{ fontSize: 28 }} />}
                        color="#9c27b0"
                        isLoading={isLoading}
                    />
                </Grid>
                <Grid item xs={12} sm={4}>
                    <StatCard
                        title="Assets"
                        value={stats?.assetsCount || 0}
                        icon={<ImageIcon sx={{ fontSize: 28 }} />}
                        color="#4caf50"
                        isLoading={isLoading}
                    />
                </Grid>
            </Grid>

            <Box sx={{ mt: 2, textAlign: "center" }}>
                <Typography variant="body2" color="text.secondary">
                    Your content contribution overview
                </Typography>
            </Box>
        </Box>
    );
};

export default UserStats;
