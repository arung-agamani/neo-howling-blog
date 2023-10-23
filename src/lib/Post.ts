import prisma from "@/utils/prisma";

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
    bannerUrl: string;
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

export async function UpdatePost(id: string, ...data: any[]) {
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
        data: { isPublished: publish },
    });

    return res;
}
