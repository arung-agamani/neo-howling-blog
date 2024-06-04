import { BadRequest, InternalServerError } from "@/app/api/responses";
import { FlattenErrors } from "@/lib/ZodError";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/utils/prisma";

const UpdateUserSchema = z.object({
    id: z.string(),
    name: z.string().optional(),
    birthday: z.coerce.date().optional(),
    gender: z.enum(["male", "female"]).optional(),
    phone: z.string().optional(),
});

export async function POST(req: NextRequest) {
    const body = await req.json();
    const validate = UpdateUserSchema.safeParse(body);
    if (!validate.success)
        return BadRequest({
            success: false,
            message: "Bad Request",
            errors: FlattenErrors(validate.error),
        });
    const data = validate.data;
    try {
        const updateUser = await prisma.users.update({
            where: {
                id: data.id,
            },
            data: {
                name: data.name,
                birthday: data.birthday,
                gender: data.gender,
                phone: data.phone,
            },
        });
        if (!updateUser) return InternalServerError();
        return NextResponse.json({
            message: "User updated",
        });
    } catch (error) {
        console.error(error);
        const errObj: any = {
            message: "Error happened with the route handler",
        };
        if (process.env.NODE_ENV === "development") errObj.error = error;
        return InternalServerError(errObj);
    }
}
