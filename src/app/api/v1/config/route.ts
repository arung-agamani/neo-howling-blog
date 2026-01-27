import { verifyRole } from "@/hooks/useRoleAuth";
import prisma from "@/utils/prisma";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
    BadRequest,
    InternalServerError,
    NotFound,
    Unauthorized,
} from "../../responses";

/**
 * GET /api/v1/config
 *
 * Fetch configs. Supports:
 * - Fetch all configs (no params)
 * - Fetch single config by key (?key=someKey)
 * - Fetch single config by id (?id=someId)
 */
export async function GET(req: NextRequest) {
    if (!(await verifyRole(req, ["admin", "editor"]))) {
        return Unauthorized();
    }

    const searchParams = req.nextUrl.searchParams;
    const key = searchParams.get("key");
    const id = searchParams.get("id");

    // Fetch single config by key
    if (key) {
        const config = await prisma.config.findUnique({
            where: { key },
        });

        if (!config) {
            return NotFound({ message: `Config with key '${key}' not found` });
        }

        return NextResponse.json({
            success: true,
            data: config,
        });
    }

    // Fetch single config by id
    if (id) {
        const config = await prisma.config.findUnique({
            where: { id },
        });

        if (!config) {
            return NotFound({ message: `Config with id '${id}' not found` });
        }

        return NextResponse.json({
            success: true,
            data: config,
        });
    }

    // Fetch all configs
    const configs = await prisma.config.findMany({
        orderBy: { key: "asc" },
    });

    return NextResponse.json({
        success: true,
        count: configs.length,
        data: configs,
    });
}

const CreateConfigSchema = z.object({
    key: z.string().min(1, "Key is required"),
    value: z.string(),
    description: z.string().optional().default(""),
});

const UpdateConfigSchema = z.object({
    id: z.string().optional(),
    key: z.string().min(1, "Key is required"),
    value: z.string(),
    description: z.string().optional(),
});

type CreateConfigSchema = z.infer<typeof CreateConfigSchema>;
type UpdateConfigSchema = z.infer<typeof UpdateConfigSchema>;

/**
 * POST /api/v1/config
 *
 * Create or update a config by id.
 * If id is provided and exists, updates the config.
 * If id is not provided or doesn't exist, creates a new config.
 */
export async function POST(req: NextRequest) {
    if (!(await verifyRole(req, ["admin", "editor"]))) {
        return Unauthorized();
    }

    const body = await req.json();
    const validate = UpdateConfigSchema.safeParse(body);

    if (!validate.success) {
        return BadRequest({ error: validate.error });
    }

    const { id, key, value, description } = validate.data;

    try {
        const upsert = await prisma.config.upsert({
            where: {
                id: id || "non-existent-id",
            },
            update: {
                description,
                key,
                value,
            },
            create: {
                key,
                value,
                description: description || "",
            },
        });

        return NextResponse.json({
            success: true,
            message: id ? "Config updated" : "Config created",
            data: upsert,
        });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            // P2002 is unique constraint violation
            if (error.code === "P2002") {
                return BadRequest({
                    message: `Config with key '${key}' already exists`,
                    error,
                });
            }
            return InternalServerError({
                message: "Database error",
                error,
            });
        }
        return InternalServerError({ message: "Unknown error", error });
    }
}

/**
 * PUT /api/v1/config
 *
 * Upsert a config by key.
 * If key exists, updates the config.
 * If key doesn't exist, creates a new config.
 *
 * This is the preferred method for setting config values
 * when you know the key but not the id.
 */
export async function PUT(req: NextRequest) {
    if (!(await verifyRole(req, ["admin", "editor"]))) {
        return Unauthorized();
    }

    const body = await req.json();
    const validate = UpdateConfigSchema.safeParse(body);

    if (!validate.success) {
        return BadRequest({ error: validate.error });
    }

    const { key, value, description } = validate.data;

    try {
        const upsert = await prisma.config.upsert({
            where: {
                key,
            },
            update: {
                description,
                key,
                value,
            },
            create: {
                key,
                value,
                description: description || "",
            },
        });

        return NextResponse.json({
            success: true,
            message: "Config updated",
            data: upsert,
        });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            return InternalServerError({
                message: "Database error",
                error,
            });
        }
        return InternalServerError({ message: "Unknown error", error });
    }
}

/**
 * DELETE /api/v1/config
 *
 * Delete a config by id or key.
 * Supports: ?id=someId or ?key=someKey
 */
export async function DELETE(req: NextRequest) {
    if (!(await verifyRole(req, ["admin", "editor"]))) {
        return Unauthorized();
    }

    const searchParam = req.nextUrl.searchParams;
    const id = searchParam.get("id");
    const key = searchParam.get("key");

    if (!id && !key) {
        return BadRequest({
            message: "Either 'id' or 'key' query parameter is required",
        });
    }

    try {
        let deleteRes;

        if (id) {
            deleteRes = await prisma.config.delete({
                where: { id },
            });
        } else if (key) {
            deleteRes = await prisma.config.delete({
                where: { key },
            });
        }

        return NextResponse.json({
            success: true,
            message: "Config deleted",
            data: deleteRes,
        });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            // P2025 is record not found
            if (error.code === "P2025") {
                return NotFound({
                    message: id
                        ? `Config with id '${id}' not found`
                        : `Config with key '${key}' not found`,
                });
            }
            return InternalServerError({
                message: "Database error",
                error,
            });
        }
        return InternalServerError({ message: "Unknown error", error });
    }
}
