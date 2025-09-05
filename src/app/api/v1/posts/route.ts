import { NextRequest, NextResponse } from "next/server";
import prisma from "@/utils/prisma";
import { verifyRole } from "@/hooks/useRoleAuth";
import {
    BadRequest,
    InternalServerError,
    Unauthorized,
} from "@/app/api/responses";
import { CreatePost, CreatePostPayload } from "@/lib/Post";
import { z } from "zod";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const CreatePostSchema = z.object({
    author: z.string(),
    title: z.string(),
    description: z.string(),
    tags: z.array(z.string()),
    bannerUrl: z.string().optional(),
    blogContent: z.string(),
}) satisfies z.ZodType<CreatePostPayload>;

// GET /api/v1/posts (list all posts)
export async function GET() {
    const posts = await prisma.posts.findMany({
        select: {
            id: true,
            title: true,
            blogContent: false,
            author: true,
            datePosted: true,
            updatedAt: true,
            description: true,
            tags: true,
            bannerUrl: true,
            isPublished: true,
            deleted: true,
        },
        orderBy: {
            datePosted: "desc",
        },
    });
    return NextResponse.json({ success: true, errors: [], data: posts });
}

// POST /api/v1/posts (create new post)
export async function POST(req: NextRequest) {
    if (!(await verifyRole(req, ["admin", "editor"]))) {
        return Unauthorized();
    }

    try {
        const body = await req.json();
        const validate = CreatePostSchema.safeParse(body);

        if (!validate.success) {
            return BadRequest({ errors: validate.error.issues });
        }

        const res = await CreatePost(validate.data);
        if (res) {
            const { v, ...cres } = res;
            return NextResponse.json({
                success: true,
                message: "Post created",
                data: cres,
            });
        }
        return InternalServerError({
            message: "Unknown error",
        });
    } catch (error) {
        console.error("Error creating post:", error);
        return InternalServerError({
            message: "Internal server error",
        });
    }
}
