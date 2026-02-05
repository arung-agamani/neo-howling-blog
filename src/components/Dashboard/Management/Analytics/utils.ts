import { AnalyticsPeriod } from "@/hooks/api/useAnalytics";

// Chart colors used across analytics components
export const COLORS = [
    "#2196F3",
    "#4CAF50",
    "#FF9800",
    "#F44336",
    "#9C27B0",
    "#00BCD4",
    "#795548",
    "#607D8B",
];

// Period options for the dropdown
export const PERIOD_OPTIONS: { value: AnalyticsPeriod; label: string }[] = [
    { value: "today", label: "Today" },
    { value: "7d", label: "Last 7 Days" },
    { value: "30d", label: "Last 30 Days" },
    { value: "90d", label: "Last 90 Days" },
    { value: "year", label: "This Year" },
    { value: "all", label: "All Time" },
];

// Utility function to format large numbers
export function formatNumber(num: number): string {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + "M";
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + "K";
    }
    return num.toLocaleString();
}

// Utility function to format dates for charts
export function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
