import { Box, Paper, Typography } from "@mui/material";
import type { ApiKey } from "./types";

export interface SummaryStatsProps {
    apiKeys: ApiKey[];
}

export function SummaryStats({ apiKeys }: SummaryStatsProps) {
    const activeKeys = apiKeys.filter((k) => k.isActive);
    const revokedKeys = apiKeys.filter((k) => !k.isActive);
    const totalUsage = apiKeys.reduce((sum, k) => sum + k.usageCount, 0);

    return (
        <Box display="flex" gap={3} mb={3} flexWrap="wrap">
            <Paper variant="outlined" sx={{ px: 3, py: 1.5 }}>
                <Typography variant="caption" color="text.secondary">
                    Total Keys
                </Typography>
                <Typography variant="h6">{apiKeys.length}</Typography>
            </Paper>
            <Paper variant="outlined" sx={{ px: 3, py: 1.5 }}>
                <Typography variant="caption" color="text.secondary">
                    Active
                </Typography>
                <Typography variant="h6" color="success.main">
                    {activeKeys.length}
                </Typography>
            </Paper>
            <Paper variant="outlined" sx={{ px: 3, py: 1.5 }}>
                <Typography variant="caption" color="text.secondary">
                    Revoked
                </Typography>
                <Typography variant="h6" color="error.main">
                    {revokedKeys.length}
                </Typography>
            </Paper>
            <Paper variant="outlined" sx={{ px: 3, py: 1.5 }}>
                <Typography variant="caption" color="text.secondary">
                    Total Usage
                </Typography>
                <Typography variant="h6">
                    {totalUsage.toLocaleString()}
                </Typography>
            </Paper>
        </Box>
    );
}
