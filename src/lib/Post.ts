import prisma from "@/utils/prisma";
import { Prisma } from "@prisma/client";

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
}

export async function CreatePost(data: CreatePostPayload) {
    const createRes = await prisma.posts.create({
        data: {
            ...data,
            deleted: false,

            datePosted: new Date(),
        },
    });
    return createRes;
}

export interface UpdatePostSchema {
    title?: string;
    author?: string;
    bannerUrl?: string;
    blogContent?: string;
    description?: string;
    isFeatured?: boolean;
    isPublished?: boolean;
    tags?: string[];
    deleted?: boolean;
}

export async function UpdatePost(id: string, data: UpdatePostSchema) {
    const res = await prisma.posts.update({
        where: {
            id,
        },
        data: {
            ...data,
            updatedAt: new Date(),
        },
    });

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
        const res = await prisma.posts.update({
            where: { id },
            data: {
                deleted: true,
                deletedAt: new Date(),
                updatedAt: new Date(),
            },
        });
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
