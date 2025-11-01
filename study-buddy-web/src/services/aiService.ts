const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://rork-study-buddy-production-eeeb.up.railway.app';

export interface AIRequest {
  messages?: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string | Array<{ type: 'text' | 'image_url'; text?: string; image_url?: { url: string } }>;
  }>;
  content?: string;
  count?: number;
  model?: string;
  type?: 'text' | 'flashcards';
  imageBase64?: string;
  prompt?: string;
  wordCount?: number;
  level?: string;
  citationStyle?: string;
  mode?: string;
  fileIds?: string[];
  rubric?: string;
  essayTopic?: string;
  sampleEssayId?: string;
  outlineId?: string;
  paragraphIndex?: number;
  paragraphTitle?: string;
  intendedChunks?: Array<{ excerpt: string }>;
  suggestedWordCount?: number;
  academicLevel?: string;
  references?: Array<{ name: string; excerpt: string }>;
  assignmentTitle?: string;
}

export interface AIResponse {
  success: boolean;
  response?: string;
  summary?: string;
  flashcards?: Array<{ front: string; back: string }>;
  outlineId?: string;
  thesis?: string;
  paragraphs?: Array<{
    title: string;
    intendedChunks: Array<{ excerpt: string }>;
    suggestedWordCount: number;
  }>;
  paragraphText?: string;
  usedChunks?: Array<{ label: string; page: number }>;
  citations?: Array<{ text: string; source: string }>;
  unsupportedFlags?: Array<{ sentence: string; reason: string }>;
  analysis?: Record<string, {
    relevanceScore: number;
    keyTopics: string[];
    summary: string;
    confidence: number;
    sourceCredibility: string;
    sourceType: string;
    domain: string;
  }>;
  smartSelection?: {
    selectedReferences: string[];
    excludedReferences: string[];
    reasoning: string;
    totalReferences: number;
    selectedCount: number;
    credibilityFilter: string;
  };
  error?: string;
  timestamp?: string;
  source?: string;
}

class AIService {
  private async makeRequest(endpoint: string, data: AIRequest): Promise<AIResponse> {
    try {
      console.log(`🌐 Making request to: ${API_BASE_URL}${endpoint}`);
      console.log('📤 Request data:', data);
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      console.log('📡 Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ HTTP Error Response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('📥 Response data:', result);
      return result;
    } catch (error) {
      console.error(`AI Service Error (${endpoint}):`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  // General AI generation
  async generateText(request: AIRequest): Promise<AIResponse> {
    return this.makeRequest('/ai/generate', request);
  }

  // Flashcard generation
  async generateFlashcards(request: AIRequest): Promise<AIResponse> {
    // Transform the request to match backend expectations
    let transformedRequest: AIRequest;
    
    if (request.messages && request.messages.length > 0) {
      // Extract content from messages array
      const userMessage = request.messages.find(msg => msg.role === 'user');
      const content = userMessage?.content as string || '';
      transformedRequest = {
        content,
        count: request.count || 5,
        model: request.model || 'openai/gpt-3.5-turbo'
      };
    } else {
      // Use the request as-is if it already has content
      transformedRequest = request;
    }
    
    return this.makeRequest('/ai/flashcards', transformedRequest);
  }

  // Summary generation
  async generateSummary(request: AIRequest): Promise<AIResponse> {
    console.log('🎯 aiService.generateSummary called with:', request);
    
    // Transform the request to match backend expectations
    let transformedRequest: AIRequest;
    
    if (request.messages && request.messages.length > 0) {
      // Extract content from messages array
      const userMessage = request.messages.find(msg => msg.role === 'user');
      const content = userMessage?.content as string || '';
      transformedRequest = {
        content,
        type: 'text',
        model: request.model || 'openai/gpt-3.5-turbo',
        messages: request.messages
      };
    } else {
      // Use the request as-is if it already has content
      transformedRequest = {
        ...request,
        type: 'text'
      };
    }
    
    console.log('📡 Sending transformed request to backend:', transformedRequest);
    return this.makeRequest('/ai/generate', transformedRequest);
  }

  // OCR text extraction
  async extractTextFromImage(request: AIRequest): Promise<AIResponse> {
    return this.makeRequest('/ai/ocr', request);
  }

  // Essay outline generation
  async generateEssayOutline(request: AIRequest): Promise<AIResponse> {
    return this.makeRequest('/ai/essay/generate-outline', request);
  }

  // Essay paragraph expansion
  async expandParagraph(request: AIRequest): Promise<AIResponse> {
    return this.makeRequest('/ai/essay/expand-paragraph', request);
  }

  // Reference analysis
  async analyzeReferences(request: AIRequest): Promise<AIResponse> {
    return this.makeRequest('/ai/essay/analyze-references', request);
  }

  // Personalized chat using user's notes as context
  async personalizedChat(question: string, conversationHistory: Array<{role: string, content: string}>, authToken?: string): Promise<AIResponse> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await fetch(`${API_BASE_URL}/ai/personalized-chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          question,
          conversationHistory
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      return {
        success: result.success,
        response: result.response,
        error: result.error,
        contextNotes: result.contextNotes,
        topics: result.topics,
        timestamp: result.timestamp
      };
    } catch (error) {
      console.error('Personalized chat error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  // Generate embedding for text
  async generateEmbedding(text: string): Promise<AIResponse> {
    return this.makeRequest('/ai/embed', { text });
  }
}

export const aiService = new AIService();
