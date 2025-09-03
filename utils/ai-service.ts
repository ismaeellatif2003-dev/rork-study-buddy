interface ContentPart {
  type: 'text' | 'image';
  text?: string;
  image?: string;
}

interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | ContentPart[];
}

export class AIService {
  private static readonly API_BASE = 'https://rork-study-buddy-production-eeeb.up.railway.app';
  private static readonly USE_MOCK = false; // Back to using real backend

  static async generateText(messages: AIMessage[]): Promise<string> {
    // Validate input
    if (!Array.isArray(messages) || messages.length === 0) {
      throw new Error('Invalid messages array provided');
    }
    
    // Use mock responses for development if needed
    if (this.USE_MOCK) {
      return this.getMockResponse(messages);
    }
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      // Validate messages structure
      const validMessages = messages.filter(msg => 
        msg && 
        typeof msg.role === 'string' && 
        (typeof msg.content === 'string' || Array.isArray(msg.content))
      );
      
      if (validMessages.length === 0) {
        throw new Error('No valid messages found');
      }

      // Determine the type based on the last message content
      const lastMessage = messages[messages.length - 1];
      const content = typeof lastMessage.content === 'string' ? lastMessage.content : '';
      let type = 'text';
      
      if (content.includes('flashcard') || content.includes('question') || content.includes('answer')) {
        type = 'flashcards';
      } else if (content.includes('summarize') || content.includes('summary')) {
        type = 'summary';
      }
      
      const response = await fetch(`${this.API_BASE}/ai/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: validMessages, type }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`AI request failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      if (!data || !data.success) {
        throw new Error('Invalid response format from AI service');
      }
      
      // Handle different response types
      if (type === 'flashcards' && Array.isArray(data.response)) {
        return JSON.stringify(data.response);
      }
      
      return data.response || 'No response generated';
    } catch (error) {
      console.error('AI Service Error:', error);
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('AI request timed out. Please try again.');
        }
        if (error.message.includes('Failed to fetch') || error.message.includes('Network request failed')) {
          throw new Error('Network error. Please check your internet connection.');
        }
      }
      throw new Error('Failed to generate AI response. Please try again.');
    }
  }

  static async generateFlashcards(content: string, count: number = 5): Promise<any[]> {
    if (this.USE_MOCK) {
      return this.getMockFlashcards(count);
    }

    try {
      const response = await fetch(`${this.API_BASE}/ai/flashcards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content, count }),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`Flashcard generation failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      if (!data || !data.success) {
        throw new Error('Invalid response format from flashcard service');
      }

      return data.flashcards || [];
    } catch (error) {
      console.error('Flashcard Service Error:', error);
      throw new Error('Failed to generate flashcards. Please try again.');
    }
  }

  private static getMockResponse(messages: AIMessage[]): string {
    const lastMessage = messages[messages.length - 1];
    const content = typeof lastMessage.content === 'string' ? lastMessage.content : '';
    
    // Check if it's a flashcard request
    if (content.includes('flashcard') || content.includes('question') || content.includes('answer')) {
      return JSON.stringify([
        { question: "What is the main topic?", answer: "The main topic is the primary subject being discussed." },
        { question: "Define key concept", answer: "A key concept is a fundamental idea or principle." },
        { question: "What are the steps?", answer: "The steps are the sequential actions or processes." },
        { question: "Why is this important?", answer: "This is important because it provides essential knowledge." },
        { question: "How does it work?", answer: "It works through a systematic process or mechanism." }
      ]);
    }
    
    // Check if it's a summary request
    if (content.includes('summarize') || content.includes('summary')) {
      return "This is a mock summary of the provided content. Key points include:\n• Main concept overview\n• Important details\n• Key takeaways\n• Related concepts";
    }
    
    // Default response
    return "This is a mock AI response. The actual AI service will be available when the backend is properly configured.";
  }

  private static getMockFlashcards(count: number): any[] {
    return Array.from({ length: Math.min(count, 10) }, (_, i) => ({
      question: `Mock Question ${i + 1}`,
      answer: `Mock Answer ${i + 1}`
    }));
  }

  private static getMockOCRResponse(): string {
    return `Sample Scanned Notes (Test Mode)

📚 Study Session Notes
Date: ${new Date().toLocaleDateString()}

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

Note: This is a test response. Real OCR will extract actual text from your images when the backend is fully configured.`;
  }

  static async summarizeNotes(content: string): Promise<string> {
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      throw new Error('Invalid content provided for summarization');
    }
    
    const messages: AIMessage[] = [
      {
        role: 'system',
        content: 'You are a study assistant. Create a clear, concise summary of the provided notes. Focus on key concepts, main ideas, and important details. Format the summary with bullet points and clear sections.',
      },
      {
        role: 'user',
        content: `Please summarize these study notes:\n\n${content.trim()}`,
      },
    ];

    return this.generateText(messages);
  }

  static async answerQuestion(question: string, context: string): Promise<string> {
    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      throw new Error('Invalid question provided');
    }
    
    if (!context || typeof context !== 'string' || context.trim().length === 0) {
      throw new Error('Invalid context provided');
    }
    
    const messages: AIMessage[] = [
      {
        role: 'system',
        content: 'You are a study assistant. Answer the user\'s question based ONLY on the provided study notes. If the answer is not in the notes, say "I don\'t have enough information in your notes to answer that question." Be helpful and educational.',
      },
      {
        role: 'user',
        content: `Study Notes:\n${context.trim()}\n\nQuestion: ${question.trim()}`,
      },
    ];

    return this.generateText(messages);
  }

  static async extractTextFromImageFile(imageFile: File): Promise<string> {
    try {
      console.log('Processing image file:', imageFile.name, 'Size:', imageFile.size, 'Type:', imageFile.type);
      
      const formData = new FormData();
      formData.append('image', imageFile);
      formData.append('model', 'openai/gpt-4o');

      const response = await fetch(`${this.API_BASE}/ai/ocr`, {
        method: 'POST',
        body: formData, // Send as multipart form data
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.error('OCR API Error:', response.status, errorText);
        throw new Error(`OCR request failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('OCR Response:', data);
      
      if (!data || !data.success) {
        throw new Error('Invalid response format from OCR service');
      }
      
      return data.extractedText || 'No text extracted from image';
    } catch (error) {
      console.error('OCR File Service Error:', error);
      
      // Fallback to mock response if OCR fails
      if (this.USE_MOCK) {
        return this.getMockOCRResponse();
      }
      
      throw new Error('Failed to extract text from image. Please try again with a clearer image.');
    }
  }

  static async extractTextFromImage(imageBase64: string): Promise<string> {
    try {
      console.log('Processing base64 image, length:', imageBase64.length);
      
      const response = await fetch(`${this.API_BASE}/ai/ocr`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageBase64 }),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.error('OCR API Error:', response.status, errorText);
        throw new Error(`OCR request failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('OCR Response:', data);
      
      if (!data || !data.success) {
        throw new Error('Invalid response format from OCR service');
      }
      
      return data.extractedText || 'No text extracted from image';
    } catch (error) {
      console.error('OCR Service Error:', error);
      
      // Fallback to mock response if OCR fails
      if (this.USE_MOCK) {
        return this.getMockOCRResponse();
      }
      
      throw new Error('Failed to extract text from image. Please try again with a clearer image.');
    }
  }

  static async generateFlashcardsFromImage(imageBase64: string, useAIEnhancement: boolean = false, userContext?: string): Promise<{ question: string; answer: string }[]> {
    // First extract text from the image
    const extractedText = await this.extractTextFromImage(imageBase64);
    
    // Then generate flashcards from the extracted text
    return this.generateFlashcards(extractedText, useAIEnhancement, userContext);
  }

  static async generateFlashcardsFromImageFile(imageFile: File, useAIEnhancement: boolean = false, userContext?: string): Promise<{ question: string; answer: string }[]> {
    // First extract text from the image file
    const extractedText = await this.extractTextFromImageFile(imageFile);
    
    // Then generate flashcards from the extracted text
    return this.generateFlashcards(extractedText, useAIEnhancement, userContext);
  }
}