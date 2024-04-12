import { verifyRole } from "@/hooks/useRoleAuth";
import prisma from "@/utils/prisma";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { BadRequest, InternalServerError, Unauthorized } from "../../responses";

export async function GET(req: NextRequest) {
    if (!(await verifyRole(req, ["admin", "editor"]))) {
        return Unauthorized();
    }
    const configs = await prisma.config.findMany();
    return NextResponse.json({
        count: configs.length,
        data: configs,
    });
}

const UpdateConfigSchema = z.object({
    id: z.string().optional(),
    key: z.string(),
    value: z.string(),
    description: z.string().optional(),
});

type UpdateConfigSchema = z.infer<typeof UpdateConfigSchema>;

export async function POST(req: NextRequest) {
    if (!(await verifyRole(req, ["admin", "editor"]))) {
        return Unauthorized();
    }
    const body = await req.json();
    const validate = UpdateConfigSchema.safeParse(body);

    if (!validate.success) return BadRequest({ error: validate.error });
    const { id, key, value, description } = validate.data;

    const upsert = await prisma.config.upsert({
        where: {
            id,
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
        message: "Config updated",
        data: upsert,
    });
}

export async function PUT(req: NextRequest) {
    if (!(await verifyRole(req, ["admin", "editor"]))) {
        return Unauthorized();
    }
    const body = await req.json();
    const validate = UpdateConfigSchema.safeParse(body);

    if (!validate.success) return BadRequest({ error: validate.error });
    const { id, key, value, description } = validate.data;

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
        message: "Config added",
        data: upsert,
    });
}

export async function DELETE(req: NextRequest) {
    if (!(await verifyRole(req, ["admin", "editor"]))) {
        return Unauthorized();
    }
    const searchParam = req.nextUrl.searchParams;
    const id = searchParam.get("id");

    if (!id) return BadRequest();

    try {
        const deleteRes = await prisma.config.delete({
            where: {
                id,
            },
        });

        return NextResponse.json({
            message: "Config deleted",
            data: deleteRes,
        });
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            return InternalServerError({
                message: "Database error",
                error,
            });
        } else {
            return InternalServerError({ message: "Unknown error", error });
        }
    }
}
