import {
    InternalServerError,
    Unauthorized,
    BadRequest,
} from "@/app/api/responses";
import {
    ListObjectsV2Command,
    DeleteObjectCommand,
    S3ServiceException,
    S3Client,
    PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { z, ZodError } from "zod";
import { s3Client } from "@/utils/aws-client";
import { DeleteAssetRequestParams, GeneratePUTSignedURLParams } from "@/types";
import { FlattenErrors } from "@/lib/ZodError";
import { authorizeV2, logV2Usage } from "@/lib/v2auth";

const client = new S3Client({
    region: "ap-southeast-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_UPLOADER,
        secretAccessKey: process.env.AWS_SECRET_KEY_UPLOADER,
    },
});

// GET /api/v2/assets?prefix=...
export async function GET(req: NextRequest) {
    const auth = await authorizeV2(req, {
        roles: ["admin", "editor"],
        scope: "assets:read",
    });

    if (!auth.authenticated) {
        await logV2Usage(req, auth, 401);
        return Unauthorized({ message: auth.error || "Unauthorized" });
    }

    const searchParams = req.nextUrl.searchParams;
    const prefix = searchParams.get("prefix") || "";

    try {
        const command = new ListObjectsV2Command({
            Bucket: process.env.BUCKET_NAME,
            Delimiter: "/",
            Prefix: prefix !== "/" ? prefix : "",
        });
        const res = await client.send(command);
        const files = [];
        const s3Objects = res.Contents;
        const s3Prefixes = res.CommonPrefixes;

        if (s3Objects) {
            files.push(
                ...s3Objects
                    .filter((obj) => obj.Key !== prefix)
                    .map((obj) => ({
                        id: obj.Key!,
                        name: path.basename(obj.Key!),
                        modDate: obj.LastModified,
                        size: obj.Size,
                        isDir: false,
                    }))
            );
        }
        if (s3Prefixes) {
            files.push(
                ...s3Prefixes.map((prefix) => ({
                    id: prefix.Prefix!,
                    name: path.basename(prefix.Prefix!),
                    isDir: true,
                }))
            );
        }

        await logV2Usage(req, auth, 200);
        return NextResponse.json({ files });
    } catch (error) {
        console.error(error);
        await logV2Usage(req, auth, 500);
        return InternalServerError();
    }
}

// POST /api/v2/assets (for presigned upload URL)
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

export async function POST(req: NextRequest) {
    const auth = await authorizeV2(req, {
        roles: ["admin", "editor"],
        scope: "assets:write",
    });

    if (!auth.authenticated) {
        await logV2Usage(req, auth, 401);
        return Unauthorized({ message: auth.error || "Unauthorized" });
    }

    try {
        const body = await req.json();

        // Support both upload and upload-raw
        if (
            body &&
            body.prefix !== undefined &&
            body.filename !== undefined &&
            body.mime !== undefined
        ) {
            // upload-raw
            const parseRes = GeneratePUTSignedURLParams.safeParse(body);
            if (!parseRes.success) {
                await logV2Usage(req, auth, 400);
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

            await logV2Usage(req, auth, 200);
            return NextResponse.json({
                message: "Presigned URL generated",
                signedUrl,
                success: true,
            });
        } else {
            // Standard upload
            const parseRes = UploadInputParams.safeParse(body);
            if (!parseRes.success) {
                await logV2Usage(req, auth, 400);
                return BadRequest({
                    message: "Invalid request payload",
                });
            }
            const command = new PutObjectCommand({
                Bucket: process.env.BUCKET_NAME,
                Key: `${parseRes.data.date.year}/${parseRes.data.date.month}/${parseRes.data.date.day}/${parseRes.data.name}`,
                ContentType: parseRes.data.mime,
            });
            const signedUrl = await getSignedUrl(s3Client, command, {
                expiresIn: 600,
            });

            await logV2Usage(req, auth, 200);
            return NextResponse.json({
                message: "Presigned URL generated",
                data: signedUrl,
            });
        }
    } catch (error) {
        if (error instanceof ZodError) {
            console.log(JSON.stringify(error));
            await logV2Usage(req, auth, 400);
            return BadRequest({
                message: "Invalid request payload",
            });
        }
        await logV2Usage(req, auth, 500);
        return InternalServerError();
    }
}

// DELETE /api/v2/assets?key=...
export async function DELETE(req: NextRequest) {
    const auth = await authorizeV2(req, {
        roles: ["admin", "editor"],
        scope: "assets:delete",
    });

    if (!auth.authenticated) {
        await logV2Usage(req, auth, 401);
        return Unauthorized({ message: auth.error || "Unauthorized" });
    }

    try {
        const searchParams = req.nextUrl.searchParams;
        const parseRes = DeleteAssetRequestParams.safeParse({
            key: searchParams.get("key"),
        });
        if (!parseRes.success) {
            await logV2Usage(req, auth, 400);
            return BadRequest();
        }
        const command = new DeleteObjectCommand({
            Bucket: process.env.BUCKET_NAME,
            Key: parseRes.data.key,
        });
        await s3Client.send(command);

        await logV2Usage(req, auth, 200);
        return NextResponse.json({
            success: true,
            message: `Resource with key "${parseRes.data.key}" has been deleted`,
        });
    } catch (error) {
        let message = "Unknown error";
        if (error instanceof S3ServiceException) {
            message = `Error on asset deletion: ${error.name} - ${error.message}`;
        }
        console.log(message);
        console.log(error);
        await logV2Usage(req, auth, 500);
        return InternalServerError({
            message,
        });
    }
}
