import prisma from "@/utils/prisma";
import { Prisma } from "@prisma/client";
import { applyTagDiff, normalizeTags } from "@/services/tagSync";
import { ensureUniqueLink } from "@/services/postSlug";

export class DeleteError extends Error {
    public msg: string = "Error when deleting post";
    public err: Error = new Error();
    constructor(error: Error, msg: string = "Error when deleting post") {
        super(msg);
        this.msg = msg;
        this.message = msg;
        this.err = error;
    }
}

export async function ListPosts() {
    const posts = await prisma.posts.findMany({
        select: {
            title: true,
            link: true,
            tags: true,
            description: true,
            bannerUrl: true,
            isBannerDark: true,
            isPublished: true,
            datePosted: true,
            id: true,
            updatedAt: true,
            deleted: true,
            deletedAt: true,
        },
        orderBy: {
            datePosted: "desc",
        },
    });

    return posts;
}

export type ListPostsResponse = Awaited<ReturnType<typeof ListPosts>>;

export async function GetPost(id: string) {
    const post = await prisma.posts.findFirst({
        where: {
            id,
        },
    });
    return post;
}

export interface CreatePostPayload {
    author: string;
    title: string;
    description: string;
    tags: string[];
    bannerUrl?: string;
    blogContent: string;
    /** JSON block document written by the v2 editor. */
    blogContentDelta?: string;
}

export async function CreatePost(data: CreatePostPayload) {
    // The slug is assigned once, at creation, and must be unique.
    const link = await ensureUniqueLink(data.title);
    const tags = normalizeTags(data.tags);

    const createRes = await prisma.posts.create({
        data: {
            ...data,
            tags,
            link,
            deleted: false,

            datePosted: new Date(),
        },
    });

    // New tags must exist in the tag collection or they never appear in
    // suggestions and their counts stay at zero.
    await applyTagDiff(createRes.id, [], tags);

    return createRes;
}

export interface UpdatePostSchema {
    title?: string;
    /** Explicit slug change; omitted means the current slug is kept. */
    link?: string;
    author?: string;
    bannerUrl?: string;
    blogContent?: string;
    /** JSON block document written by the v2 editor. */
    blogContentDelta?: string | null;
    description?: string;
    isFeatured?: boolean;
    isPublished?: boolean;
    tags?: string[];
    deleted?: boolean;
}

export async function UpdatePost(id: string, data: UpdatePostSchema) {
    const before = await prisma.posts.findUnique({
        where: { id },
        select: { tags: true, deleted: true, link: true },
    });

    // Auto-update link if title is being updated
    const updateData: UpdatePostSchema & {
        link?: string;
        updatedAt?: Date;
        deletedAt?: Date | null;
    } = {
        ...data,
        updatedAt: new Date(),
    };

    // Keep the trash timestamp in step with the flag so restore does not
    // leave a stale deletion date behind.
    if (data.deleted === true) updateData.deletedAt = new Date();
    if (data.deleted === false) updateData.deletedAt = null;

    // The slug is stable: editing the title no longer moves the URL. An
    // explicit `link` changes it deliberately (and is made unique); legacy
    // rows without a slug get one derived from the title.
    const explicitLink = data.link?.trim();
    if (explicitLink) {
        updateData.link = await ensureUniqueLink(explicitLink, id);
    } else if (data.title && !before?.link) {
        updateData.link = await ensureUniqueLink(data.title, id);
    }

    if (data.tags !== undefined) {
        updateData.tags = normalizeTags(data.tags);
    }

    // A client that saved HTML without block JSON did not come from the v2
    // editor (e.g. the v1 Quill editor). Drop the stale block document so the
    // next load reads the HTML instead of an outdated snapshot.
    if (data.blogContent !== undefined && data.blogContentDelta === undefined) {
        updateData.blogContentDelta = null;
    }

    const res = await prisma.posts.update({
        where: {
            id,
        },
        data: updateData,
    });

    // Trashed posts do not count toward tag membership, so trashing removes
    // the post from every tag and restoring adds it back.
    const beforeTags =
        before && !before.deleted ? normalizeTags(before.tags) : [];
    const afterTags = res.deleted ? [] : normalizeTags(res.tags);
    await applyTagDiff(id, beforeTags, afterTags);

    return res;
}

export async function PublishPost(id: string, publish: boolean) {
    const res = await prisma.posts.update({
        where: { id },
        data: { isPublished: publish, updatedAt: new Date() },
    });

    return res;
}

export async function DeletePost(id: string) {
    try {
        const before = await prisma.posts.findUnique({
            where: { id },
            select: { tags: true, deleted: true },
        });

        const res = await prisma.posts.update({
            where: { id },
            data: {
                deleted: true,
                deletedAt: new Date(),
                updatedAt: new Date(),
            },
        });

        if (before && !before.deleted) {
            await applyTagDiff(id, normalizeTags(before.tags), []);
        }

        return res;
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            throw new DeleteError(error, error.code);
        } else {
            throw new DeleteError(error as Error);
        }
    }
}

export async function HardDeletePost(id: string) {
    try {
        const before = await prisma.posts.findUnique({
            where: { id },
            select: { tags: true, deleted: true },
        });

        const res = await prisma.posts.delete({
            where: { id },
        });

        if (before && !before.deleted) {
            await applyTagDiff(id, normalizeTags(before.tags), []);
        }

        return res;
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            throw new DeleteError(error, error.code);
        } else {
            throw new DeleteError(error as Error);
        }
    }
}

export async function ErrorBoundary(fn: any) {
    try {
        return await fn();
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            throw new DeleteError(error, error.code);
        } else {
            throw new DeleteError(error as Error);
        }
    }
}
