import { NextRequest, NextResponse } from "next/server";
import { verifyRole } from "@/hooks/useRoleAuth";
import { Unauthorized } from "@/app/api/responses";
import prisma from "@/utils/prisma";

export const dynamic = "force-dynamic";

interface DateRange {
    start: Date;
    end: Date;
}

/**
 * Get date range based on period string
 */
function getDateRange(period: string): DateRange {
    const now = new Date();
    const end = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        23,
        59,
        59,
        999,
    );
    let start: Date;

    switch (period) {
        case "today":
            start = new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate(),
                0,
                0,
                0,
                0,
            );
            break;
        case "7d":
            start = new Date(end);
            start.setDate(start.getDate() - 7);
            start.setHours(0, 0, 0, 0);
            break;
        case "30d":
            start = new Date(end);
            start.setDate(start.getDate() - 30);
            start.setHours(0, 0, 0, 0);
            break;
        case "90d":
            start = new Date(end);
            start.setDate(start.getDate() - 90);
            start.setHours(0, 0, 0, 0);
            break;
        case "year":
            start = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
            break;
        case "all":
            start = new Date(0); // Beginning of time
            break;
        default:
            // Default to 30 days
            start = new Date(end);
            start.setDate(start.getDate() - 30);
            start.setHours(0, 0, 0, 0);
    }

    return { start, end };
}

/**
 * Analytics Stats Endpoint
 *
 * GET /api/v1/analytics/stats
 *
 * Query Parameters:
 * - period: "today" | "7d" | "30d" | "90d" | "year" | "all" (default: "30d")
 *
 * Returns:
 * - totalViews: Total page views in period
 * - uniqueVisitors: Unique visitors in period
 * - topPages: Top 10 most viewed pages
 * - deviceBreakdown: Views by device type
 * - browserBreakdown: Views by browser
 * - viewsByDay: Daily view counts for charting
 */
export async function GET(req: NextRequest) {
    if (!(await verifyRole(req, ["admin", "editor"]))) {
        return Unauthorized();
    }

    try {
        const searchParams = req.nextUrl.searchParams;
        const period = searchParams.get("period") || "30d";
        const { start, end } = getDateRange(period);

        // Base filter for date range
        const dateFilter = {
            timestamp: {
                gte: start,
                lte: end,
            },
        };

        // Total page views
        const totalViews = await prisma.pageView.count({
            where: dateFilter,
        });

        // Unique visitors (distinct visitorId)
        const uniqueVisitorsResult = await prisma.pageView.groupBy({
            by: ["visitorId"],
            where: {
                ...dateFilter,
                visitorId: { not: null },
            },
        });
        const uniqueVisitors = uniqueVisitorsResult.length;

        // Top pages
        const topPagesResult = await prisma.pageView.groupBy({
            by: ["path"],
            where: dateFilter,
            _count: {
                path: true,
            },
            orderBy: {
                _count: {
                    path: "desc",
                },
            },
            take: 10,
        });
        const topPages = topPagesResult.map(
            (item: { path: string; _count: { path: number } }) => ({
                path: item.path,
                views: item._count.path,
            }),
        );

        // Device breakdown
        const deviceBreakdownResult = await prisma.pageView.groupBy({
            by: ["deviceType"],
            where: dateFilter,
            _count: {
                deviceType: true,
            },
            orderBy: {
                _count: {
                    deviceType: "desc",
                },
            },
        });
        const deviceBreakdown = deviceBreakdownResult.map(
            (item: {
                deviceType: string | null;
                _count: { deviceType: number };
            }) => ({
                device: item.deviceType || "unknown",
                views: item._count.deviceType,
            }),
        );

        // Browser breakdown
        const browserBreakdownResult = await prisma.pageView.groupBy({
            by: ["browser"],
            where: dateFilter,
            _count: {
                browser: true,
            },
            orderBy: {
                _count: {
                    browser: "desc",
                },
            },
            take: 10,
        });
        const browserBreakdown = browserBreakdownResult.map(
            (item: {
                browser: string | null;
                _count: { browser: number };
            }) => ({
                browser: item.browser || "Unknown",
                views: item._count.browser,
            }),
        );

        // OS breakdown
        const osBreakdownResult = await prisma.pageView.groupBy({
            by: ["os"],
            where: dateFilter,
            _count: {
                os: true,
            },
            orderBy: {
                _count: {
                    os: "desc",
                },
            },
            take: 10,
        });
        const osBreakdown = osBreakdownResult.map(
            (item: { os: string | null; _count: { os: number } }) => ({
                os: item.os || "Unknown",
                views: item._count.os,
            }),
        );

        // Views by day (for charts)
        // We'll fetch all records and aggregate in JS for simplicity
        // For very large datasets, consider using raw queries or aggregation pipelines
        const allViewsInPeriod = await prisma.pageView.findMany({
            where: dateFilter,
            select: {
                timestamp: true,
            },
            orderBy: {
                timestamp: "asc",
            },
        });

        // Group by day
        const viewsByDayMap = new Map<string, number>();
        allViewsInPeriod.forEach((view: { timestamp: Date }) => {
            const day = view.timestamp.toISOString().split("T")[0];
            viewsByDayMap.set(day, (viewsByDayMap.get(day) || 0) + 1);
        });

        const viewsByDay = Array.from(viewsByDayMap.entries())
            .map(([date, views]) => ({ date, views }))
            .sort((a, b) => a.date.localeCompare(b.date));

        // Recent referrers (external traffic sources)
        const referrersResult = await prisma.pageView.groupBy({
            by: ["referrer"],
            where: {
                ...dateFilter,
                referrer: {
                    not: null,
                },
            },
            _count: {
                referrer: true,
            },
            orderBy: {
                _count: {
                    referrer: "desc",
                },
            },
            take: 10,
        });
        const topReferrers = referrersResult
            .filter(
                (item: {
                    referrer: string | null;
                    _count: { referrer: number };
                }) => item.referrer && item.referrer.trim() !== "",
            )
            .map(
                (item: {
                    referrer: string | null;
                    _count: { referrer: number };
                }) => ({
                    referrer: item.referrer,
                    views: item._count.referrer,
                }),
            );

        return NextResponse.json({
            success: true,
            period,
            dateRange: {
                start: start.toISOString(),
                end: end.toISOString(),
            },
            stats: {
                totalViews,
                uniqueVisitors,
                topPages,
                deviceBreakdown,
                browserBreakdown,
                osBreakdown,
                viewsByDay,
                topReferrers,
            },
        });
    } catch (error) {
        console.error("[Analytics] Error fetching stats:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch analytics stats" },
            { status: 500 },
        );
    }
}
