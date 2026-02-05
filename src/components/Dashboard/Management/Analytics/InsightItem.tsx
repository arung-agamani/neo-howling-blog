import { Box, Typography, LinearProgress } from "@mui/material";
import { formatNumber } from "./utils";

export interface InsightItemProps {
    label: string;
    value: number;
    total: number;
    color: string;
}

export function InsightItem({ label, value, total, color }: InsightItemProps) {
    const percentage = total > 0 ? (value / total) * 100 : 0;
    return (
        <Box sx={{ mb: 2 }}>
            <Box
                sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 0.5,
                }}
            >
                <Typography variant="body2" fontWeight={500}>
                    {label}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    {formatNumber(value)} ({percentage.toFixed(1)}%)
                </Typography>
            </Box>
            <LinearProgress
                variant="determinate"
                value={percentage}
                sx={{
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: `${color}30`,
                    "& .MuiLinearProgress-bar": {
                        backgroundColor: color,
                        borderRadius: 4,
                    },
                }}
            />
        </Box>
    );
}
