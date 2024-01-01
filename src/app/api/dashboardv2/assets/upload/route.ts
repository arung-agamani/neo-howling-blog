import { NextRequest, NextResponse } from "next/server";
import prisma from "@/utils/prisma";
import { ZodError, z } from "zod";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { BadRequest, InternalServerError } from "@/app/api/responses";

export const dynamic = "force-dynamic";

const client = new S3Client({
  region: "ap-southeast-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_UPLOADER,
    secretAccessKey: process.env.AWS_SECRET_KEY_UPLOADER,
  },
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parseRes = UploadInputParams.parse(body);
    const command = new PutObjectCommand({
      Bucket: process.env.BUCKET_NAME,
      Key: `${parseRes.date.year}/${parseRes.date.month}/${parseRes.date.day}/${parseRes.name}`,
      ContentType: parseRes.mime,
    });
    const signedUrl = await getSignedUrl(client, command, {
      expiresIn: 600,
    });
    return NextResponse.json({
      message: "Presigned URL generated",
      data: signedUrl,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      console.log(JSON.stringify(error));
      return BadRequest({
        message: "Invalid request payload",
      });
    } else {
      console.log(error);
      return InternalServerError({
        message: "Unknown error",
      });
    }
  }
}
