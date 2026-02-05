import { Paper, Typography, Box, Skeleton } from "@mui/material";
import { Language } from "@mui/icons-material";
import { InsightItem } from "./InsightItem";
import { COLORS } from "./utils";

export interface BrowserData {
    browser: string;
    views: number;
}

export interface BrowserBreakdownPanelProps {
    data: BrowserData[];
    totalViews: number;
    loading?: boolean;
}

export function BrowserBreakdownPanel({
    data,
    totalViews,
    loading,
}: BrowserBreakdownPanelProps) {
    return (
        <Paper elevation={2} sx={{ p: 3 }}>
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    mb: 2,
                }}
            >
                <Language color="secondary" />
                <Typography variant="h6" fontWeight={600}>
                    Browser Usage
                </Typography>
            </Box>
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
                    No browser data available
                </Typography>
            ) : (
                data.slice(0, 5).map((browser, index) => (
                    <InsightItem
                        key={browser.browser}
                        label={browser.browser}
                        value={browser.views}
                        total={totalViews}
                        color={COLORS[index % COLORS.length]}
                    />
                ))
            )}
        </Paper>
    );
}
