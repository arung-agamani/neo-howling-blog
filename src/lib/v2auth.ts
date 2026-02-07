import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { TUserRoles } from "@/types";
import { getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";
import {
    validateApiKey,
    apiKeyHasScope,
    logApiKeyUsage,
    ApiKeyValidationResult,
} from "@/lib/ApiKey";

export interface V2AuthResult {
    authenticated: boolean;
    method: "session" | "api-key" | "none";
    userId?: string;
    role?: TUserRoles;
    apiKeyId?: string;
    error?: string;
}

/**
 * Extract the API key from the request.
 * Supports both "Authorization: Bearer nhb_..." and "X-API-Key: nhb_..." headers.
 */
function extractApiKey(req: NextRequest): string | null {
    // Check Authorization header first (Bearer token)
    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer nhb_")) {
        return authHeader.slice("Bearer ".length);
    }

    // Check X-API-Key header
    const apiKeyHeader = req.headers.get("x-api-key");
    if (apiKeyHeader?.startsWith("nhb_")) {
        return apiKeyHeader;
    }

    return null;
}

/**
 * Unified authentication for v2 APIs.
 * Tries NextAuth session first, then falls back to API key authentication.
 */
export async function authenticateV2(
    req: NextRequest
): Promise<V2AuthResult> {
    // 1. Try NextAuth session/JWT authentication first
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (token) {
        return {
            authenticated: true,
            method: "session",
            userId: token.sub,
            role: (token.role as TUserRoles) || "user",
        };
    }

    // 2. Try API key authentication
    const apiKey = extractApiKey(req);
    if (apiKey) {
        const result = await validateApiKey(apiKey);
        if (result.valid && result.userId) {
            return {
                authenticated: true,
                method: "api-key",
                userId: result.userId,
                apiKeyId: result.apiKeyId,
            };
        }

        return {
            authenticated: false,
            method: "api-key",
            error: result.error || "Invalid API key",
        };
    }

    // 3. Not authenticated
    return {
        authenticated: false,
        method: "none",
        error: "No authentication provided",
    };
}

/**
 * Verify that the request has the required role (session auth)
 * or the required scope (API key auth).
 *
 * For session-based auth, checks the user's role against the allowed roles.
 * For API key auth, checks the key's scopes against the required scope.
 */
export async function authorizeV2(
    req: NextRequest,
    options: {
        roles: TUserRoles[];
        scope: string;
    }
): Promise<V2AuthResult> {
    const auth = await authenticateV2(req);

    if (!auth.authenticated) {
        return auth;
    }

    // Session-based auth: check role
    if (auth.method === "session") {
        if (!options.roles.includes(auth.role || "no-auth")) {
            return {
                ...auth,
                authenticated: false,
                error: "Insufficient role permissions",
            };
        }
        return auth;
    }

    // API key auth: check scope
    if (auth.method === "api-key" && auth.apiKeyId) {
        const hasScope = await apiKeyHasScope(auth.apiKeyId, options.scope);
        if (!hasScope) {
            return {
                ...auth,
                authenticated: false,
                error: `API key lacks required scope: ${options.scope}`,
            };
        }
        return auth;
    }

    return {
        authenticated: false,
        method: "none",
        error: "Authorization check failed",
    };
}

/**
 * Log API usage after a request is processed.
 * Only logs for API key authenticated requests.
 */
export async function logV2Usage(
    req: NextRequest,
    auth: V2AuthResult,
    statusCode: number
): Promise<void> {
    if (auth.method !== "api-key" || !auth.apiKeyId) {
        return;
    }

    const ipAddress =
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        req.headers.get("x-real-ip") ||
        null;

    await logApiKeyUsage({
        apiKeyId: auth.apiKeyId,
        endpoint: req.nextUrl.pathname,
        method: req.method,
        statusCode,
        ipAddress,
        userAgent: req.headers.get("user-agent"),
    });
}
