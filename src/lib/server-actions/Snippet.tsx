"use server";

import fm from "front-matter";

import {
    SnippetFrontMatterAttributes,
    SnippetPayload,
    TSnippetFrontMatterAttributes,
    TSnippetPayload,
    TSnippetResponse,
} from "@/types";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import prisma from "@/utils/prisma";
import { roleBfs } from "../RBAC";
import { roles } from "@/app/(admin)/dashboard/main/roles";
import { slugFromTitle } from "@/utils/slug";
import { FlattenErrors } from "../ZodError";

export async function processMarkdown(
    data: TSnippetPayload,
    id: string | null | undefined
): Promise<TSnippetResponse> {
    const session = await getServerSession(authOptions);
    if (
        !session?.user ||
        !roleBfs(roles[session?.user?.role || "guest"], "editor")
    ) {
        return {
            success: false,
            message: "Unauthorized request",
        };
    }
    const user = await prisma.users.findFirst({
        where: {
            email: session.user.email!,
        },
    });
    if (!user) {
        return {
            success: false,
            message: "User not found",
        };
    }
    try {
        const validate = SnippetPayload.safeParse(data);
        if (!validate.success) {
            return {
                success: false,
                message: "Validation error",
            };
        }
        if (!fm.test(validate.data)) {
            return {
                success: false,
                message: "No frontmatter attributes sent",
            };
        }
        const fmData = fm<TSnippetFrontMatterAttributes>(validate.data);
        const fmAttributes = fmData.attributes;
        const fmValidate = SnippetFrontMatterAttributes.safeParse(fmAttributes);
        if (!fmValidate.success) {
            return {
                success: false,
                message: "Front-matter attributes are invalid.",
                errors: FlattenErrors(fmValidate.error),
            };
        }
        if (!id) id = "000000000000000000000000";
        const upsert = await prisma.snippet.upsert({
            where: {
                id,
            },
            create: {
                title: fmAttributes.title,
                description: fmAttributes.description || "",
                type: "md",
                content: validate.data,
                datePosted: new Date(),
                ownerId: user.id,
                slug: slugFromTitle(fmAttributes.title),
            },
            update: {
                title: fmAttributes.title,
                description: fmAttributes.description || "",
                content: validate.data,
            },
        });
        return {
            success: true,
            op: "upsert",
        };
    } catch (error) {
        console.error("Error on processMarkdown server action");
        console.log(error);
        return {
            success: false,
            message: "Internal server error",
        };
    }
}

export async function deleteSnippet(id: string) {
    const session = await getServerSession(authOptions);
    if (
        !session?.user ||
        !roleBfs(roles[session?.user?.role || "guest"], "editor")
    ) {
        return {
            success: false,
            message: "Unauthorized request",
        };
    }
    try {
        const del = await prisma.snippet.delete({
            where: {
                id,
            },
        });
        return {
            success: true,
            message: "Snippet deleted",
        };
    } catch (error) {
        return {
            success: false,
            message: "Internal server error",
        };
    }
}
