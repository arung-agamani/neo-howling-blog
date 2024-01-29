import { S3Client } from "@aws-sdk/client-s3";

export const s3Client = new S3Client({
    region: "ap-southeast-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_UPLOADER,
        secretAccessKey: process.env.AWS_SECRET_KEY_UPLOADER,
    },
});
