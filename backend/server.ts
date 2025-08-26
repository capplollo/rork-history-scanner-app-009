import app from "./hono";

// Start the server on port 8081
const port = 8081;

Bun.serve({
  fetch: app.fetch,
  port,
});

console.log(`🚀 Backend server running on http://localhost:${port}`);