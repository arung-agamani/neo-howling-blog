"use server";
import { s3Client } from "@/utils/aws-client";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export async function ServerUpload(
    prefix: string,
    fileName: string,
    mime: string
) {
    try {
        const command = new PutObjectCommand({
            Bucket: process.env.BUCKET_NAME,
            Key: `${prefix}${fileName}`,
            ContentType: mime,
        });
        const signedUrl = await getSignedUrl(s3Client, command, {
            expiresIn: 600,
        });
        return {
            success: true,
            signedUrl,
        };
    } catch (error) {
        console.log(error);
        return {
            success: false,
            message: "Something went wrong",
            signedUrl: "",
        };
    }
}

export async function ServerUploadTest(prefix: string, fileName: string) {
    return {
        success: true,
        signedUrl: `${prefix}${fileName}`,
    };
}
