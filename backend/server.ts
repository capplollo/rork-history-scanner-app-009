import app from "./hono";

// Start the server on port 8081
const port = process.env.PORT || 8081;

console.log(`🚀 Starting Heritage Scanner API server on port ${port}`);
console.log(`📍 Health check: http://localhost:${port}/api`);
console.log(`🔧 tRPC endpoint: http://localhost:${port}/api/trpc`);

Bun.serve({
  fetch: app.fetch,
  port: Number(port),
  hostname: "0.0.0.0",
});

console.log(`✅ Heritage Scanner API server running on http://localhost:${port}`);
console.log(`🔑 OpenAI API Key configured: ${process.env.OPENAI_API_KEY ? 'Yes' : 'No'}`);
console.log(`📊 Supabase URL: ${process.env.EXPO_PUBLIC_SUPABASE_URL ? 'Configured' : 'Not configured'}`);
