import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "@/utils/axios";

export interface DashboardStats {
    total: number;
    unpublished: number;
    recentPosts: Array<{
        id: string;
        title: string;
        description: string;
    }>;
    tags: Array<{
        name: string;
        count: number;
    }>;
    untaggedPosts: Array<{
        id: string;
        title: string;
        description: string;
    }>;
}

export interface DashboardStatsResponse {
    message: string;
    stats: DashboardStats;
}

// Query key factory for dashboard stats
export const dashboardStatsKeys = {
    all: ["dashboard-stats"] as const,
    stats: () => [...dashboardStatsKeys.all, "stats"] as const,
};

// Fetch dashboard stats function
const fetchDashboardStats = async (): Promise<DashboardStats> => {
    const response = await axios.get<DashboardStatsResponse>(
        "/api/v1/dashboard/stats",
    );
    return response.data.stats;
};

// React Query hook for dashboard stats
export const useDashboardStats = () => {
    return useQuery({
        queryKey: dashboardStatsKeys.stats(),
        queryFn: fetchDashboardStats,
        staleTime: 2 * 60 * 1000, // 2 minutes - dashboard data should be relatively fresh
        gcTime: 5 * 60 * 1000, // 5 minutes cache time
        refetchOnWindowFocus: true, // Refetch when user returns to dashboard
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    });
};

// Hook for prefetching dashboard stats (useful for navigation)
export const usePrefetchDashboardStats = () => {
    const queryClient = useQueryClient();

    return () => {
        queryClient.prefetchQuery({
            queryKey: dashboardStatsKeys.stats(),
            queryFn: fetchDashboardStats,
            staleTime: 2 * 60 * 1000,
        });
    };
};

// Hook for invalidating dashboard stats (useful after mutations)
export const useInvalidateDashboardStats = () => {
    const queryClient = useQueryClient();

    return () => {
        queryClient.invalidateQueries({
            queryKey: dashboardStatsKeys.all,
        });
    };
};
