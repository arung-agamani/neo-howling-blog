"use server";
import { s3Client } from "@/utils/aws-client";
import {
    CopyObjectCommand,
    DeleteObjectCommand,
    PutObjectCommand,
    S3ServiceException,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const BUCKET = process.env.BUCKET_NAME;

export async function ServerUpload(
    prefix: string,
    fileName: string,
    mime: string,
) {
    console.log(`Incoming upload ${prefix}${fileName} with mimetype ${mime}`);
    try {
        const command = new PutObjectCommand({
            Bucket: BUCKET,
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

export async function ServerCreateDirectory(prefix: string, dirname: string) {
    try {
        const command = new PutObjectCommand({
            Bucket: BUCKET,
            Key: `${prefix}${dirname}/`,
        });
        const mkdirRes = await s3Client.send(command);
        return {
            success: true,
            message: `Directory "${dirname}" has been created`,
        };
    } catch (error) {
        let message = "Unknown error";
        if (error instanceof S3ServiceException) {
            message = `Error on folder creation: ${error.name} - ${error.message}`;
        }
        console.log(message);
        console.log(error);
        return {
            success: false,
            message,
        };
    }
}

export async function ServerRenameAsset(source: string, target: string) {
    try {
        console.log(`BUCKET is ${BUCKET}\n${source}\n${target}`);
        const copyCommand = new CopyObjectCommand({
            Bucket: BUCKET,
            CopySource: `${BUCKET}/${source}`,
            Key: target,
        });
        await s3Client.send(copyCommand);
        const deleteCommand = new DeleteObjectCommand({
            Bucket: BUCKET,
            Key: source,
        });
        await s3Client.send(deleteCommand);
        return {
            success: true,
            source,
            target,
            message: `Object renamed from ${source} to ${target}`,
        };
    } catch (error) {
        let message = "Unknown error";
        if (error instanceof S3ServiceException) {
            message = `Error on object renaming: ${error.name} - ${error.message}`;
        }
        console.log(message);
        console.log(error);
        return {
            success: false,
            message,
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
            Bucket: BUCKET,
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
