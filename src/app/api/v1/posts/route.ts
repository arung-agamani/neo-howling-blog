import { NextRequest, NextResponse } from "next/server";
import prisma from "@/utils/prisma";
import { verifyRole } from "@/hooks/useRoleAuth";
import {
    BadRequest,
    InternalServerError,
    Unauthorized,
} from "@/app/api/responses";
import { CreatePost, CreatePostPayload } from "@/lib/Post";
import type { Prisma } from "@prisma/client";
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
    blogContentDelta: z.string().optional(),
}) satisfies z.ZodType<CreatePostPayload>;

// Diary tags - posts with ALL of these tags are considered diary entries
const DIARY_TAGS = ["log", "diary", "nikki"];

const POST_STATUSES = ["all", "published", "draft", "trash"] as const;

type PostStatus = (typeof POST_STATUSES)[number];

// GET /api/v1/posts (list all posts)
export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    // "related" query param is post ID or link to find related posts
    const related = searchParams.get("related");
    if (related) {
        // Decode URL-encoded identifier
        const decodedRelated = decodeURIComponent(related);

        // Check if it's a MongoDB ObjectId (24 hex characters)
        const isObjectId = /^[a-fA-F0-9]{24}$/.test(decodedRelated);

        // Find the post by either ID or link
        let post;
        if (isObjectId) {
            post = await prisma.posts.findUnique({
                where: { id: decodedRelated },
                select: { id: true, tags: true },
            });
        } else {
            post = await prisma.posts.findFirst({
                where: { link: decodedRelated },
                select: { id: true, tags: true },
            });
        }

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
                    id: { not: post.id },
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
                id: { not: post.id },
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
    const statusParam = searchParams.get("status") ?? "all";
    const status = POST_STATUSES.includes(statusParam as PostStatus)
        ? (statusParam as PostStatus)
        : "all";
    const search = searchParams.get("search")?.trim() ?? "";
    const tagParam = searchParams.get("tags") ?? "";
    const selectedTags = tagParam
        .split(",")
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean);

    // Public lists hide diary entries unless asked. Admin views pass
    // includeDiary=true so every post stays manageable.
    const baseFilter: Prisma.postsWhereInput = includeDiary
        ? {}
        : {
              NOT: {
                  AND: DIARY_TAGS.map((tag) => ({ tags: { has: tag } })),
              },
          };

    const statusFilter = (value: PostStatus): Prisma.postsWhereInput => {
        if (value === "trash") return { deleted: true };
        const filter: Prisma.postsWhereInput = { deleted: { not: true } };
        if (value === "published") filter.isPublished = true;
        if (value === "draft") filter.isPublished = { not: true };
        return filter;
    };

    const filters: Prisma.postsWhereInput[] = [
        baseFilter,
        statusFilter(status),
    ];

    // Tag filter: posts carrying any of the selected tags (v1 semantics).
    if (selectedTags.length > 0) {
        filters.push({ tags: { hasSome: [...new Set(selectedTags)] } });
    }

    if (search) {
        // Posts store lowercase tag names, so partial tag search is resolved
        // against the tag collection first and then matched by membership.
        const matchingTags = await prisma.tags.findMany({
            where: { name: { contains: search, mode: "insensitive" } },
            select: { name: true },
            take: 50,
        });
        const tagCandidates = [
            ...new Set([
                search.toLowerCase(),
                ...matchingTags.map((tag) => tag.name.toLowerCase()),
            ]),
        ];

        filters.push({
            OR: [
                { title: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
                { author: { contains: search, mode: "insensitive" } },
                { tags: { hasSome: tagCandidates } },
            ],
        });
    }

    const whereClause: Prisma.postsWhereInput = { AND: filters };

    const [posts, totalCount, all, published, draft, trash] =
        await Promise.all([
            prisma.posts.findMany({
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
            }),
            prisma.posts.count({ where: whereClause }),
            prisma.posts.count({
                where: { AND: [baseFilter, statusFilter("all")] },
            }),
            prisma.posts.count({
                where: { AND: [baseFilter, statusFilter("published")] },
            }),
            prisma.posts.count({
                where: { AND: [baseFilter, statusFilter("draft")] },
            }),
            prisma.posts.count({
                where: { AND: [baseFilter, statusFilter("trash")] },
            }),
        ]);

    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

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
        counts: { all, published, draft, trash },
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
