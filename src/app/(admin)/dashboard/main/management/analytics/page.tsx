"use client";

import { useState } from "react";
import {
    Box,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Typography,
    Grid,
    Tooltip,
    IconButton,
} from "@mui/material";
import {
    TrendingUp,
    TrendingDown,
    Visibility,
    People,
    ArrowBack,
    Refresh,
} from "@mui/icons-material";
import Link from "next/link";
import { useAnalytics, AnalyticsPeriod } from "@/hooks/api/useAnalytics";
import {
    StatCard,
    TrafficChart,
    PageViewsTable,
    DeviceBreakdownPanel,
    BrowserBreakdownPanel,
    OSBreakdownPanel,
    TopReferrersPanel,
    PERIOD_OPTIONS,
    COLORS,
    formatDate,
} from "@/components/Dashboard/Management/Analytics";

export default function AnalyticsPage() {
    const [period, setPeriod] = useState<AnalyticsPeriod>("30d");
    const { data, isLoading, refetch, isFetching } = useAnalytics(period);

    const stats = data?.stats;
    const totalViews = stats?.totalViews ?? 0;
    const uniqueVisitors = stats?.uniqueVisitors ?? 0;
    const viewsPerVisitor =
        uniqueVisitors > 0 ? (totalViews / uniqueVisitors).toFixed(2) : "0";
    const bounceRate =
        uniqueVisitors > 0
            ? Math.max(0, 100 - (totalViews / uniqueVisitors - 1) * 20).toFixed(
                  1,
              )
            : "0";

    const chartData =
        stats?.viewsByDay.map((item) => ({
            date: formatDate(item.date),
            views: item.views,
            fullDate: item.date,
        })) ?? [];

    const topPagesData =
        stats?.topPages.map((page, index) => ({
            ...page,
            rank: index + 1,
            percentage:
                totalViews > 0
                    ? ((page.views / totalViews) * 100).toFixed(1)
                    : "0",
        })) ?? [];

    const deviceData =
        stats?.deviceBreakdown.map((item, index) => ({
            name: item.device.charAt(0).toUpperCase() + item.device.slice(1),
            value: item.views,
            color: COLORS[index % COLORS.length],
        })) ?? [];

    const browserData = stats?.browserBreakdown ?? [];
    const osData = stats?.osBreakdown ?? [];
    const referrerData = stats?.topReferrers ?? [];

    return (
        <Box sx={{ p: 3, backgroundColor: "#f5f5f5", minHeight: "100vh" }}>
            {/* Header */}
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    mb: 3,
                }}
            >
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Link href="/dashboard/main/management">
                        <IconButton>
                            <ArrowBack />
                        </IconButton>
                    </Link>
                    <Box>
                        <Typography variant="h4" fontWeight={700}>
                            Analytics
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Detailed insights about your site traffic and
                            visitor behavior
                        </Typography>
                    </Box>
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Tooltip title="Refresh data">
                        <IconButton
                            onClick={() => refetch()}
                            disabled={isFetching}
                        >
                            <Refresh
                                sx={{
                                    animation: isFetching
                                        ? "spin 1s linear infinite"
                                        : "none",
                                    "@keyframes spin": {
                                        "0%": { transform: "rotate(0deg)" },
                                        "100%": { transform: "rotate(360deg)" },
                                    },
                                }}
                            />
                        </IconButton>
                    </Tooltip>
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                        <InputLabel>Time Period</InputLabel>
                        <Select
                            value={period}
                            label="Time Period"
                            onChange={(e) =>
                                setPeriod(e.target.value as AnalyticsPeriod)
                            }
                        >
                            {PERIOD_OPTIONS.map((option) => (
                                <MenuItem
                                    key={option.value}
                                    value={option.value}
                                >
                                    {option.label}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>
            </Box>

            {/* Date Range Indicator */}
            {data?.dateRange && (
                <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mb: 2, display: "block" }}
                >
                    Showing data from{" "}
                    {new Date(data.dateRange.start).toLocaleDateString()} to{" "}
                    {new Date(data.dateRange.end).toLocaleDateString()}
                </Typography>
            )}

            {/* Key Metrics */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Total Page Views"
                        value={totalViews}
                        icon={<Visibility fontSize="large" />}
                        color="#2196F3"
                        loading={isLoading}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Unique Visitors"
                        value={uniqueVisitors}
                        icon={<People fontSize="large" />}
                        color="#4CAF50"
                        loading={isLoading}
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Views per Visitor"
                        value={viewsPerVisitor}
                        icon={<TrendingUp fontSize="large" />}
                        color="#FF9800"
                        loading={isLoading}
                        subtitle="Average pages viewed"
                    />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <StatCard
                        title="Estimated Bounce Rate"
                        value={`${bounceRate}%`}
                        icon={<TrendingDown fontSize="large" />}
                        color="#F44336"
                        loading={isLoading}
                        subtitle="Single page visits"
                    />
                </Grid>
            </Grid>

            {/* Traffic Graph */}
            <TrafficChart data={chartData} loading={isLoading} />

            <Grid container spacing={3}>
                {/* Pages Table */}
                <Grid item xs={12} lg={7}>
                    <PageViewsTable data={topPagesData} loading={isLoading} />
                </Grid>

                {/* Insights Panel */}
                <Grid item xs={12} lg={5}>
                    <Box
                        sx={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 3,
                        }}
                    >
                        <DeviceBreakdownPanel
                            data={deviceData}
                            loading={isLoading}
                        />
                        <BrowserBreakdownPanel
                            data={browserData}
                            totalViews={totalViews}
                            loading={isLoading}
                        />
                        <OSBreakdownPanel
                            data={osData}
                            totalViews={totalViews}
                            loading={isLoading}
                        />
                        <TopReferrersPanel
                            data={referrerData}
                            loading={isLoading}
                        />
                    </Box>
                </Grid>
            </Grid>
        </Box>
    );
}
