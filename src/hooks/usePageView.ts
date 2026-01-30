"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

/**
 * Anonymous Visitor ID Management
 * Generates and persists a unique visitor ID in localStorage
 */
function getOrCreateVisitorId(): string {
    if (typeof window === "undefined") return "";

    const STORAGE_KEY = "howling_visitor_id";

    try {
        let visitorId = localStorage.getItem(STORAGE_KEY);

        if (!visitorId) {
            // Generate a simple unique ID using timestamp + random string
            visitorId = `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 11)}`;
            localStorage.setItem(STORAGE_KEY, visitorId);
        }

        return visitorId;
    } catch {
        // localStorage might be blocked (e.g., incognito mode)
        // Fall back to session-based ID
        return `session-${Math.random().toString(36).substring(2, 11)}`;
    }
}

/**
 * Check if we're in a development/localhost environment
 * Returns true if tracking should be skipped
 */
function isDevEnvironment(): boolean {
    if (typeof window === "undefined") return true;

    const hostname = window.location.hostname;

    // Skip tracking for localhost and common dev environments
    return (
        hostname === "localhost" ||
        hostname === "127.0.0.1" ||
        hostname.startsWith("192.168.") ||
        hostname.startsWith("10.") ||
        hostname.endsWith(".local") ||
        hostname.includes("dev.") ||
        window.location.port !== "" // Non-standard ports are usually dev
    );
}

/**
 * Track page view using Beacon API
 * Fire-and-forget, doesn't block navigation
 * Skips tracking in development environments
 */
function trackPageView(
    path: string,
    referrer: string | null,
    visitorId: string,
): void {
    // Skip tracking in development
    if (isDevEnvironment()) {
        console.debug("[Analytics] Skipping tracking in dev environment");
        return;
    }

    const data = JSON.stringify({
        path,
        referrer,
        visitorId,
    });

    // Use Beacon API if available (preferred - non-blocking)
    if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/v1/analytics/track", data);
        return;
    }

    // Fallback to fetch with keepalive for older browsers
    fetch("/api/v1/analytics/track", {
        method: "POST",
        body: data,
        headers: {
            "Content-Type": "application/json",
        },
        keepalive: true, // Allows request to outlive the page
    }).catch(() => {
        // Silently fail - analytics shouldn't affect UX
    });
}

/**
 * usePageView Hook
 *
 * Lightweight page view tracking hook that:
 * - Uses Beacon API for non-blocking tracking
 * - Generates anonymous visitor IDs for unique visitor counting
 * - Tracks page path and referrer
 * - Only tracks once per path change (prevents double tracking)
 *
 * @example
 * // In your layout or page component:
 * function Layout({ children }) {
 *   usePageView();
 *   return <>{children}</>;
 * }
 */
export function usePageView(): void {
    const pathname = usePathname();
    const lastTrackedPath = useRef<string | null>(null);

    useEffect(() => {
        // Prevent double tracking on the same path
        if (pathname === lastTrackedPath.current) {
            return;
        }

        lastTrackedPath.current = pathname;

        // Get or create visitor ID
        const visitorId = getOrCreateVisitorId();

        // Get referrer (only available on initial page load)
        const referrer = document.referrer || null;

        // Track the page view
        trackPageView(pathname, referrer, visitorId);
    }, [pathname]);
}

/**
 * PageViewTracker Component
 *
 * Alternative to the hook - a component that tracks page views.
 * Useful when you want to add tracking without modifying existing components.
 *
 * @example
 * // In your layout:
 * <PageViewTracker />
 */
export function PageViewTracker(): null {
    usePageView();
    return null;
}
