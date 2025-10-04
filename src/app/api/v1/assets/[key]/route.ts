import { InternalServerError, Unauthorized } from "@/app/api/responses";
import { verifyRole } from "@/hooks/useRoleAuth";
import {
    S3Client,
    GetObjectCommand,
    DeleteObjectCommand,
    S3ServiceException,
} from "@aws-sdk/client-s3";
import { NextRequest, NextResponse } from "next/server";

const client = new S3Client({
    region: "ap-southeast-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_UPLOADER,
        secretAccessKey: process.env.AWS_SECRET_KEY_UPLOADER,
    },
});

// GET /api/v1/assets/[key] (fetch asset metadata)
export async function GET(req: NextRequest, props: { params: Promise<{ key: string }> }) {
    const params = await props.params;
    if (!(await verifyRole(req, ["admin", "editor"]))) {
        return Unauthorized();
    }
    try {
        const command = new GetObjectCommand({
            Bucket: process.env.BUCKET_NAME,
            Key: params.key,
        });
        const res = await client.send(command);
        // Only return metadata, not the file itself
        return NextResponse.json({
            key: params.key,
            contentType: res.ContentType,
            contentLength: res.ContentLength,
            lastModified: res.LastModified,
        });
    } catch (error) {
        let message = "Unknown error";
        if (error instanceof S3ServiceException) {
            message = `Error on asset fetch: ${error.name} - ${error.message}`;
        }
        return InternalServerError({ message });
    }
}

// DELETE /api/v1/assets/[key]
export async function DELETE(req: NextRequest, props: { params: Promise<{ key: string }> }) {
    const params = await props.params;
    if (!(await verifyRole(req, ["admin", "editor"]))) {
        return Unauthorized();
    }
    try {
        const command = new DeleteObjectCommand({
            Bucket: process.env.BUCKET_NAME,
            Key: params.key,
        });
        await client.send(command);
        return NextResponse.json({
            success: true,
            message: `Resource with key "${params.key}" has been deleted`,
        });
    } catch (error) {
        let message = "Unknown error";
        if (error instanceof S3ServiceException) {
            message = `Error on asset deletion: ${error.name} - ${error.message}`;
        }
        return InternalServerError({ message });
    }
}
