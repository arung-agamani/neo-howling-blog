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
                    username: true
                }
            },
            datePosted: true
        },
        orderBy: {
            datePosted: "desc"
        }
    })
}