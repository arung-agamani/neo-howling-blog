import prisma from "@/utils/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { BadRequest } from "../../responses";

export async function GET() {
    const configs = await prisma.config.findMany();
    return NextResponse.json({
        count: configs.length,
        data: configs,
    });
}

const UpdateConfigSchema = z.object({
    key: z.string(),
    value: z.string(),
    description: z.string().optional(),
});

type UpdateConfigSchema = z.infer<typeof UpdateConfigSchema>;

export async function POST(req: NextRequest) {
    const body = req.json();
    const validate = UpdateConfigSchema.safeParse(body);

    if (!validate.success) return BadRequest();
    const { key, value, description } = validate.data;

    const upsert = await prisma.config.upsert({
        where: {
            key,
        },
        update: {
            description,
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
