import { streamText, type UIMessage, stepCountIs, convertToModelMessages } from "ai";
import { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { model } from "@/lib/ai";
import { getSystemPrompt } from "@/lib/ai/system-prompt";
import { createTools } from "@/lib/ai/tools";
import { saveChatMessage, getChatHistory } from "@/lib/db/chat";

async function getUser() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    }
  );
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  return {
    id: user.id,
    name: (profile?.full_name as string) ?? "User",
    role: (profile?.role as string) ?? "student",
  };
}

// GET /api/chat — load history
export async function GET() {
  const user = await getUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const history = await getChatHistory(user.id);
  const messages = history.reverse().map((m) => ({
    id: m.id,
    role: m.role as "user" | "assistant",
    parts: [{ type: "text" as const, text: m.content }],
  }));

  return Response.json(messages);
}

// POST /api/chat — streaming chat
export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { messages } = (await request.json()) as { messages: UIMessage[] };

  // Save user message
  const lastUserMsg = messages.filter((m) => m.role === "user").at(-1);
  if (lastUserMsg) {
    const text = lastUserMsg.parts
      .filter((p): p is { type: "text"; text: string } => p.type === "text")
      .map((p) => p.text)
      .join("");
    if (text) {
      await saveChatMessage(user.id, "user", text);
    }
  }

  const tools = createTools(user.id, user.role);
  const systemPrompt = getSystemPrompt(user.name, user.role);

  const modelMessages = await convertToModelMessages(messages);

  const result = streamText({
    model,
    system: systemPrompt,
    messages: modelMessages,
    tools,
    stopWhen: stepCountIs(5),
    onFinish: async ({ text }) => {
      if (text) {
        await saveChatMessage(user.id, "assistant", text);
      }
    },
  });

  return result.toUIMessageStreamResponse();
}
