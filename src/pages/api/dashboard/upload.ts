import {
    S3Client,
    ListBucketsCommand,
    PutObjectCommand,
} from "@aws-sdk/client-s3";
import type { NextApiRequest, NextApiResponse } from "next";
import { createRouter } from "next-connect";
import { verifyToken } from "@/utils/jwt";
import { z, ZodError } from "zod";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
const router = createRouter<NextApiRequest, NextApiResponse>();
router.use(verifyToken);
// TODO: Add security headers

const client = new S3Client({
    region: "ap-southeast-1",
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY,
        secretAccessKey: process.env.AWS_SECRET_KEY,
    },
});

router.get(async (req, res) => {
    const command = new ListBucketsCommand({});
    try {
        const response = await client.send(command);
        return res.json({
            status: "Success",
            data: response,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Something went wrong",
        });
    }
});

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

router.post(async (req, res) => {
    try {
        const parseRes = UploadInputParams.parse(req.body);
        const command = new PutObjectCommand({
            Bucket: "howling-blog-uploads",
            Key: `${parseRes.date.year}/${parseRes.date.month}/${parseRes.date.day}/${parseRes.name}`,
            ContentType: parseRes.mime,
        });
        const signedUrl = await getSignedUrl(client, command, {
            expiresIn: 600,
        });
        return res.json({
            message: "Good request",
            data: signedUrl,
        });
    } catch (error) {
        if (error instanceof ZodError) {
            console.log(JSON.stringify(error));
            return res.status(400).json({
                message: "Bad request",
            });
        } else {
            console.log(error);
            return res.status(500).json({
                message: "Unknown error",
            });
        }
    }
});

export default router.handler();
