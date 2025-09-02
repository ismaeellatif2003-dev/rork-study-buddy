import app from './hono';

const port = process.env.PORT || 3000;

export default {
  port,
  fetch: app.fetch,
};

// For local development
if (import.meta.main) {
  Bun.serve({
    port,
    fetch: app.fetch,
  });
  console.log(`🚀 Server running on http://localhost:${port}`);
}
