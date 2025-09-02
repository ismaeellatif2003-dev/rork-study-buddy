const { Hono } = require("hono");
const { trpcServer } = require("@hono/trpc-server");
const { cors } = require("hono/cors");

// Create a simple app for now (without tRPC to test basic functionality)
const app = new Hono();

// Enable CORS for all routes
app.use("*", cors());

// Health check endpoint
app.get("/health", (c) => {
  return c.json({ 
    status: "healthy", 
    timestamp: new Date().toISOString(),
    version: "1.0.0",
    message: "Study Buddy API is running"
  });
});

// Metrics endpoint
app.get("/metrics", (c) => {
  return c.json({
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.version,
    platform: process.platform
  });
});

// Root endpoint
app.get("/", (c) => {
  return c.json({ 
    status: "ok", 
    message: "Study Buddy API is running",
    endpoints: {
      health: "/health",
      metrics: "/metrics"
    }
  });
});

// Test subscription endpoint
app.post("/trpc/subscription.verifyPurchase", async (c) => {
  try {
    const body = await c.req.json();
    
    // Mock verification response
    const subscription = {
      id: `sub_${Date.now()}`,
      planId: body.productId.includes('yearly') ? 'pro_yearly' : 'pro_monthly',
      status: 'active',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + (body.productId.includes('yearly') ? 365 : 30) * 24 * 60 * 60 * 1000).toISOString(),
      autoRenew: true,
      transactionId: body.transactionId,
      originalTransactionId: body.originalTransactionId || body.transactionId,
    };
    
    return c.json({
      success: true,
      subscription
    });
  } catch (error) {
    return c.json({
      success: false,
      error: 'Verification failed'
    }, 400);
  }
});

module.exports = app;
