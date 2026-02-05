import { Box, Card, CardContent, Skeleton, Typography } from "@mui/material";
import { formatNumber } from "./utils";

export interface StatCardProps {
    title: string;
    value: number | string;
    icon: React.ReactNode;
    color: string;
    loading?: boolean;
    subtitle?: string;
}

export function StatCard({
    title,
    value,
    icon,
    color,
    loading,
    subtitle,
}: StatCardProps) {
    return (
        <Card elevation={2} sx={{ height: "100%" }}>
            <CardContent>
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                    }}
                >
                    <Box>
                        <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ textTransform: "uppercase", fontWeight: 600 }}
                        >
                            {title}
                        </Typography>
                        {loading ? (
                            <Skeleton variant="text" width={80} height={40} />
                        ) : (
                            <Typography
                                variant="h4"
                                fontWeight={700}
                                sx={{ color }}
                            >
                                {typeof value === "number"
                                    ? formatNumber(value)
                                    : value}
                            </Typography>
                        )}
                        {subtitle && (
                            <Typography
                                variant="caption"
                                color="text.secondary"
                            >
                                {subtitle}
                            </Typography>
                        )}
                    </Box>
                    <Box
                        sx={{
                            backgroundColor: `${color}20`,
                            borderRadius: 2,
                            p: 1.5,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <Box sx={{ color }}>{icon}</Box>
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );
}
