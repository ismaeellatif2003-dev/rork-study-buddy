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

// AI Text Generation endpoint
app.post("/ai/generate", async (c) => {
  try {
    const body = await c.req.json();
    const { messages, type = 'text' } = body;

    if (!messages || !Array.isArray(messages)) {
      return c.json({ error: 'Invalid messages format' }, 400);
    }

    // For now, return a mock response until you integrate with a real AI service
    let response;
    switch (type) {
      case 'flashcards':
        response = [
          { question: "What is the main topic?", answer: "The main topic is the primary subject being discussed." },
          { question: "Define key concept", answer: "A key concept is a fundamental idea or principle." },
          { question: "What are the steps?", answer: "The steps are the sequential actions or processes." }
        ];
        break;
      case 'summary':
        response = "This is a summary of the provided content. Key points include:\n• Main concept overview\n• Important details\n• Key takeaways";
        break;
      default:
        response = "This is an AI-generated response based on your input. The actual AI service will be available when integrated with an AI provider.";
    }

    return c.json({ 
      success: true, 
      response,
      type,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('AI generation error:', error);
    return c.json({ error: 'Failed to generate AI response' }, 500);
  }
});

// AI Flashcard endpoint
app.post("/ai/flashcards", async (c) => {
  try {
    const body = await c.req.json();
    const { content, count = 5 } = body;

    if (!content) {
      return c.json({ error: 'Content is required' }, 400);
    }

    // Mock flashcard generation
    const flashcards = Array.from({ length: Math.min(count, 10) }, (_, i) => ({
      question: `Question ${i + 1} about the content`,
      answer: `Answer ${i + 1} explaining the concept`
    }));

    return c.json({ 
      success: true, 
      flashcards,
      count: flashcards.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Flashcard generation error:', error);
    return c.json({ error: 'Failed to generate flashcards' }, 500);
  }
});

// Root endpoint
app.get("/", (c) => {
  return c.json({ 
    status: "ok", 
    message: "Study Buddy API is running",
    endpoints: {
      health: "/health",
      metrics: "/metrics",
      trpc: "/trpc",
      ai: {
        generate: "/ai/generate",
        flashcards: "/ai/flashcards"
      }
    }
  });
});

export default app;