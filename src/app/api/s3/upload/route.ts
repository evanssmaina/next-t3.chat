import { env } from "@/env";
import { S3 } from "@/lib/s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { auth } from "@clerk/nextjs/server";
import { type NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod/v4";

const uploadRequestSchema = z.object({
  fileName: z.string(),
  contentType: z.string(),
  size: z.number(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized. Please login to continue.", {
        status: 401,
      });
    }

    const validation = uploadRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json("Invalid Request Body", {
        status: 400,
      });
    }

    console.log(validation.data);

    const { contentType, fileName, size } = validation.data;

    const uniqueKey = `${uuidv4()}-${fileName}`;

    const command = new PutObjectCommand({
      Bucket: env.AWS_BUCKET_NAME,
      Key: uniqueKey,
      ContentType: contentType,
      ContentLength: size,
    });

    const presignedUrl = await getSignedUrl(S3, command, {
      expiresIn: 360, // 6 minutes
    });

    const response = {
      presignedUrl,
      key: uniqueKey,
    };

    console.log(response);

    return NextResponse.json(response, { status: 200 });
  } catch {
    return NextResponse.json("Internal Server Error", {
      status: 500,
    });
  }
}
