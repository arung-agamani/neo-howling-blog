import {
    BadRequest,
    InternalServerError,
    Unauthorized,
} from "@/app/api/responses";
import { verifyRole } from "@/hooks/useRoleAuth";
import { s3Client } from "@/utils/aws-client";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";

export const dynamic = "force-dynamic";

const UploadInputParams = z.object({
    name: z.string(),
    date: z.object({
        year: z.number(),
        month: z.number(),
        day: z.number(),
    }),
    mime: z.string(),
    size: z.number(),
});
type UploadInputParams = z.infer<typeof UploadInputParams>;

export async function POST(req: NextRequest) {
    if (!(await verifyRole(req, ["admin", "editor"]))) {
        return Unauthorized();
    }
    try {
        const body = await req.json();
        const parseRes = UploadInputParams.parse(body);
        const command = new PutObjectCommand({
            Bucket: process.env.BUCKET_NAME,
            Key: `${parseRes.date.year}/${parseRes.date.month}/${parseRes.date.day}/${parseRes.name}`,
            ContentType: parseRes.mime,
        });
        const signedUrl = await getSignedUrl(s3Client, command, {
            expiresIn: 600,
        });
        return NextResponse.json({
            message: "Presigned URL generated",
            data: signedUrl,
        });
    } catch (error) {
        if (error instanceof ZodError) {
            console.log(JSON.stringify(error));
            return BadRequest({
                message: "Invalid request payload",
            });
        } else {
            console.log(error);
            return InternalServerError({
                message: "Unknown error",
            });
        }
    }
}
