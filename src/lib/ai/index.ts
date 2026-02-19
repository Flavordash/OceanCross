import { openai } from "@ai-sdk/openai";

// ── Model Configuration ────────────────────────────────
// Change model here to switch globally.
// Current: OpenAI GPT-4o
// Future options: groq("llama-3.3-70b-versatile"), anthropic("claude-sonnet-4-20250514"), etc.

export const model = openai("gpt-4o");
