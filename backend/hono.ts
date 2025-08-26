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

// OpenAI API proxy endpoint
app.post("/api/openai/chat", async (c) => {
  try {
    const body = await c.req.json();
    const { messages, model = 'gpt-4o', max_tokens = 4000, temperature = 0.7 } = body;

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

    if (!OPENAI_API_KEY || OPENAI_API_KEY === 'YOUR_OPENAI_API_KEY_HERE') {
      console.error('❌ OpenAI API key not configured properly');
      return c.json({
        error: 'API key not configured',
        message: 'OpenAI API key is missing or invalid'
      }, 500);
    }

    console.log('🔑 Backend API - Using server-side API key');
    console.log('🔑 API Key configured:', OPENAI_API_KEY.substring(0, 20) + '...');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens,
        temperature,
      })
    });

    console.log('✅ OpenAI API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ OpenAI API error details:');
      console.error('Status:', response.status, response.statusText);
      console.error('Response body:', errorText);
      
      return c.json({
        error: 'OpenAI API error',
        status: response.status,
        details: errorText
      }, 400);
    }

    const data = await response.json();
    console.log('✅ OpenAI response received successfully');
    
    return c.json(data);
  } catch (error) {
    console.error('❌ Backend API error:', error);
    return c.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// Image analysis endpoint
app.post("/api/openai/analyze-image", async (c) => {
  try {
    const body = await c.req.json();
    const { prompt, base64Image, model = 'gpt-4o', max_tokens = 4000, temperature = 0.7 } = body;

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'YOUR_OPENAI_API_KEY_HERE';

    console.log('🔑 Backend API - Analyzing image with server-side API key');

    const messages = [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: prompt
          },
          {
            type: 'image_url',
            image_url: {
              url: `data:image/jpeg;base64,${base64Image}`
            }
          }
        ]
      }
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens,
        temperature,
      })
    });

    console.log('OpenAI API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error details:');
      console.error('Status:', response.status, response.statusText);
      console.error('Response body:', errorText);
      
      return c.json({
        error: 'OpenAI API error',
        status: response.status,
        details: errorText
      }, 400);
    }

    const data = await response.json();
    console.log('OpenAI image analysis completed successfully');
    
    // Extract the completion from OpenAI response and format it for our service
    const completion = data.choices?.[0]?.message?.content || '';
    
    return c.json({ completion });
  } catch (error) {
    console.error('Backend API error:', error);
    return c.json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

export default app;