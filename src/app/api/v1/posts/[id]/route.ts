import { NextRequest, NextResponse } from "next/server";
import prisma from "@/utils/prisma";
import { z } from "zod";
import { BadRequest, InternalServerError } from "@/app/api/responses";
import {
    DeletePost,
    HardDeletePost,
    UpdatePost,
    UpdatePostSchema,
} from "@/lib/Post";

const DeleteRequestParams = z.object({
    id: z.string(),
    hard: z.coerce.boolean().optional(),
});

type DeleteRequestParams = z.infer<typeof DeleteRequestParams>;

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

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string; hard?: string } }
) {
    const postId = params.id;
    const post = await prisma.posts.findUnique({
        where: { id: postId },
        select: {
            id: true,
            title: true,
            blogContent: true,
            author: true,
            datePosted: true,
            updatedAt: true,
        },
    });

    if (!post) {
        return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json({ post });
}

export async function PATCH(req: NextRequest) {
    const body = await req.json();
    const validate = UpdatePostSchema.safeParse(body);
    if (!validate.success) return BadRequest({ errors: validate.error.issues });

    const { id, op, ...payloadData } = validate.data;

    if (!op || !id) return BadRequest();

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

export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string; hard?: string } }
) {
    const searchParams = req.nextUrl.searchParams;
    const id = params.id;
    const hard = searchParams.get("hard");
    const validate = DeleteRequestParams.safeParse({
        id,
        hard,
    });

    if (!validate.success) {
        return BadRequest(validate.error.issues);
    }

    let deleteRes;
    if (validate.data.hard) {
        deleteRes = await HardDeletePost(validate.data.id);
    } else {
        deleteRes = await DeletePost(validate.data.id);
    }

    if (!deleteRes) {
        return InternalServerError();
    }

    if (validate.data.hard) {
        return NextResponse.json({ message: "Post has been (hard) deleted " });
    }

    return NextResponse.json({ message: "Post marked as deleted" });
}
