import { Paper, Typography, Box, Skeleton } from "@mui/material";
import { Devices } from "@mui/icons-material";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { formatNumber } from "./utils";

export interface DeviceData {
    name: string;
    value: number;
    color: string;
}

export interface DeviceBreakdownPanelProps {
    data: DeviceData[];
    loading?: boolean;
}

export function DeviceBreakdownPanel({
    data,
    loading,
}: DeviceBreakdownPanelProps) {
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
                <Devices color="primary" />
                <Typography variant="h6" fontWeight={600}>
                    Device Breakdown
                </Typography>
            </Box>
            {loading ? (
                <Skeleton variant="rectangular" height={150} />
            ) : data.length === 0 ? (
                <Typography color="text.secondary" variant="body2">
                    No device data available
                </Typography>
            ) : (
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 2,
                    }}
                >
                    <ResponsiveContainer width="50%" height={150}>
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={35}
                                outerRadius={60}
                                paddingAngle={2}
                                dataKey="value"
                            >
                                {data.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={entry.color}
                                    />
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                    <Box sx={{ flex: 1 }}>
                        {data.map((device) => (
                            <Box
                                key={device.name}
                                sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                    mb: 1,
                                }}
                            >
                                <Box
                                    sx={{
                                        width: 12,
                                        height: 12,
                                        borderRadius: "50%",
                                        backgroundColor: device.color,
                                    }}
                                />
                                <Typography variant="body2">
                                    {device.name}
                                </Typography>
                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ ml: "auto" }}
                                >
                                    {formatNumber(device.value)}
                                </Typography>
                            </Box>
                        ))}
                    </Box>
                </Box>
            )}
        </Paper>
    );
}
