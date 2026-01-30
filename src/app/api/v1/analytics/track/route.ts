import { NextRequest } from "next/server";
import prisma from "@/utils/prisma";
import { parseUserAgent } from "@/utils/user-agent-parser";

/**
 * Page View Tracking Endpoint
 *
 * This endpoint is designed to be:
 * - Fast: Minimal processing, async database write
 * - Lightweight: No auth required, minimal response
 * - Non-blocking: Returns immediately, suitable for Beacon API
 *
 * Accepts POST requests with JSON body:
 * {
 *   path: string,       // Required: The page path
 *   referrer?: string,  // Optional: Where the user came from
 *   visitorId?: string  // Optional: Anonymous visitor identifier
 * }
 */
export async function POST(req: NextRequest) {
    try {
        // Parse request body
        const body = await req.json().catch(() => null);

        if (!body || !body.path) {
            // Return 204 even on error to not block the client
            return new Response(null, { status: 204 });
        }

        // Get user agent from headers
        const userAgent = req.headers.get("user-agent");

        // Parse user agent for device info
        const parsedUA = parseUserAgent(userAgent);

        // Fire-and-forget database write
        // We don't await this to return response immediately
        prisma.pageView
            .create({
                data: {
                    path: body.path,
                    referrer: body.referrer || null,
                    userAgent: userAgent || null,
                    deviceType: parsedUA.deviceType,
                    browser: parsedUA.browser,
                    os: parsedUA.os,
                    visitorId: body.visitorId || null,
                },
            })
            .catch((err: unknown) => {
                // Log error but don't fail the request
                console.error("[Analytics] Failed to track page view:", err);
            });

        // Return 204 No Content - fastest possible response
        return new Response(null, { status: 204 });
    } catch (error) {
        // Even on error, return 204 to not affect user experience
        console.error("[Analytics] Track endpoint error:", error);
        return new Response(null, { status: 204 });
    }
}

/**
 * Handle preflight requests for CORS
 */
export async function OPTIONS() {
    return new Response(null, {
        status: 204,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        },
    });
}
