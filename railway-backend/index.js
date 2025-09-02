const { serve } = require('@hono/node-server');
const app = require('./hono.js');

const port = process.env.PORT || 3000;
const host = '0.0.0.0'; // Bind to all interfaces for Railway

console.log(`🚀 Starting Study Buddy Backend on port ${port}...`);
console.log(`📦 Node version: ${process.version}`);
console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);

const server = serve({
  fetch: app.fetch,
  port,
  host
});

console.log(`✅ Server running on http://${host}:${port}`);

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Received SIGTERM, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 Received SIGINT, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});
