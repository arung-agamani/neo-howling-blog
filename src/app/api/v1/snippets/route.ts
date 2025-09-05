import { NextRequest, NextResponse } from "next/server";
import { ListSnippets } from "@/lib/Snippet";
import { verifyRole } from "@/hooks/useRoleAuth";
import {
    BadRequest,
    InternalServerError,
    Unauthorized,
} from "@/app/api/responses";
import {
    SnippetFrontMatterAttributes,
    SnippetPayload,
    TSnippetFrontMatterAttributes,
} from "@/types";
import fm from "front-matter";
import prisma from "@/utils/prisma";
import { slugFromTitle } from "@/utils/slug";
import { FlattenErrors } from "@/lib/ZodError";
import jwt from "jsonwebtoken";

export const dynamic = "force-dynamic";

// GET /api/v1/snippets (list all snippets)
export async function GET(req: NextRequest) {
    if (!(await verifyRole(req, ["admin", "editor"]))) {
        return Unauthorized();
    }
    const snippets = await ListSnippets();
    return NextResponse.json(snippets);
}

// POST /api/v1/snippets (create new snippet)
export async function POST(req: NextRequest) {
    if (!(await verifyRole(req, ["admin", "editor"]))) {
        return Unauthorized();
    }

    try {
        const token = req.cookies.get("token")?.value;
        if (!token) {
            return Unauthorized();
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        const user = await prisma.users.findFirst({
            where: { username: decoded.username },
        });

        if (!user) {
            return Unauthorized();
        }

        const body = await req.json();
        const validate = SnippetPayload.safeParse(body.content || body);
        if (!validate.success) {
            return BadRequest({
                message: "Validation error",
                errors: FlattenErrors(validate.error),
            });
        }

        if (!fm.test(validate.data)) {
            return BadRequest({
                message: "No frontmatter attributes sent",
            });
        }

        const fmData = fm<TSnippetFrontMatterAttributes>(validate.data);
        const fmAttributes = fmData.attributes;
        const fmValidate = SnippetFrontMatterAttributes.safeParse(fmAttributes);
        if (!fmValidate.success) {
            return BadRequest({
                message: "Front-matter attributes are invalid.",
                errors: FlattenErrors(fmValidate.error),
            });
        }

        const snippet = await prisma.snippet.create({
            data: {
                title: fmAttributes.title,
                description: fmAttributes.description || "",
                type: "md",
                content: validate.data,
                datePosted: new Date(),
                ownerId: user.id,
                slug: slugFromTitle(fmAttributes.title),
            },
        });

        return NextResponse.json({
            success: true,
            message: "Snippet created",
            data: snippet,
        });
    } catch (error) {
        console.error("Error creating snippet:", error);
        return InternalServerError({
            message: "Internal server error",
        });
    }
}
