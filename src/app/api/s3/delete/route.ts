import { env } from "@/env";
import { S3 } from "@/lib/s3";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { auth } from "@clerk/nextjs/server";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod/v4";

const deleteRequestSchema = z.object({
  key: z.string(),
});

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized. Please login to continue.", {
        status: 401,
      });
    }

    console.log(body);

    const validation = deleteRequestSchema.safeParse(body);

    if (!validation.success) {
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

    await S3.send(
      new DeleteObjectCommand({ Bucket: env.AWS_BUCKET_NAME, Key: key }),
    );

    return new NextResponse("File deleted successfully", {
      status: 200,
    });
  } catch (error) {
    console.error(error);
    return new NextResponse("Internal Server Error", {
      status: 500,
    });
  }
}
