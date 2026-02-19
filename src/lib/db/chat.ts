import { db } from "@/lib/db";
import { chatMessages } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function getChatHistory(userId: string, limit = 50) {
  return db
    .select({
      id: chatMessages.id,
      role: chatMessages.role,
      content: chatMessages.content,
      createdAt: chatMessages.createdAt,
    })
    .from(chatMessages)
    .where(eq(chatMessages.userId, userId))
    .orderBy(desc(chatMessages.createdAt))
    .limit(limit);
}

export async function saveChatMessage(
  userId: string,
  role: "user" | "assistant",
  content: string
) {
  const [row] = await db
    .insert(chatMessages)
    .values({ userId, role, content })
    .returning();
  return row;
}
