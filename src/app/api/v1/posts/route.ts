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

// Diary tags - posts with ALL of these tags are considered diary entries
const DIARY_TAGS = ["log", "diary", "nikki"];

// GET /api/v1/posts (list all posts)
export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    // "related" query param is post ID to find related posts
    const related = searchParams.get("related");
    if (related) {
        // validate if related is a valid mongodb ObjectId
        if (!/^[a-fA-F0-9]{24}$/.test(related)) {
            return BadRequest({ message: "Invalid post ID" });
        }
        // search for related posts based on tags
        const post = await prisma.posts.findUnique({
            where: { id: related },
            select: { tags: true },
        });
        if (!post) {
            return BadRequest({ message: "Post not found" });
        }
        const tags = post.tags;
        if (tags.length === 0) {
            // get latest 5 posts if no tags
            const latestPosts = await prisma.posts.findMany({
                where: {
                    isPublished: true,
                    deleted: false,
                    id: { not: related },
                },
                take: 5,
                orderBy: { datePosted: "desc" },
                select: {
                    id: true,
                    title: true,
                    description: true,
                    bannerUrl: true,
                    datePosted: true,
                    link: true,
                },
            });
            return NextResponse.json({
                success: true,
                errors: [],
                data: latestPosts,
            });
        }
        const relatedPosts = await prisma.posts.findMany({
            where: {
                isPublished: true,
                deleted: false,
                id: { not: related },
                tags: { hasSome: tags },
            },
            take: 5,
            orderBy: { datePosted: "desc" },
            select: {
                id: true,
                title: true,
                description: true,
                bannerUrl: true,
                datePosted: true,
                link: true,
            },
        });
        return NextResponse.json({
            success: true,
            errors: [],
            data: relatedPosts,
        });
    }

    // Pagination parameters
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.max(
        1,
        Math.min(100, parseInt(searchParams.get("pageSize") || "10", 10)),
    );
    const skip = (page - 1) * pageSize;

    // Filter parameters
    const includeDiary = searchParams.get("includeDiary") === "true";

    // Build where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const whereClause: any = {};

    // If includeDiary is false, exclude posts that have ALL diary tags
    if (!includeDiary) {
        // Exclude posts that have all of ['log', 'diary', 'nikki'] tags
        whereClause.NOT = {
            AND: DIARY_TAGS.map((tag) => ({
                tags: { has: tag },
            })),
        };
    }

    // Get total count for pagination metadata
    const totalCount = await prisma.posts.count({
        where: whereClause,
    });

    const totalPages = Math.ceil(totalCount / pageSize);

    // default behavior: return paginated posts
    const posts = await prisma.posts.findMany({
        where: whereClause,
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
            link: true,
        },
        orderBy: {
            datePosted: "desc",
        },
        skip,
        take: pageSize,
    });

    return NextResponse.json({
        success: true,
        errors: [],
        data: posts,
        pagination: {
            page,
            pageSize,
            totalCount,
            totalPages,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1,
        },
    });
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
