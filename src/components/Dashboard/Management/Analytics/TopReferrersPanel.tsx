import { Paper, Typography, Box, Skeleton, Chip, Tooltip } from "@mui/material";
import { formatNumber } from "./utils";

export interface ReferrerData {
    referrer: string;
    views: number;
}

export interface TopReferrersPanelProps {
    data: ReferrerData[];
    loading?: boolean;
}

export function TopReferrersPanel({ data, loading }: TopReferrersPanelProps) {
    return (
        <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                Top Referrers
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
                    No referrer data available - most traffic is direct
                </Typography>
            ) : (
                <Box>
                    {data.slice(0, 5).map((ref, index) => (
                        <Box
                            key={ref.referrer}
                            sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                py: 1,
                                borderBottom:
                                    index < data.length - 1
                                        ? "1px solid #eee"
                                        : "none",
                            }}
                        >
                            <Tooltip title={ref.referrer}>
                                <Typography
                                    variant="body2"
                                    sx={{
                                        maxWidth: 200,
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    {ref.referrer}
                                </Typography>
                            </Tooltip>
                            <Chip
                                label={formatNumber(ref.views)}
                                size="small"
                                variant="outlined"
                            />
                        </Box>
                    ))}
                </Box>
            )}
        </Paper>
    );
}
