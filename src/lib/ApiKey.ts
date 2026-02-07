import crypto from "crypto";
import prisma from "@/utils/prisma";

const API_KEY_PREFIX = "nhb_";
const API_KEY_BYTE_LENGTH = 32; // 256 bits of randomness

/**
 * Generate a new API key string.
 * Format: nhb_<base64url random bytes>
 * The full key is only returned once at creation time.
 */
export function generateApiKey(): string {
    const randomBytes = crypto.randomBytes(API_KEY_BYTE_LENGTH);
    const encoded = randomBytes.toString("base64url").replace(/[=]+$/, ""); // strip padding
    return `${API_KEY_PREFIX}${encoded}`;
}

/**
 * Hash an API key for secure storage using SHA-256.
 */
export function hashApiKey(key: string): string {
    return crypto.createHash("sha256").update(key).digest("hex");
}

/**
 * Extract the display prefix from an API key (first 12 chars for identification).
 * e.g., "nhb_aBcDeFgH..." -> "nhb_aBcDeFgH"
 */
export function getKeyPrefix(key: string): string {
    return key.substring(0, 12);
}

/**
 * Validate API key format.
 */
export function isValidApiKeyFormat(key: string): boolean {
    return key.startsWith(API_KEY_PREFIX) && key.length >= 20;
}

export interface ApiKeyValidationResult {
    valid: boolean;
    userId?: string;
    apiKeyId?: string;
    error?: string;
}

/**
 * Validate an API key against the database.
 * Returns the associated user ID if valid.
 */
export async function validateApiKey(
    key: string,
): Promise<ApiKeyValidationResult> {
    if (!isValidApiKeyFormat(key)) {
        return { valid: false, error: "Invalid API key format" };
    }

    const keyHash = hashApiKey(key);

    const apiKey = await prisma.apiKeys.findUnique({
        where: { keyHash },
        include: {
            user: {
                select: {
                    id: true,
                    username: true,
                    role: true,
                },
            },
        },
    });

    if (!apiKey) {
        return { valid: false, error: "API key not found" };
    }

    if (!apiKey.isActive) {
        return { valid: false, error: "API key has been revoked" };
    }

    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
        return { valid: false, error: "API key has expired" };
    }

    // Update last used timestamp and usage count (fire and forget)
    prisma.apiKeys
        .update({
            where: { id: apiKey.id },
            data: {
                lastUsedAt: new Date(),
                usageCount: { increment: 1 },
            },
        })
        .catch((err: unknown) => {
            console.error("Failed to update API key usage:", err);
        });

    return {
        valid: true,
        userId: apiKey.userId,
        apiKeyId: apiKey.id,
    };
}

/**
 * Check if an API key has a specific scope.
 */
export async function apiKeyHasScope(
    apiKeyId: string,
    scope: string,
): Promise<boolean> {
    const apiKey = await prisma.apiKeys.findUnique({
        where: { id: apiKeyId },
        select: { scopes: true },
    });

    if (!apiKey) return false;

    // Wildcard scope grants everything
    if (apiKey.scopes.includes("*")) return true;

    // Check exact match
    if (apiKey.scopes.includes(scope)) return true;

    // Check category wildcard (e.g., "assets:*" matches "assets:read")
    const [category] = scope.split(":");
    if (apiKey.scopes.includes(`${category}:*`)) return true;

    return false;
}

/**
 * Log API key usage for tracking purposes.
 */
export async function logApiKeyUsage(params: {
    apiKeyId: string;
    endpoint: string;
    method: string;
    statusCode: number;
    ipAddress?: string | null;
    userAgent?: string | null;
}): Promise<void> {
    try {
        await prisma.apiKeyUsageLogs.create({
            data: {
                apiKeyId: params.apiKeyId,
                endpoint: params.endpoint,
                method: params.method,
                statusCode: params.statusCode,
                ipAddress: params.ipAddress || undefined,
                userAgent: params.userAgent || undefined,
            },
        });
    } catch (err) {
        console.error("Failed to log API key usage:", err);
    }
}

/**
 * Available scopes for API keys.
 */
export const API_KEY_SCOPES = {
    "assets:read": "Read/list assets and files",
    "assets:write": "Upload new assets",
    "assets:delete": "Delete assets",
    "assets:*": "Full access to assets",
} as const;

export type ApiKeyScope = keyof typeof API_KEY_SCOPES;
