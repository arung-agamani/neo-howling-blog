import { BadRequest, InternalServerError } from "@/app/api/responses";
import { DeleteAssetRequestParams } from "@/types";
import { s3Client } from "@/utils/aws-client";
import { DeleteObjectCommand, S3ServiceException } from "@aws-sdk/client-s3";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function DELETE(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams;
        const parseRes = DeleteAssetRequestParams.safeParse({
            key: searchParams.get("key"),
        });
        if (!parseRes.success) {
            return BadRequest();
        }
        const command = new DeleteObjectCommand({
            Bucket: process.env.BUCKET_NAME,
            Key: parseRes.data.key,
        });
        const res = await s3Client.send(command);
        return NextResponse.json({
            success: true,
            message: `Resource with key "${parseRes.data.key} has been deleted`,
        });
    } catch (error) {
        let message = "Unknown error";
        if (error instanceof S3ServiceException) {
            message = `Error on asset deletion: ${error.name} - ${error.message}`;
        }
        console.log(message);
        console.log(error);
        return InternalServerError({
            message,
        });
    }
}
