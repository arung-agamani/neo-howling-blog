import { InternalServerError, Unauthorized } from "@/app/api/responses";
import { verifyRole } from "@/hooks/useRoleAuth";
import { ListObjectsV2Command, S3Client } from "@aws-sdk/client-s3";
import { NextRequest, NextResponse } from "next/server";
import path from "path";

const client = new S3Client({
    region: "ap-southeast-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_UPLOADER,
        secretAccessKey: process.env.AWS_SECRET_KEY_UPLOADER,
    },
});

export async function GET(req: NextRequest) {
    if (!(await verifyRole(req, ["admin", "editor"]))) {
        return Unauthorized();
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
                    })),
            );
        }

        if (s3Prefixes) {
            files.push(
                ...s3Prefixes.map((prefix) => ({
                    id: prefix.Prefix!,
                    name: path.basename(prefix.Prefix!),
                    isDir: true,
                })),
            );
        }

        return NextResponse.json(files);
    } catch (error) {
        console.error("Something went wrong -- /api/dashboardv2/assets/list");
        console.log(error);
        return InternalServerError({
            message: "Something went wrong when retrieving object lists",
        });
    }
}
