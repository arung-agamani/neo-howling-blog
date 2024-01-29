"use server";
import { s3Client } from "@/utils/aws-client";
import {
    DeleteObjectCommand,
    PutObjectCommand,
    S3ServiceException,
} from "@aws-sdk/client-s3";
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

export async function ServerDeleteAsset(key: string) {
    if (!key)
        return {
            success: false,
            message: "Bad key",
        };
    try {
        const command = new DeleteObjectCommand({
            Bucket: process.env.BUCKET_NAME,
            Key: key,
        });
        const deleteRes = await s3Client.send(command);
        return {
            success: true,
            message: `Resource with key "${key} has been deleted`,
        };
    } catch (error) {
        let message = "Unknown error";
        if (error instanceof S3ServiceException) {
            message = `Error on asset deletion: ${error.name} - ${error.message}`;
        }
        console.log(message);
        console.log(error);
        return {
            success: false,
            message,
        };
    }
}

export async function ServerUploadTest(prefix: string, fileName: string) {
    return {
        success: true,
        signedUrl: `${prefix}${fileName}`,
    };
}
