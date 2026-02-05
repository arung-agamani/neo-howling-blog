import { Paper, Typography, Box, Skeleton } from "@mui/material";
import { InsightItem } from "./InsightItem";
import { COLORS } from "./utils";

export interface OSData {
    os: string;
    views: number;
}

export interface OSBreakdownPanelProps {
    data: OSData[];
    totalViews: number;
    loading?: boolean;
}

export function OSBreakdownPanel({
    data,
    totalViews,
    loading,
}: OSBreakdownPanelProps) {
    return (
        <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                Operating Systems
            </Typography>
            {loading ? (
                <Box>
                    {[1, 2, 3].map((i) => (
                        <Skeleton
                            key={i}
                            variant="rectangular"
                            height={32}
                            sx={{ mb: 1 }}
                        />
                    ))}
                </Box>
            ) : data.length === 0 ? (
                <Typography color="text.secondary" variant="body2">
                    No OS data available
                </Typography>
            ) : (
                data.slice(0, 5).map((os, index) => (
                    <InsightItem
                        key={os.os}
                        label={os.os}
                        value={os.views}
                        total={totalViews}
                        color={COLORS[(index + 3) % COLORS.length]}
                    />
                ))
            )}
        </Paper>
    );
}
