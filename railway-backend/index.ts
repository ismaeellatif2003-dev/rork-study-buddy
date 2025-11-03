import { serve } from '@hono/node-server';
import app from './hono';
import { checkAndRunAIMigration } from './database/auto-migrate-on-startup';

const port = parseInt(process.env.PORT || '3000', 10);
const host = '0.0.0.0'; // Bind to all interfaces for Railway

console.log(`🚀 Starting Study Buddy Backend on port ${port}...`);
console.log(`📦 Node version: ${process.version}`);
console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);

// Run AI migration check on startup (non-blocking)
checkAndRunAIMigration().catch(err => {
  console.error('⚠️  AI migration check error (non-fatal):', err);
});

const server = serve({
  fetch: app.fetch,
  port
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
