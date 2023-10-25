import { BadRequest, InternalServerError } from "@/app/api/responses";
import { CreatePost, CreatePostPayload } from "@/lib/Post";
import { NextRequest, NextResponse } from "next/server";

import { z } from "zod";

const CreatePostSchema = z.object({
    author: z.string(),
    title: z.string(),
    description: z.string(),
    tags: z.array(z.string()),
    bannerUrl: z.string().optional(),
    blogContent: z.string(),
}) satisfies z.ZodType<CreatePostPayload>;

export async function POST(req: NextRequest) {
    const body = await req.json();
    const validate = CreatePostSchema.safeParse(body);

    if (!validate.success) return BadRequest({ errors: validate.error.issues });

    const res = await CreatePost(validate.data);
    if (res) {
        const { v, ...cres } = res;
        return NextResponse.json({
            message: "Post created",
            data: cres,
        });
    }
    return InternalServerError({
        message: "Unknown error",
    });
}
