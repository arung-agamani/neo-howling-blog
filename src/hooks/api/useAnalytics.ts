import { useQuery } from "@tanstack/react-query";
import axios from "@/utils/axios";

export interface AnalyticsStats {
    totalViews: number;
    uniqueVisitors: number;
    topPages: Array<{
        path: string;
        views: number;
    }>;
    deviceBreakdown: Array<{
        device: string;
        views: number;
    }>;
    browserBreakdown: Array<{
        browser: string;
        views: number;
    }>;
    osBreakdown: Array<{
        os: string;
        views: number;
    }>;
    viewsByDay: Array<{
        date: string;
        views: number;
    }>;
    topReferrers: Array<{
        referrer: string;
        views: number;
    }>;
}

export interface AnalyticsResponse {
    success: boolean;
    period: string;
    dateRange: {
        start: string;
        end: string;
    };
    stats: AnalyticsStats;
}

export type AnalyticsPeriod = "today" | "7d" | "30d" | "90d" | "year" | "all";

/**
 * Fetch analytics stats from the API
 */
async function fetchAnalyticsStats(
    period: AnalyticsPeriod,
): Promise<AnalyticsResponse> {
    const { data } = await axios.get<AnalyticsResponse>(
        `/api/v1/analytics/stats?period=${period}`,
    );
    return data;
}

/**
 * useAnalytics Hook
 *
 * Fetches analytics statistics for the dashboard.
 *
 * @param period - Time period for analytics: "today" | "7d" | "30d" | "90d" | "year" | "all"
 * @returns React Query result with analytics data
 *
 * @example
 * const { data, isLoading, error } = useAnalytics("30d");
 * if (data) {
 *   console.log(data.stats.totalViews);
 * }
 */
export function useAnalytics(period: AnalyticsPeriod = "30d") {
    return useQuery({
        queryKey: ["analytics", period],
        queryFn: () => fetchAnalyticsStats(period),
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: false,
    });
}

/**
 * useAnalyticsSummary Hook
 *
 * A simplified hook that returns just the key metrics.
 * Useful for dashboard widgets.
 *
 * @param period - Time period for analytics
 * @returns Object with totalViews, uniqueVisitors, and loading state
 */
export function useAnalyticsSummary(period: AnalyticsPeriod = "30d") {
    const query = useAnalytics(period);

    return {
        totalViews: query.data?.stats.totalViews ?? 0,
        uniqueVisitors: query.data?.stats.uniqueVisitors ?? 0,
        topPages: query.data?.stats.topPages ?? [],
        isLoading: query.isLoading,
        isError: query.isError,
        error: query.error,
    };
}
