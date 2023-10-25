import { BadRequest, InternalServerError } from "@/app/api/responses";
import { UpdatePost, UpdatePostSchema } from "@/lib/Post";
import { NextRequest, NextResponse } from "next/server";

import { z } from "zod";

const UpdatePostSchema = z.object({
    author: z.string().optional(),
    bannerUrl: z.string().optional(),
    blogContent: z.string().optional(),
    description: z.string().optional(),
    title: z.string().optional(),
    tags: z.array(z.string()).optional(),
    deleted: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
    isPublished: z.boolean().optional(),

    id: z.string(),
    op: z.enum(["update", "publish", "feature"]),
}) satisfies z.ZodType<UpdatePostSchema>;

export async function POST(req: NextRequest) {
    const body = await req.json();
    const validate = UpdatePostSchema.safeParse(body);
    if (!validate.success) return BadRequest({ errors: validate.error.issues });

    const { id, op, ...payloadData } = validate.data;

    if (!op) return BadRequest();
    if (!id) return BadRequest();
    let updateRes;
    try {
        if (op === "update") {
            updateRes = await UpdatePost(id, payloadData);
        } else if (op === "feature") {
            const { isFeatured } = payloadData;
            updateRes = await UpdatePost(id, { isFeatured });
        } else if (op === "publish") {
            const { isPublished } = payloadData;
            updateRes = await UpdatePost(id, { isPublished });
        } else {
            return BadRequest();
        }

        if (!updateRes) return InternalServerError();

        return NextResponse.json({
            message: "Post updated",
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
