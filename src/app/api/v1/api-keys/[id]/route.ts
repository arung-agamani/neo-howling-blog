import {
    InternalServerError,
    Unauthorized,
    BadRequest,
    NotFound,
} from "@/app/api/responses";
import { verifyRole } from "@/hooks/useRoleAuth";
import prisma from "@/utils/prisma";
import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

// GET /api/v1/api-keys/[id] - Get API key details including usage logs
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    if (!(await verifyRole(req, ["admin", "editor"]))) {
        return Unauthorized();
    }

    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.sub) {
        return Unauthorized();
    }

    const { id } = await params;

    try {
        const apiKey = await prisma.apiKeys.findFirst({
            where: { id, userId: token.sub },
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
        });

        if (!apiKey) {
            return NotFound({
                success: false,
                message: "API key not found or you do not own it",
            });
        }

        // Fetch usage logs with pagination
        const searchParams = req.nextUrl.searchParams;
        const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
        const limit = Math.min(
            100,
            Math.max(1, parseInt(searchParams.get("limit") || "20", 10)),
        );
        const skip = (page - 1) * limit;

        const [usageLogs, totalLogs] = await Promise.all([
            prisma.apiKeyUsageLogs.findMany({
                where: { apiKeyId: id },
                orderBy: { timestamp: "desc" },
                skip,
                take: limit,
                select: {
                    id: true,
                    endpoint: true,
                    method: true,
                    statusCode: true,
                    ipAddress: true,
                    userAgent: true,
                    timestamp: true,
                },
            }),
            prisma.apiKeyUsageLogs.count({
                where: { apiKeyId: id },
            }),
        ]);

        return NextResponse.json({
            success: true,
            data: {
                ...apiKey,
                usageLogs,
            },
            pagination: {
                page,
                limit,
                total: totalLogs,
                totalPages: Math.ceil(totalLogs / limit),
                hasMore: skip + limit < totalLogs,
            },
        });
    } catch (error) {
        console.error("Failed to fetch API key details:", error);
        return InternalServerError();
    }
}

// PATCH /api/v1/api-keys/[id] - Update API key name/description
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    if (!(await verifyRole(req, ["admin", "editor"]))) {
        return Unauthorized();
    }

    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.sub) {
        return Unauthorized();
    }

    const { id } = await params;

    try {
        // Verify ownership
        const existing = await prisma.apiKeys.findFirst({
            where: { id, userId: token.sub },
        });

        if (!existing) {
            return NotFound({
                success: false,
                message: "API key not found or you do not own it",
            });
        }

        const body = await req.json();
        const updateData: Record<string, unknown> = {};

        if (typeof body.name === "string" && body.name.trim().length > 0) {
            if (body.name.length > 64) {
                return BadRequest({
                    success: false,
                    message: "Name must be 64 characters or less",
                });
            }
            updateData.name = body.name.trim();
        }

        if (body.description !== undefined) {
            if (
                body.description !== null &&
                typeof body.description === "string" &&
                body.description.length > 256
            ) {
                return BadRequest({
                    success: false,
                    message: "Description must be 256 characters or less",
                });
            }
            updateData.description =
                body.description === null
                    ? null
                    : typeof body.description === "string"
                      ? body.description.trim()
                      : undefined;
        }

        if (Object.keys(updateData).length === 0) {
            return BadRequest({
                success: false,
                message:
                    "No valid fields to update. Allowed: name, description",
            });
        }

        const updated = await prisma.apiKeys.update({
            where: { id },
            data: updateData,
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
        });

        return NextResponse.json({
            success: true,
            message: "API key updated successfully",
            data: updated,
        });
    } catch (error) {
        console.error("Failed to update API key:", error);
        return InternalServerError();
    }
}
