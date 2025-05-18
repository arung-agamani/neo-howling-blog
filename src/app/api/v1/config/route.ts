import { verifyRole } from "@/hooks/useRoleAuth";
import prisma from "@/utils/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { BadRequest, Unauthorized } from "../../responses";

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
    return NextResponse.json(upsert);
}
