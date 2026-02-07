import {
    InternalServerError,
    Unauthorized,
    BadRequest,
} from "@/app/api/responses";
import { verifyRole } from "@/hooks/useRoleAuth";
import { generateApiKey, hashApiKey, getKeyPrefix, API_KEY_SCOPES } from "@/lib/ApiKey";
import prisma from "@/utils/prisma";
import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const CreateApiKeySchema = z.object({
    name: z
        .string()
        .min(1, "Name is required")
        .max(64, "Name must be 64 characters or less"),
    description: z
        .string()
        .max(256, "Description must be 256 characters or less")
        .optional(),
    scopes: z
        .array(z.string())
        .min(1, "At least one scope is required"),
    expiresAt: z
        .string()
        .datetime()
        .optional()
        .nullable(),
});

// GET /api/v1/api-keys - List all API keys for the current user
export async function GET(req: NextRequest) {
    if (!(await verifyRole(req, ["admin", "editor"]))) {
        return Unauthorized();
    }

    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.sub) {
        return Unauthorized();
    }

    try {
        const apiKeys = await prisma.apiKeys.findMany({
            where: { userId: token.sub },
            select: {
                id: true,
                name: true,
                description: true,
                keyPrefix: true,
                scopes: true,
                createdAt: true,
                lastUsedAt: true,
                expiresAt: true,
                usageCount: true,
                isActive: true,
                revokedAt: true,
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json({
            success: true,
            data: apiKeys,
            count: apiKeys.length,
        });
    } catch (error) {
        console.error("Failed to list API keys:", error);
        return InternalServerError();
    }
}

// POST /api/v1/api-keys - Create a new API key
export async function POST(req: NextRequest) {
    if (!(await verifyRole(req, ["admin", "editor"]))) {
        return Unauthorized();
    }

    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.sub) {
        return Unauthorized();
    }

    try {
        const body = await req.json();
        const parseRes = CreateApiKeySchema.safeParse(body);

        if (!parseRes.success) {
            const errors: Record<string, string> = {};
            parseRes.error.issues.forEach((issue) => {
                errors[issue.path.join(".")] = issue.message;
            });
            return BadRequest({
                success: false,
                message: "Validation failed",
                errors,
            });
        }

        const { name, description, scopes, expiresAt } = parseRes.data;

        // Validate scopes against known scopes
        const validScopeKeys = Object.keys(API_KEY_SCOPES);
        const invalidScopes = scopes.filter(
            (s) => !validScopeKeys.includes(s) && s !== "*"
        );
        if (invalidScopes.length > 0) {
            return BadRequest({
                success: false,
                message: `Invalid scopes: ${invalidScopes.join(", ")}`,
            });
        }

        // Generate the raw key
        const rawKey = generateApiKey();
        const keyHash = hashApiKey(rawKey);
        const keyPrefix = getKeyPrefix(rawKey);

        // Store in database
        const apiKey = await prisma.apiKeys.create({
            data: {
                name,
                description: description || null,
                keyHash,
                keyPrefix,
                scopes,
                expiresAt: expiresAt ? new Date(expiresAt) : null,
                userId: token.sub,
            },
            select: {
                id: true,
                name: true,
                description: true,
                keyPrefix: true,
                scopes: true,
                createdAt: true,
                expiresAt: true,
                isActive: true,
            },
        });

        // Return the raw key ONLY on creation - it cannot be retrieved again
        return NextResponse.json(
            {
                success: true,
                message:
                    "API key created. Copy the key now — it will not be shown again.",
                data: {
                    ...apiKey,
                    key: rawKey,
                },
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Failed to create API key:", error);
        return InternalServerError();
    }
}

// DELETE /api/v1/api-keys?id=... - Revoke (soft delete) an API key
export async function DELETE(req: NextRequest) {
    if (!(await verifyRole(req, ["admin", "editor"]))) {
        return Unauthorized();
    }

    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.sub) {
        return Unauthorized();
    }

    const id = req.nextUrl.searchParams.get("id");
    if (!id) {
        return BadRequest({ success: false, message: "API key ID is required" });
    }

    try {
        // Verify ownership
        const apiKey = await prisma.apiKeys.findFirst({
            where: { id, userId: token.sub },
        });

        if (!apiKey) {
            return BadRequest({
                success: false,
                message: "API key not found or you do not own it",
            });
        }

        if (!apiKey.isActive) {
            return BadRequest({
                success: false,
                message: "API key is already revoked",
            });
        }

        // Revoke the key
        await prisma.apiKeys.update({
            where: { id },
            data: {
                isActive: false,
                revokedAt: new Date(),
            },
        });

        return NextResponse.json({
            success: true,
            message: "API key revoked successfully",
        });
    } catch (error) {
        console.error("Failed to revoke API key:", error);
        return InternalServerError();
    }
}
