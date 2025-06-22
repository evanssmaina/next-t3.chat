import { env } from "@/env";
import { logger } from "@/lib/logger";
import { S3 } from "@/lib/s3";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { auth } from "@clerk/nextjs/server";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";

const log = logger.child({ module: "api/s3/delete" });

const deleteRequestSchema = z.object({
  key: z.string(),
});

export async function DELETE(request: NextRequest) {
  log.info("Starting s3 delete");
  try {
    const body = await request.json();
    const { userId } = await auth();

    if (!userId) {
      log.warn("Unauthorized. Please login to continue.");
      return new NextResponse("Unauthorized. Please login to continue.", {
        status: 401,
      });
    }

    log.info("Received request body:", body);

    const validation = deleteRequestSchema.safeParse(body);

    if (!validation.success) {
      log.warn("Invalid request body:", body);
      return NextResponse.json(
        {
          error: "Invalid Request Body",
        },
        {
          status: 400,
        },
      );
    }

    const { key } = validation.data;

    log.info("Deleting file from S3:", { key });
    await S3.send(
      new DeleteObjectCommand({ Bucket: env.AWS_BUCKET_NAME, Key: key }),
    );
    log.info("File deleted successfully from S3:", { key });

    log.info("Finished s3 delete successfully");

    return new NextResponse("File deleted successfully", {
      status: 200,
    });
  } catch (error) {
    log.error("Error deleting file:", error);
    log.error("Finished s3 delete with error");
    return new NextResponse("Internal Server Error", {
      status: 500,
    });
  }
}
