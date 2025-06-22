import { env } from "@/env";
import { logger } from "@/lib/logger";
import { S3 } from "@/lib/s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { auth } from "@clerk/nextjs/server";
import { type NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod/v4";

const log = logger.child({ module: "api/s3/upload" });

const uploadRequestSchema = z.object({
  fileName: z.string(),
  contentType: z.string(),
  size: z.number(),
});

export async function POST(request: NextRequest) {
  log.info("Starting s3 upload");
  try {
    const body = await request.json();
    const { userId } = await auth();

    if (!userId) {
      log.warn("Unauthorized. Please login to continue.");
      return new NextResponse("Unauthorized. Please login to continue.", {
        status: 401,
      });
    }

    const validation = uploadRequestSchema.safeParse(body);

    if (!validation.success) {
      log.warn("Invalid request body:", body);
      return NextResponse.json("Invalid Request Body", {
        status: 400,
      });
    }

    log.info("Received request body:", body);

    const { contentType, fileName, size } = validation.data;

    const uniqueKey = `${uuidv4()}-${fileName}`;

    log.info("Creating put object command:", {
      uniqueKey,
      contentType,
      size,
    });
    const command = new PutObjectCommand({
      Bucket: env.AWS_BUCKET_NAME,
      Key: uniqueKey,
      ContentType: contentType,
      ContentLength: size,
    });

    log.info("Generated put object command:", {
      uniqueKey,
      contentType,
      size,
    });

    log.info("Generating presigned URL for upload:", {
      uniqueKey,
      contentType,
      size,
    });
    const presignedUrl = await getSignedUrl(S3, command, {
      expiresIn: 360, // 6 minutes
    });

    log.info("Generated presigned URL for upload:", {
      uniqueKey,
      contentType,
      size,
    });

    const response = {
      presignedUrl,
      key: uniqueKey,
    };

    log.info("Response:", response);

    log.info("Finished s3 upload successfully");
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    log.error("Error uploading file:", error);
    log.error("Finished s3 upload with error");
    return NextResponse.json("Internal Server Error", {
      status: 500,
    });
  }
}
