import { Paper, Typography, Box, Skeleton } from "@mui/material";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
} from "recharts";
import { formatNumber } from "./utils";

export interface ChartDataPoint {
    date: string;
    views: number;
    fullDate: string;
}

interface TrafficChartProps {
    data: ChartDataPoint[];
    loading?: boolean;
}

export function TrafficChart({ data, loading }: TrafficChartProps) {
    return (
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                Traffic Over Time
            </Typography>
            {loading ? (
                <Skeleton variant="rectangular" height={300} />
            ) : data.length === 0 ? (
                <Box
                    sx={{
                        height: 300,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <Typography color="text.secondary">
                        No traffic data available for this period
                    </Typography>
                </Box>
            ) : (
                <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={data}>
                        <defs>
                            <linearGradient
                                id="colorViews"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                            >
                                <stop
                                    offset="5%"
                                    stopColor="#2196F3"
                                    stopOpacity={0.8}
                                />
                                <stop
                                    offset="95%"
                                    stopColor="#2196F3"
                                    stopOpacity={0.1}
                                />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                            dataKey="date"
                            tick={{ fontSize: 12 }}
                            interval="preserveStartEnd"
                        />
                        <YAxis tick={{ fontSize: 12 }} />
                        <RechartsTooltip
                            contentStyle={{
                                backgroundColor: "#fff",
                                border: "1px solid #e0e0e0",
                                borderRadius: 8,
                            }}
                            formatter={(value) => [
                                formatNumber(value as number),
                                "Views",
                            ]}
                            labelFormatter={(label) => `Date: ${label}`}
                        />
                        <Area
                            type="monotone"
                            dataKey="views"
                            stroke="#2196F3"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorViews)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            )}
        </Paper>
    );
}
