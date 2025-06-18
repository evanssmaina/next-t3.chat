import { db } from "@/server/db";
import { chat } from "@/server/db/schemas";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const { userId } = await auth();

    if (!userId) {
      throw new Error("User not authenticated");
    }

    console.log(`creating chat of user ${userId}`);
    const [data] = await db
      .insert(chat)
      .values({
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        title: "New Chat",
      })
      .returning();

    console.log(`created chat of user ${userId} data ${data}`);

    return NextResponse.json({ chatId: data.id });
  } catch (error) {
    console.error("Error creating chat:", error);
    return NextResponse.json(
      { error: "Failed to create chat" },
      { status: 500 },
    );
  }
}
