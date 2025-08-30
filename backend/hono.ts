import { Hono } from "hono";
import { trpcServer } from "@hono/trpc-server";
import { cors } from "hono/cors";
import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";

// app will be mounted at /api
const app = new Hono();

// Enable CORS for all routes
app.use("*", cors());

// Mount tRPC router at /trpc
app.use(
  "/trpc/*",
  trpcServer({
    endpoint: "/api/trpc",
    router: appRouter,
    createContext,
  })
);

// Simple health check endpoint
app.get("/", (c) => {
  return c.json({ status: "ok", message: "API is running" });
});

// AI relay endpoint - keeps provider API keys on the server
// Accepts Vercel AI SDK style messages and forwards to OpenAI Chat Completions
app.post("/ai/llm", async (c) => {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey.trim().length === 0) {
      return c.json({ error: "AI provider is not configured" }, 500);
    }

    type ContentPart =
      | { type: "text"; text: string }
      | { type: "image"; image: string };

    type CoreMessage = {
      role: "system" | "user" | "assistant";
      content: string | ContentPart[];
    };

    const body = (await c.req.json()) as { messages: CoreMessage[] };
    const incoming = body?.messages ?? [];

    const openAIMessages = incoming.map((m) => {
      if (typeof m.content === "string") {
        return { role: m.role, content: m.content } as const;
      }

      const contentParts = (m.content as ContentPart[]).map((p) => {
        if (p.type === "text") {
          return { type: "text", text: p.text } as const;
        }
        const dataUrl = `data:image/jpeg;base64,${p.image}`;
        return { type: "image_url", image_url: { url: dataUrl } } as const;
      });

      return { role: m.role, content: contentParts } as const;
    });

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: openAIMessages,
        temperature: 0.2,
      }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      console.error("AI relay error:", resp.status, text);
      return c.json({ error: "Upstream AI error", details: text }, 500);
    }

    const data = (await resp.json()) as any;
    const choice = data.choices?.[0]?.message?.content;

    let completion = "";
    if (Array.isArray(choice)) {
      // OpenAI may return content parts
      completion = choice
        .map((part: any) => (part.type === "text" ? part.text : ""))
        .join("")
        .trim();
    } else if (typeof choice === "string") {
      completion = choice.trim();
    } else {
      completion = "";
    }

    return c.json({ completion });
  } catch (err) {
    console.error("AI relay exception:", err);
    return c.json({ error: "AI relay failed" }, 500);
  }
});

export default app;
