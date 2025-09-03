import { Hono } from "hono";
import { trpcServer } from "@hono/trpc-server";
import { cors } from "hono/cors";
import { appRouter } from "./trpc/app-router";
import { createContext } from "./trpc/create-context";
import OpenAI from 'openai';

// Initialize OpenRouter client
const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY || '',
  defaultHeaders: {
    'HTTP-Referer': 'https://rork-study-buddy-production-eeeb.up.railway.app',
    'X-Title': 'Study Buddy App',
  },
});

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

// OpenRouter AI Text Generation endpoint using SDK
app.post("/ai/generate", async (c) => {
  let type = 'text'; // Declare outside try-catch for scope access
  
  try {
    const body = await c.req.json();
    const { messages, type: requestType = 'text', model = 'openai/gpt-3.5-turbo' } = body;
    type = requestType; // Assign the value

    if (!messages || !Array.isArray(messages)) {
      return c.json({ error: 'Invalid messages format' }, 400);
    }

    const openRouterKey = process.env.OPENROUTER_API_KEY;
    if (!openRouterKey) {
      // Fallback to mock responses if no API key
      return c.json({ 
        success: true, 
        response: getMockResponse(type),
        type,
        timestamp: new Date().toISOString(),
        note: 'Using mock response (no OpenRouter API key configured)'
      });
    }

    // Check if this is a multimodal request (contains images)
    const hasImages = messages.some(msg => 
      Array.isArray(msg.content) && 
      msg.content.some((part: any) => part.type === 'image')
    );

    if (hasImages) {
      // Use a multimodal model for image processing
      const multimodalModel = 'openai/gpt-4o'; // Full GPT-4 for better image processing
      
      try {
        const completion = await openai.chat.completions.create({
          model: multimodalModel,
          messages: messages as any, // Type assertion for multimodal messages
          max_tokens: 1000,
          temperature: 0.3
        });

        const aiResponse = completion.choices[0]?.message?.content;
        if (!aiResponse) {
          throw new Error('No response from multimodal API');
        }

        return c.json({ 
          success: true, 
          response: aiResponse,
          type: 'multimodal',
          model: multimodalModel,
          timestamp: new Date().toISOString(),
          source: 'OpenRouter Multimodal SDK'
        });
      } catch (multimodalError) {
        console.error('Multimodal API error:', multimodalError);
        // Fallback to mock response for image processing
        return c.json({ 
          success: true, 
          response: getMockResponse(type),
          type: 'multimodal',
          model: multimodalModel,
          timestamp: new Date().toISOString(),
          note: 'Using mock response due to multimodal API error'
        });
      }
    }

    // Handle text-only requests as before
    // Determine the type and create appropriate prompt
    let systemPrompt = 'You are a helpful study assistant.';
    let userPrompt = messages[messages.length - 1]?.content || '';
    
    if (typeof userPrompt !== 'string') {
      userPrompt = JSON.stringify(userPrompt);
    }

    switch (type) {
      case 'flashcards':
        systemPrompt = 'You are an expert study assistant. Generate comprehensive flashcards from the provided content. Return ONLY a valid JSON array with "question" and "answer" fields. Keep questions under 100 characters and answers under 200 characters.';
        userPrompt = `Generate flashcards from this content: ${userPrompt}`;
        break;
      case 'summary':
        systemPrompt = 'You are an expert study assistant. Create a concise summary of the provided content with key points and main ideas.';
        userPrompt = `Summarize this content: ${userPrompt}`;
        break;
      default:
        systemPrompt = 'You are a helpful study assistant. Provide clear, educational responses.';
    }

    // Use OpenRouter SDK instead of raw fetch
    const completion = await openai.chat.completions.create({
      model: model,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages
      ],
      max_tokens: type === 'flashcards' ? 1000 : 500,
      temperature: 0.7
    });

    const aiResponse = completion.choices[0]?.message?.content;
    if (!aiResponse) {
      throw new Error('No response from OpenRouter API');
    }

    // Parse flashcards if needed
    let response: string | any[] = aiResponse;
    if (type === 'flashcards') {
      try {
        // Try to parse as JSON, if it fails, return as-is
        const parsed = JSON.parse(aiResponse);
        if (Array.isArray(parsed)) {
          response = parsed;
        }
      } catch (e) {
        // If not valid JSON, return the raw response
        response = aiResponse;
      }
    }

    return c.json({ 
      success: true, 
      response,
      type,
      model,
      timestamp: new Date().toISOString(),
      source: 'OpenRouter SDK'
    });

  } catch (error) {
    console.error('AI generation error:', error);
    
    // Fallback to mock response on error
    return c.json({ 
      success: true, 
      response: getMockResponse(type),
      type,
      timestamp: new Date().toISOString(),
      note: 'Using mock response due to error'
    });
  }
});

// AI Flashcard endpoint using SDK
app.post("/ai/flashcards", async (c) => {
  let count = 5; // Declare outside try-catch for scope access
  
  try {
    const body = await c.req.json();
    const { content, count: requestCount = 5, model = 'openai/gpt-3.5-turbo' } = body;
    count = requestCount; // Assign the value

    if (!content) {
      return c.json({ error: 'Content is required' }, 400);
    }

    // Validate content length and quality
    if (content.trim().length < 20) {
      return c.json({ error: 'Content is too short. Please provide more detailed content for better flashcards.' }, 400);
    }

    // Ensure count is reasonable
    if (count < 1 || count > 20) {
      count = Math.min(Math.max(count, 1), 20);
    }

    const openRouterKey = process.env.OPENROUTER_API_KEY;
    if (!openRouterKey) {
      // Fallback to mock responses
      const mockFlashcards = Array.from({ length: Math.min(count, 10) }, (_, i) => ({
        question: `Mock Question ${i + 1} about the content`,
        answer: `Mock Answer ${i + 1} explaining the concept`
      }));
      
      return c.json({ 
        success: true, 
        flashcards: mockFlashcards,
        count: mockFlashcards.length,
        timestamp: new Date().toISOString(),
        note: 'Using mock response (no OpenRouter API key configured)'
      });
    }

    // Use OpenRouter SDK for flashcard generation
    const completion = await openai.chat.completions.create({
      model: model,
      messages: [
        { 
          role: 'system', 
          content: `You are an expert study assistant specializing in creating high-quality educational flashcards. 

CRITICAL REQUIREMENTS:
1. You MUST generate EXACTLY ${count} flashcards - no more, no less
2. Each flashcard must have a "question" and "answer" field
3. Questions should be clear, specific, and test understanding
4. Answers should be detailed, educational, and explain concepts clearly
5. Cover different aspects of the content (definitions, examples, processes, relationships)
6. Use ONLY the content provided - do not make up information
7. Return ONLY a valid JSON array with exactly ${count} flashcards

JSON FORMAT (exactly ${count} items):
[
  {"question": "What is...?", "answer": "Detailed explanation..."},
  {"question": "How does...?", "answer": "Comprehensive answer..."},
  {"question": "Why is...?", "answer": "Detailed explanation..."},
  {"question": "When does...?", "answer": "Comprehensive answer..."},
  {"question": "Where is...?", "answer": "Detailed explanation..."}
]

IMPORTANT: You must return exactly ${count} flashcards in valid JSON format.` 
        },
        { 
          role: 'user', 
          content: `Generate ${count} detailed, high-quality flashcards from this content: ${content}` 
        }
      ],
      max_tokens: 2000,
      temperature: 0.3
    });

    const aiResponse = completion.choices[0]?.message?.content;
    if (!aiResponse) {
      throw new Error('No response from OpenRouter API');
    }

    let flashcards;
    try {
      flashcards = JSON.parse(aiResponse);
      if (!Array.isArray(flashcards)) {
        throw new Error('Response is not an array');
      }
      
      // Validate flashcard structure and ensure we have the right count
      const validFlashcards = flashcards.filter(card => 
        card && 
        typeof card.question === 'string' && 
        typeof card.answer === 'string' &&
        card.question.trim().length > 0 &&
        card.answer.trim().length > 0
      );
      
      if (validFlashcards.length === 0) {
        throw new Error('No valid flashcards generated');
      }
      
      // If we don't have enough flashcards, generate more or use what we have
      if (validFlashcards.length < count) {
        console.log(`Generated ${validFlashcards.length} flashcards, requested ${count}`);
        // Use what we have, but log the difference
      }
      
      flashcards = validFlashcards;
      
    } catch (e) {
      console.error('Flashcard parsing error:', e);
      console.error('AI Response:', aiResponse);
      // Fallback to mock flashcards if parsing fails
      flashcards = Array.from({ length: Math.min(count, 10) }, (_, i) => ({
        question: `Question ${i + 1} about the content`,
        answer: `Answer ${i + 1} explaining the concept`
      }));
    }

    return c.json({ 
      success: true, 
      flashcards,
      count: flashcards.length,
      timestamp: new Date().toISOString(),
      source: 'OpenRouter SDK'
    });

  } catch (error) {
    console.error('Flashcard generation error:', error);
    
    // Fallback to mock flashcards
    const mockFlashcards = Array.from({ length: Math.min(count, 10) }, (_, i) => ({
      question: `Mock Question ${i + 1}`,
      answer: `Mock Answer ${i + 1}`
    }));

    return c.json({ 
      success: true, 
      flashcards: mockFlashcards,
      count: mockFlashcards.length,
      timestamp: new Date().toISOString(),
      note: 'Using mock response due to error'
    });
  }
});

// OCR endpoint specifically for extracting text from images
app.post("/ai/ocr", async (c) => {
  try {
    const body = await c.req.json();
    const { imageBase64, model = 'openai/gpt-4o' } = body;

    if (!imageBase64) {
      return c.json({ error: 'No image data provided' }, 400);
    }

    const openRouterKey = process.env.OPENROUTER_API_KEY;
    console.log('OCR endpoint - API key check:', {
      hasKey: !!openRouterKey,
      keyLength: openRouterKey ? openRouterKey.length : 0,
      keyPrefix: openRouterKey ? openRouterKey.substring(0, 10) + '...' : 'none'
    });
    
    if (!openRouterKey) {
      // Fallback to mock OCR response
      return c.json({ 
        success: true, 
        extractedText: getMockOCRResponse(),
        timestamp: new Date().toISOString(),
        note: 'Using mock OCR response (no OpenRouter API key configured)'
      });
    }

    try {
      // Try different image formats
      let completion;
      let lastError = null;
      
      // First try with detail: 'low'
      try {
        completion = await openai.chat.completions.create({
          model: model,
          messages: [
            {
              role: 'system',
              content: 'You are an OCR assistant. Extract all text from the provided image. Focus on handwritten notes, typed text, diagrams with labels, and any other readable content. Return the extracted text in a clean, organized format that preserves the structure and meaning of the original notes. If no text is visible, respond with "No readable text found in the image."'
            },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Please extract all text from this image of notes:'
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:image/jpeg;base64,${imageBase64}`,
                    detail: 'low'
                  }
                }
              ]
            }
          ],
          max_tokens: 1000,
          temperature: 0.1
        });
      } catch (error) {
        lastError = error;
        console.log(`First attempt failed with detail: 'low', trying without detail...`);
        
        // Try without detail parameter
        try {
          completion = await openai.chat.completions.create({
            model: model,
            messages: [
              {
                role: 'system',
                content: 'You are an OCR assistant. Extract all text from the provided image. Focus on handwritten notes, typed text, diagrams with labels, and any other readable content. Return the extracted text in a clean, organized format that preserves the structure and meaning of the original notes. If no text is visible, respond with "No readable text found in the image."'
              },
              {
                role: 'user',
                content: [
                  {
                    type: 'text',
                    text: 'Please extract all text from this image of notes:'
                  },
                  {
                    type: 'image_url',
                    image_url: {
                      url: `data:image/jpeg;base64,${imageBase64}`
                    }
                  }
                ]
              }
            ],
            max_tokens: 1000,
            temperature: 0.1
          });
        } catch (secondError) {
          lastError = secondError;
          console.log(`Second attempt also failed, trying with different model...`);
          
          // Try with gpt-4o-mini as fallback
          try {
            completion = await openai.chat.completions.create({
              model: 'openai/gpt-4o-mini',
              messages: [
                {
                  role: 'system',
                  content: 'You are an OCR assistant. Extract all text from the provided image. Focus on handwritten notes, typed text, diagrams with labels, and any other readable content. Return the extracted text in a clean, organized format that preserves the structure and meaning of the original notes. If no text is visible, respond with "No readable text found in the image."'
                },
                {
                  role: 'user',
                  content: [
                    {
                      type: 'text',
                      text: 'Please extract all text from this image of notes:'
                    },
                    {
                      type: 'image_url',
                      image_url: {
                        url: `data:image/jpeg;base64,${imageBase64}`
                      }
                    }
                  ]
                }
              ],
              max_tokens: 1000,
              temperature: 0.1
            });
          } catch (thirdError) {
            lastError = thirdError;
            throw lastError;
          }
        }
      }

      const extractedText = completion.choices[0]?.message?.content;
      if (!extractedText) {
        throw new Error('No response from OCR API');
      }

      return c.json({ 
        success: true, 
        extractedText,
        model,
        timestamp: new Date().toISOString(),
        source: 'OpenRouter Multimodal SDK'
      });

    } catch (ocrError) {
      console.error('OCR API error:', ocrError);
      console.error('OCR API error details:', {
        message: ocrError instanceof Error ? ocrError.message : 'Unknown error',
        stack: ocrError instanceof Error ? ocrError.stack : undefined,
        name: ocrError instanceof Error ? ocrError.name : 'Unknown'
      });
      // Fallback to mock OCR response
      return c.json({ 
        success: true, 
        extractedText: getMockOCRResponse(),
        timestamp: new Date().toISOString(),
        note: `Using mock OCR response due to API error: ${ocrError instanceof Error ? ocrError.message : 'Unknown error'}`,
        error: ocrError instanceof Error ? ocrError.message : 'Unknown error'
      });
    }

  } catch (error) {
    console.error('OCR endpoint error:', error);
    return c.json({ 
      success: false, 
      error: 'Failed to process image',
      timestamp: new Date().toISOString()
    });
  }
});

// Helper function for mock responses
function getMockResponse(type: string) {
  switch (type) {
    case 'flashcards':
      return [
        { question: "What is the main topic?", answer: "The main topic is the primary subject being discussed." },
        { question: "Define key concept", answer: "A key concept is a fundamental idea or principle." },
        { question: "What are the steps?", answer: "The steps are the sequential actions or processes." }
      ];
    case 'summary':
      return "This is a mock summary of the provided content. Key points include:\n• Main concept overview\n• Important details\n• Key takeaways";
    default:
      return "This is a mock AI response. The actual AI service will be available when OpenRouter is configured.";
  }
}

// Helper function for mock OCR responses
function getMockOCRResponse() {
  return `Sample Scanned Notes (Test Mode)

📚 Study Session Notes
Date: ${new Date().toISOString().split('T')[0]}

🔍 Key Concepts:
• Photosynthesis: Process by which plants convert light energy into chemical energy
• Cellular respiration: Breakdown of glucose to produce ATP
• Mitosis: Cell division process for growth and repair

📝 Important Details:
- Chloroplasts contain chlorophyll for light absorption
- Mitochondria are the powerhouse of the cell
- DNA replication occurs during S phase of cell cycle

💡 Study Tips:
1. Review diagrams and flowcharts
2. Practice with flashcards
3. Connect concepts to real-world examples

Note: This is a test response. Real OCR will extract actual text from your images when OpenRouter is configured.`;
}

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
        flashcards: "/ai/flashcards",
        ocr: "/ai/ocr"
      }
    },
    ai: {
      provider: "OpenRouter",
      status: process.env.OPENROUTER_API_KEY ? "Configured" : "Not configured (using mock responses)",
      sdk: "OpenAI SDK v4"
    }
  });
});

export default app;