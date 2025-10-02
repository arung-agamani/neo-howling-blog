import { NextRequest, NextResponse } from "next/server";
import { GetSnippet } from "@/lib/Snippet";
import {
    BadRequest,
    InternalServerError,
    NotFound,
    Unauthorized,
} from "@/app/api/responses";
import { verifyRole } from "@/hooks/useRoleAuth";
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

// GET /api/v1/snippets/[id] (get snippet by id)
export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const id = params.id;
    if (!id) return BadRequest();
    const snippet = await GetSnippet(id);
    if (!snippet) return NotFound();
    return NextResponse.json(snippet);
}

// PATCH /api/v1/snippets/[id] (update snippet)
export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
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

        const snippet = await prisma.snippet.update({
            where: { id: params.id },
            data: {
                title: fmAttributes.title,
                description: fmAttributes.description || "",
                content: validate.data,
                slug: slugFromTitle(fmAttributes.title),
            },
        });

        return NextResponse.json({
            success: true,
            message: "Snippet updated",
            data: snippet,
        });
    } catch (error) {
        console.error("Error updating snippet:", error);
        return InternalServerError({
            message: "Internal server error",
        });
    }
}

// DELETE /api/v1/snippets/[id] (delete snippet)
export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    if (!(await verifyRole(req, ["admin", "editor"]))) {
        return Unauthorized();
    }

    try {
        await prisma.snippet.delete({
            where: { id: params.id },
        });

        return NextResponse.json({
            success: true,
            message: "Snippet deleted",
        });
    } catch (error) {
        console.error("Error deleting snippet:", error);
        return InternalServerError({
            message: "Internal server error",
        });
    }
}
