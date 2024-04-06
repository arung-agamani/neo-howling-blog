import prisma from "@/utils/prisma";

export async function ListSnippets() {
    return await prisma.snippet.findMany({
        select: {
            id: true,
            title: true,
            description: true,
            content: true,
            owner: {
                select: {
                    id: true,
                    username: true,
                },
            },
            datePosted: true,
        },
        orderBy: {
            datePosted: "desc",
        },
    });
}

export async function GetSnippet(id: string) {
    return await prisma.snippet.findUnique({
        where: { id },
        select: {
            id: true,
            title: true,
            description: true,
            content: true,
            owner: {
                select: {
                    id: true,
                    username: true,
                },
            },
            datePosted: true,
        },
    });
}

export async function GetSnippetBySlug(slug: string) {
    return await prisma.snippet.findFirst({
        where: {
            slug,
        },
        select: {
            id: true,
            title: true,
            description: true,
            content: true,
            slug: true,
            datePosted: true,
            owner: {
                select: {
                    id: true,
                    username: true,
                },
            },
        },
    });
}
