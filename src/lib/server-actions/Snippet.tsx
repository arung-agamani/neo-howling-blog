"use server";

import fm from "front-matter"

import {
    SnippetFrontMatterAttributes,
    SnippetPayload,
    TSnippetFrontMatterAttributes,
    TSnippetPayload,
    TSnippetResponse
} from "@/types";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import prisma from "@/utils/prisma"

export async function processMarkdown(data: TSnippetPayload): Promise<TSnippetResponse> {
    const session = await getServerSession(authOptions)
    if (session?.user?.role !== "admin") {
        return {
            success: false, message: "Unauthorized request"
        }
    }
    const user = await prisma.users.findFirst({
        where: {
            email: session.user.email!
        }
    })
    if (!user) {
        return {
            success: false, message: "User not found"
        }
    }
    try {
        const validate = SnippetPayload.safeParse(data)
        if (!validate.success) {
            return {
                success: false,
                message: "Validation error"
            }
        }
        if (!fm.test(validate.data)) {
            return {
                success: false,
                message: "No frontmatter attributes sent"
            }
        }
        const fmData = fm<TSnippetFrontMatterAttributes>(validate.data)
        const fmAttributes = fmData.attributes
        if (!SnippetFrontMatterAttributes.safeParse(fmAttributes).success) {
            return {
                success: false,
                message: "Front-matter attributes are invalid. Make sure 'title' is populated"
            }
        }
        const upsert = await prisma.snippet.upsert({
            where: {
                title: fmAttributes.title
            },
            create: {
                title: fmAttributes.title,
                description: fmAttributes.description || "",
                type: 'md',
                content: fmData.body,
                datePosted: new Date(),
                ownerId: user.id
            },
            update: {
                title: fmAttributes.title,
                content: fmData.body
            }
        })
        return {
            success: true,
            op: "upsert"
        }
    } catch (error) {
        console.error("Error on processMarkdown server action")
        console.log(error)
        return {
            success: false, message: "Internal server error"
        }
    }
}