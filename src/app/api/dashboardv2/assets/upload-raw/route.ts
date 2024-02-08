import { BadRequest, Unauthorized } from "@/app/api/responses";
import { verifyRole } from "@/hooks/useRoleAuth";
import { FlattenErrors } from "@/lib/ZodError";
import { GeneratePUTSignedURLParams } from "@/types";
import { s3Client } from "@/utils/aws-client";
import { PutObjectCommand, S3ServiceException } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    if (!(await verifyRole(req, ["admin", "editor"]))) {
        return Unauthorized();
    }
    try {
        const body = await req.json();
        const parseRes = GeneratePUTSignedURLParams.safeParse(body);
        if (!parseRes.success) {
            return BadRequest({
                success: false,
                message: "Bad Request",
                errors: FlattenErrors(parseRes.error),
            });
        }
        const { prefix, filename, mime } = parseRes.data;
        const command = new PutObjectCommand({
            Bucket: process.env.BUCKET_NAME,
            Key: `${prefix}${filename}`,
            ContentType: mime,
        });
        const signedUrl = await getSignedUrl(s3Client, command, {
            expiresIn: 600,
        });
        return NextResponse.json({
            message: "Presigned URL generated",
            signedUrl,
            success: true,
        });
    } catch (error) {
        let message = "Unknown error";
        if (error instanceof S3ServiceException) {
            message = `Error on file creation: ${error.name} - ${error.message}`;
        }
        console.log(message);
        console.log(error);
        return NextResponse.json({
            success: false,
            message,
            errors: "Omitted",
        });
    }
}
