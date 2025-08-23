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
  private static readonly API_BASE = 'https://toolkit.rork.com';

  static async generateText(messages: AIMessage[]): Promise<string> {
    // Validate input
    if (!Array.isArray(messages) || messages.length === 0) {
      throw new Error('Invalid messages array provided');
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
      
      const response = await fetch(`${this.API_BASE}/text/llm/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: validMessages }),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`AI request failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      if (!data || typeof data.completion !== 'string') {
        throw new Error('Invalid response format from AI service');
      }
      
      return data.completion;
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

  static async generateFlashcards(content: string, useAIEnhancement: boolean = false, userContext?: string): Promise<{ question: string; answer: string }[]> {
    const baseSystemPrompt = useAIEnhancement 
      ? 'You are an expert study assistant and educator. Generate comprehensive flashcards from the provided notes with AI-enhanced content. For each concept, create detailed questions that test deep understanding, add context and examples, provide memory aids, and include related concepts. Make answers thorough but clear, adding explanations, mnemonics, real-world applications, and connections to other topics when helpful. Return ONLY a valid JSON array of objects with "question" and "answer" fields. Generate 8-15 flashcards depending on content complexity. Example format: [{"question": "What is... (include context and why it matters)", "answer": "The answer is... (include explanation, example, and memory aid)"}]'
      : 'You are a study assistant. Generate flashcards from the provided notes. Create clear, specific questions with concise answers. Return ONLY a valid JSON array of objects with "question" and "answer" fields. Do not include any markdown formatting, code blocks, or additional text. Generate 5-10 flashcards depending on the content length. Example format: [{"question": "What is...", "answer": "The answer is..."}]';
    
    const systemPrompt = userContext 
      ? `${baseSystemPrompt}\n\nIMPORTANT: ${userContext}`
      : baseSystemPrompt;

    const userPrompt = useAIEnhancement
      ? `Generate AI-enhanced flashcards from these notes. Make them comprehensive with detailed explanations, examples, and memory aids:\n\n${content}`
      : `Generate flashcards from these notes:\n\n${content}`;

    const messages: AIMessage[] = [
      {
        role: 'system',
        content: systemPrompt,
      },
      {
        role: 'user',
        content: userPrompt,
      },
    ];

    const response = await this.generateText(messages);
    console.log('Raw flashcards response:', response);
    
    try {
      // Clean the response by removing markdown code blocks and extra whitespace
      let cleanedResponse = response.trim();
      
      // Remove markdown code blocks (```json ... ``` or ``` ... ```)
      cleanedResponse = cleanedResponse.replace(/^```(?:json)?\s*/gm, '').replace(/\s*```$/gm, '');
      
      // Remove any leading/trailing backticks (single or multiple)
      cleanedResponse = cleanedResponse.replace(/^`+|`+$/g, '');
      
      // Remove any backticks that might be in the middle of the response
      cleanedResponse = cleanedResponse.replace(/`/g, '');
      
      // Remove any extra whitespace and newlines
      cleanedResponse = cleanedResponse.replace(/\n\s*\n/g, '\n').trim();
      
      // If the response doesn't start with [ or {, try to find the JSON part
      if (!cleanedResponse.startsWith('[') && !cleanedResponse.startsWith('{')) {
        const jsonMatch = cleanedResponse.match(/\[.*\]/s) || cleanedResponse.match(/\{.*\}/s);
        if (jsonMatch) {
          cleanedResponse = jsonMatch[0];
        }
      }
      
      console.log('Cleaned flashcards response:', cleanedResponse);
      
      const flashcards = JSON.parse(cleanedResponse);
      if (Array.isArray(flashcards) && flashcards.length > 0) {
        // Validate that each flashcard has question and answer
        const validFlashcards = flashcards.filter(card => 
          card && typeof card.question === 'string' && typeof card.answer === 'string'
        );
        if (validFlashcards.length > 0) {
          return validFlashcards;
        }
      }
    } catch (error) {
      console.error('Failed to parse flashcards JSON:', error);
      console.error('Response that failed to parse:', response);
    }

    // Fallback: parse text format
    console.log('Using fallback parsing for flashcards');
    const lines = response.split('\n').filter(line => line.trim());
    const flashcards: { question: string; answer: string }[] = [];
    
    // Try to extract Q&A pairs from various formats
    let currentQuestion = '';
    let currentAnswer = '';
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine) continue;
      
      // Check for question patterns
      if (trimmedLine.match(/^(Q:|Question:|\d+\.|-)\s*/i)) {
        if (currentQuestion && currentAnswer) {
          flashcards.push({ question: currentQuestion, answer: currentAnswer });
        }
        currentQuestion = trimmedLine.replace(/^(Q:|Question:|\d+\.|-)\s*/i, '').trim();
        currentAnswer = '';
      }
      // Check for answer patterns
      else if (trimmedLine.match(/^(A:|Answer:)\s*/i)) {
        currentAnswer = trimmedLine.replace(/^(A:|Answer:)\s*/i, '').trim();
      }
      // If we have a question but no answer yet, this might be the answer
      else if (currentQuestion && !currentAnswer) {
        currentAnswer = trimmedLine;
      }
    }
    
    // Add the last Q&A pair if exists
    if (currentQuestion && currentAnswer) {
      flashcards.push({ question: currentQuestion, answer: currentAnswer });
    }
    
    // If still no flashcards, create some basic ones from the content
    if (flashcards.length === 0) {
      const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
      for (let i = 0; i < Math.min(3, sentences.length); i++) {
        const sentence = sentences[i].trim();
        if (sentence) {
          flashcards.push({
            question: `What can you tell me about: ${sentence.substring(0, 50)}...?`,
            answer: sentence
          });
        }
      }
    }

    return flashcards;
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

  static async extractTextFromImage(imageBase64: string): Promise<string> {
    const messages: AIMessage[] = [
      {
        role: 'system',
        content: 'You are an OCR assistant. Extract all text from the provided image. Focus on handwritten notes, typed text, diagrams with labels, and any other readable content. Return the extracted text in a clean, organized format that preserves the structure and meaning of the original notes.',
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Please extract all text from this image of notes:'
          },
          {
            type: 'image',
            image: imageBase64
          }
        ],
      },
    ];

    return this.generateText(messages);
  }

  static async generateFlashcardsFromImage(imageBase64: string, useAIEnhancement: boolean = false, userContext?: string): Promise<{ question: string; answer: string }[]> {
    // First extract text from the image
    const extractedText = await this.extractTextFromImage(imageBase64);
    
    // Then generate flashcards from the extracted text
    return this.generateFlashcards(extractedText, useAIEnhancement, userContext);
  }
}